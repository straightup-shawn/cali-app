/**
 * Haptic Feedback Utility
 * 
 * Uses the Vibration API to provide tactile feedback on supported devices.
 * Falls back silently on devices without vibration support.
 */

/**
 * Light tap — for button presses, toggles, selections
 */
export function hapticLight(): void {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * Medium tap — for completing a set, saving something, pull-to-refresh trigger
 */
export function hapticMedium(): void {
  if (navigator.vibrate) {
    navigator.vibrate(20);
  }
}

/**
 * Success — for achievements, PRs, skill unlocks
 */
export function hapticSuccess(): void {
  if (navigator.vibrate) {
    navigator.vibrate([15, 50, 15]);
  }
}

/**
 * Heavy — for finishing a workout, major action confirmations
 */
export function hapticHeavy(): void {
  if (navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
  }
}

/**
 * Error/warning — for failed actions, discard confirmations
 */
export function hapticError(): void {
  if (navigator.vibrate) {
    navigator.vibrate([40, 30, 40, 30, 40]);
  }
}

/**
 * Celebration — for PRs, first unlocks, milestones
 */
export function hapticCelebration(): void {
  if (navigator.vibrate) {
    navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]);
  }
}
