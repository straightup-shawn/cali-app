/**
 * Haptic/Audio Feedback Utility
 * 
 * Uses Web Audio API to generate subtle micro-sounds as haptic substitutes.
 * Works on iOS Safari (where Vibration API is unavailable).
 * Audio context must be initialized from a user gesture (first tap).
 */

let audioCtx: AudioContext | null = null;

/**
 * Initialize audio context on first user interaction.
 * Call this from any touchstart/click handler early in the app lifecycle.
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
 * Play a short synthesized tone.
 * @param freq - Frequency in Hz
 * @param duration - Duration in seconds
 * @param volume - Volume 0-1
 * @param type - Oscillator type
 */
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

/**
 * Light tap — nav switches, toggles, minor selections
 * Short high-frequency click
 */
export function hapticLight(): void {
  // Try vibration first (Android)
  if (navigator.vibrate) {
    navigator.vibrate(10);
    return;
  }
  // Audio fallback (iOS)
  playTone(4200, 0.015, 0.06, 'sine');
}

/**
 * Medium tap — set completion, saves, pull-to-refresh
 * Slightly longer mid-frequency pop
 */
export function hapticMedium(): void {
  if (navigator.vibrate) {
    navigator.vibrate(20);
    return;
  }
  playTone(2800, 0.025, 0.08, 'sine');
}

/**
 * Success — achievements, PRs, skill unlocks
 * Two-note ascending chime
 */
export function hapticSuccess(): void {
  if (navigator.vibrate) {
    navigator.vibrate([15, 50, 15]);
    return;
  }
  playTone(1200, 0.04, 0.07, 'sine');
  setTimeout(() => playTone(1800, 0.06, 0.09, 'sine'), 50);
}

/**
 * Heavy — finishing a workout, major confirmations
 * Low thud
 */
export function hapticHeavy(): void {
  if (navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
    return;
  }
  playTone(200, 0.04, 0.12, 'triangle');
}

/**
 * Error/warning — failed actions, discard confirmations
 * Low buzz
 */
export function hapticError(): void {
  if (navigator.vibrate) {
    navigator.vibrate([40, 30, 40, 30, 40]);
    return;
  }
  playTone(150, 0.05, 0.1, 'sawtooth');
  setTimeout(() => playTone(120, 0.05, 0.08, 'sawtooth'), 60);
}

/**
 * Celebration — PRs, first unlocks, milestones
 * Ascending three-note chime
 */
export function hapticCelebration(): void {
  if (navigator.vibrate) {
    navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]);
    return;
  }
  playTone(800, 0.05, 0.06, 'sine');
  setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 80);
  setTimeout(() => playTone(1600, 0.08, 0.10, 'sine'), 180);
}
