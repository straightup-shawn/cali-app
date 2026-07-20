import type { ActiveWorkout } from '@/types';

// =============================================================================
// Configuration
// =============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

const PENDING_SYNC_KEY = 'calisthenics-log:pending-sync';

// =============================================================================
// Exponential Backoff Retry
// =============================================================================

/**
 * Calculates the delay for a given attempt using exponential backoff.
 * delay = min(baseDelayMs * 2^attempt, maxDelayMs)
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Pick<RetryConfig, 'baseDelayMs' | 'maxDelayMs'>
): number {
  const delay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Generic retry wrapper with exponential backoff.
 * Executes the operation and retries on failure up to maxRetries times.
 */
export async function syncWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('Sync failed after retries');
}

// =============================================================================
// Pending Sync Queue (localStorage)
// =============================================================================

export interface PendingSyncItem {
  id: string;
  workout: ActiveWorkout;
  queuedAt: string;
  attempts: number;
}

/**
 * Retrieves all pending sync items from localStorage.
 */
export function getPendingSyncItems(): PendingSyncItem[] {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PendingSyncItem[];
  } catch {
    return [];
  }
}

/**
 * Adds a completed workout to the pending sync queue.
 * Used when the device is offline at workout completion time.
 */
export function addToPendingSync(workout: ActiveWorkout): void {
  try {
    const items = getPendingSyncItems();
    const newItem: PendingSyncItem = {
      id: workout.id,
      workout,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
    // Avoid duplicates
    const filtered = items.filter((item) => item.id !== workout.id);
    filtered.push(newItem);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch {
    console.warn('Failed to add workout to pending sync queue');
  }
}

/**
 * Removes a successfully synced item from the pending queue.
 */
export function removePendingItem(id: string): void {
  try {
    const items = getPendingSyncItems();
    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch {
    console.warn('Failed to remove item from pending sync queue');
  }
}

/**
 * Updates the attempt count for a pending sync item.
 */
export function incrementPendingItemAttempts(id: string): void {
  try {
    const items = getPendingSyncItems();
    const updated = items.map((item) =>
      item.id === id ? { ...item, attempts: item.attempts + 1 } : item
    );
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
  } catch {
    console.warn('Failed to update pending sync item');
  }
}
