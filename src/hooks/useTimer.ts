import { useState, useRef, useCallback, useEffect } from 'react';

export interface TimerConfig {
  mode: 'countup' | 'countdown';
  initialSeconds?: number;
  onComplete?: () => void;
}

export interface TimerState {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
  adjustTime: (deltaSeconds: number) => void;
}

/**
 * Independent timer hook supporting countup and countdown modes.
 * Uses epoch-based reference to prevent drift.
 *
 * - Countup: counts elapsed seconds from 0 (or initialSeconds).
 * - Countdown: counts remaining seconds down from initialSeconds, fires onComplete at 0.
 */
export function useTimer(config: TimerConfig): TimerState {
  const { mode, initialSeconds = 0, onComplete } = config;

  const [seconds, setSeconds] = useState(mode === 'countdown' ? initialSeconds : 0);
  const [isRunning, setIsRunning] = useState(false);

  // Refs to prevent stale closures and avoid unnecessary re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startEpochRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(mode === 'countdown' ? initialSeconds : 0);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref in sync without causing re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startEpochRef.current) / 1000);

    if (mode === 'countup') {
      const newSeconds = accumulatedRef.current + elapsed;
      setSeconds(newSeconds);
    } else {
      // countdown
      const newSeconds = Math.max(0, accumulatedRef.current - elapsed);
      setSeconds(newSeconds);

      if (newSeconds <= 0) {
        clearTimer();
        setIsRunning(false);
        onCompleteRef.current?.();
      }
    }
  }, [mode, clearTimer]);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return; // already running

    // For countdown, don't start if already at 0
    if (mode === 'countdown' && accumulatedRef.current <= 0) return;

    startEpochRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = setInterval(tick, 1000);
    // Fire an immediate tick so UI updates without waiting 1s
    tick();
  }, [mode, tick]);

  const pause = useCallback(() => {
    if (intervalRef.current === null) return; // not running

    const elapsed = Math.floor((Date.now() - startEpochRef.current) / 1000);

    if (mode === 'countup') {
      accumulatedRef.current = accumulatedRef.current + elapsed;
    } else {
      accumulatedRef.current = Math.max(0, accumulatedRef.current - elapsed);
    }

    clearTimer();
    setIsRunning(false);
    setSeconds(accumulatedRef.current);
  }, [mode, clearTimer]);

  const reset = useCallback(
    (newSeconds?: number) => {
      clearTimer();
      setIsRunning(false);

      const resetValue = newSeconds ?? (mode === 'countdown' ? initialSeconds : 0);
      accumulatedRef.current = resetValue;
      setSeconds(resetValue);
    },
    [mode, initialSeconds, clearTimer],
  );

  const adjustTime = useCallback(
    (deltaSeconds: number) => {
      if (isRunning) {
        // While running, adjust the accumulated base so next tick reflects change
        const elapsed = Math.floor((Date.now() - startEpochRef.current) / 1000);

        if (mode === 'countup') {
          const current = accumulatedRef.current + elapsed;
          const adjusted = Math.max(0, current + deltaSeconds);
          // Reset epoch and set accumulated to adjusted value
          accumulatedRef.current = adjusted;
          startEpochRef.current = Date.now();
          setSeconds(adjusted);
        } else {
          const current = Math.max(0, accumulatedRef.current - elapsed);
          const adjusted = Math.max(0, current + deltaSeconds);
          accumulatedRef.current = adjusted;
          startEpochRef.current = Date.now();
          setSeconds(adjusted);
        }
      } else {
        // While paused, simply adjust the accumulated value
        const adjusted = Math.max(0, accumulatedRef.current + deltaSeconds);
        accumulatedRef.current = adjusted;
        setSeconds(adjusted);
      }
    },
    [isRunning, mode],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { seconds, isRunning, start, pause, reset, adjustTime };
}
