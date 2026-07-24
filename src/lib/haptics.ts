/**
 * Haptic Feedback Utility
 * 
 * Uses two strategies:
 * 1. Vibration API (Android)
 * 2. Web Audio API micro-sounds (iOS fallback — real haptics patched in iOS 26.5+)
 */

// =============================================================================
// Web Audio fallback
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

function playTone(
  freq: number,
  duration: number,
  volume: number = 0.08,
  type: OscillatorType = 'sine',
): void {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
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
  playTone(4200, 0.015, 0.06, 'sine');
}

/**
 * Medium tap — set completion, saves, pull-to-refresh
 */
export function hapticMedium(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate(20);
    return;
  }
  playTone(2800, 0.025, 0.08, 'sine');
}

/**
 * Success — achievements, PRs, skill unlocks
 */
export function hapticSuccess(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([15, 50, 15]);
    return;
  }
  playTone(1200, 0.04, 0.07, 'sine');
  setTimeout(() => playTone(1800, 0.06, 0.09, 'sine'), 50);
}

/**
 * Heavy — finishing a workout, major confirmations
 */
export function hapticHeavy(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
    return;
  }
  playTone(200, 0.04, 0.12, 'triangle');
}

/**
 * Error/warning — failed actions, discard confirmations
 */
export function hapticError(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([40, 30, 40, 30, 40]);
    return;
  }
  playTone(150, 0.05, 0.1, 'sawtooth');
  setTimeout(() => playTone(120, 0.05, 0.08, 'sawtooth'), 60);
}

/**
 * Celebration — PRs, first unlocks, milestones
 */
export function hapticCelebration(): void {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]);
    return;
  }
  playTone(800, 0.05, 0.06, 'sine');
  setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 80);
  setTimeout(() => playTone(1600, 0.08, 0.10, 'sine'), 180);
}
