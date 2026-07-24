import { useState, useRef, useCallback, type ReactNode } from 'react';
import { hapticMedium } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 80; // px to pull before triggering
const MAX_PULL = 120; // max visual pull distance

/**
 * PullToRefresh wrapper — shows a spinner when user pulls down from the top.
 * Only triggers when scroll position is at the very top (scrollTop === 0).
 */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start tracking if scrolled to top
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || refreshing) return;
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startYRef.current = null;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Apply resistance curve (diminishing returns)
      const distance = Math.min(MAX_PULL, diff * 0.5);
      setPullDistance(distance);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (pullDistance >= THRESHOLD && !refreshing) {
      hapticMedium();
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6); // Hold at spinner position
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{ height: pullDistance > 0 || refreshing ? `${pullDistance}px` : '0px' }}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 ${
            refreshing ? 'animate-spin' : ''
          }`}
          style={{
            opacity: Math.min(1, pullDistance / THRESHOLD),
            transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
          }}
        >
          <svg
            className="h-5 w-5 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>

      {children}
    </div>
  );
}
