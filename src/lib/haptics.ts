/**
 * Haptic Feedback Utility
 * 
 * Uses two strategies:
 * 1. Vibration API (Android)
 * 2. Sub-bass audio thuds (iOS — mimics haptic tap feel through speaker)
 */

// =============================================================================
// Web Audio — sub-bass haptic simulation
// =============================================================================

let audioCtx: AudioContext | null = null;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Initialize audio context on first user interaction.
 */
export function initHapticAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    // Audio not supported
  }
}

/**
 * Play a haptic-like thud — very short, low frequency burst that
 * rattles the iPhone speaker to simulate a physical tap.
 */
function playThud(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;

    // Sub-bass frequency that moves air
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Tuned for maximum physical feel through iPhone speaker
    const freqMap = { light: 60, medium: 40, heavy: 25 };
    const volMap = { light: 0.9, medium: 1.0, heavy: 1.0 };
    const durMap = { light: 0.025, medium: 0.04, heavy: 0.06 };

    osc.type = 'square'; // Square wave has more punch than sine
    osc.frequency.setValueAtTime(freqMap[intensity], now);

    // Maximum attack, fast decay — impulse hit
    gain.gain.setValueAtTime(volMap[intensity], now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durMap[intensity]);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + durMap[intensity] + 0.01);
  } catch {
    // Silently fail
  }
}

// =============================================================================
// Public haptic functions
// =============================================================================

/**
 * Light tap — nav switches, toggles, minor selections
 */
export function hapticLight(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate(10);
    return;
  }
  playThud('light');
}

/**
 * Medium tap — set completion, saves, pull-to-refresh
 */
export function hapticMedium(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate(20);
    return;
  }
  playThud('medium');
}

/**
 * Success — achievements, PRs, skill unlocks
 */
export function hapticSuccess(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([15, 50, 15]);
    return;
  }
  playThud('light');
  setTimeout(() => playThud('medium'), 60);
}

/**
 * Heavy — finishing a workout, major confirmations
 */
export function hapticHeavy(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
    return;
  }
  playThud('heavy');
}

/**
 * Error/warning — failed actions, discard confirmations
 */
export function hapticError(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([40, 30, 40, 30, 40]);
    return;
  }
  playThud('medium');
  setTimeout(() => playThud('medium'), 70);
}

/**
 * Celebration — PRs, first unlocks, milestones
 */
export function hapticCelebration(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]);
    return;
  }
  playThud('light');
  setTimeout(() => playThud('medium'), 80);
  setTimeout(() => playThud('heavy'), 180);
}
