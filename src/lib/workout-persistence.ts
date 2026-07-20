import type { ActiveWorkout } from '@/types';

const STORAGE_KEY = 'calisthenics-log:active-workout';

/**
 * Persists the current active workout state to localStorage.
 * Called on every state mutation.
 */
export function persistWorkout(workout: ActiveWorkout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workout));
  } catch {
    // localStorage may be full or unavailable; silently fail
    console.warn('Failed to persist workout to localStorage');
  }
}

/**
 * Loads a previously persisted active workout from localStorage.
 * Returns null if no persisted workout exists or parsing fails.
 */
export function loadPersistedWorkout(): ActiveWorkout | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ActiveWorkout;
  } catch {
    // Corrupted data; clear and return null
    clearPersistedWorkout();
    return null;
  }
}

/**
 * Clears the persisted active workout from localStorage.
 * Called on finish or discard.
 */
export function clearPersistedWorkout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks whether a persisted workout exists in localStorage.
 */
export function hasPersistedWorkout(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Registers a beforeunload event listener as a safety net to persist
 * the active workout when the page is about to close unexpectedly.
 * Returns a cleanup function to remove the listener.
 */
export function setupBeforeUnloadPersistence(
  getWorkout: () => ActiveWorkout | null,
): () => void {
  function handleBeforeUnload() {
    const workout = getWorkout();
    if (workout) {
      persistWorkout(workout);
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}
