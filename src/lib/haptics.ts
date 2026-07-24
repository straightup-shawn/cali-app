/**
 * Haptic Feedback Utility
 * 
 * Uses three strategies in priority order:
 * 1. iOS 18+ hidden checkbox switch trick (real haptic via WebKit form switch)
 * 2. Vibration API (Android)
 * 3. Web Audio API micro-sounds (fallback for older iOS)
 */

// =============================================================================
// iOS Haptic via hidden <input type="checkbox" switch> trick
// Works on iOS 18+ — toggling a switch input fires a native haptic
// =============================================================================

let iosHapticReady = false;
let iosCheckbox: HTMLInputElement | null = null;
let iosLabel: HTMLLabelElement | null = null;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * Set up the hidden checkbox switch for iOS haptic.
 * Must be called once after DOM is ready.
 */
function setupIOSHaptic(): void {
  if (!isIOS || iosHapticReady) return;

  // Create hidden checkbox with the switch attribute
  iosCheckbox = document.createElement('input');
  iosCheckbox.type = 'checkbox';
  iosCheckbox.setAttribute('switch', '');
  iosCheckbox.id = '__ios_haptic_switch';
  iosCheckbox.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';

  // Create label linked to the checkbox
  iosLabel = document.createElement('label');
  iosLabel.htmlFor = '__ios_haptic_switch';
  iosLabel.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  iosLabel.textContent = 'haptic';

  document.body.appendChild(iosCheckbox);
  document.body.appendChild(iosLabel);
  iosHapticReady = true;
}

/**
 * Fire the iOS native haptic by clicking the label (toggles the switch).
 */
function fireIOSHaptic(): boolean {
  if (!iosHapticReady || !iosLabel) return false;
  try {
    iosLabel.click();
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Web Audio fallback (for older iOS without switch support)
// =============================================================================

let audioCtx: AudioContext | null = null;

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
  // Also set up iOS haptic DOM elements
  setupIOSHaptic();
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
  if (isIOS) {
    fireIOSHaptic(); // Best-effort native haptic
    playTone(4200, 0.015, 0.06, 'sine'); // Always play audio too
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(10);
    return;
  }
  playTone(4200, 0.015, 0.06, 'sine');
}

/**
 * Medium tap — set completion, saves, pull-to-refresh
 */
export function hapticMedium(): void {
  if (isIOS) {
    fireIOSHaptic();
    playTone(2800, 0.025, 0.08, 'sine');
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(20);
    return;
  }
  playTone(2800, 0.025, 0.08, 'sine');
}

/**
 * Success — achievements, PRs, skill unlocks
 */
export function hapticSuccess(): void {
  if (isIOS) {
    fireIOSHaptic();
    setTimeout(() => fireIOSHaptic(), 80);
    playTone(1200, 0.04, 0.07, 'sine');
    setTimeout(() => playTone(1800, 0.06, 0.09, 'sine'), 50);
    return;
  }
  if (navigator.vibrate) {
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
  if (isIOS) {
    fireIOSHaptic();
    playTone(200, 0.04, 0.12, 'triangle');
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate([30, 50, 30]);
    return;
  }
  playTone(200, 0.04, 0.12, 'triangle');
}

/**
 * Error/warning — failed actions, discard confirmations
 */
export function hapticError(): void {
  if (isIOS) {
    fireIOSHaptic();
    setTimeout(() => fireIOSHaptic(), 60);
    playTone(150, 0.05, 0.1, 'sawtooth');
    setTimeout(() => playTone(120, 0.05, 0.08, 'sawtooth'), 60);
    return;
  }
  if (navigator.vibrate) {
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
  if (isIOS) {
    fireIOSHaptic();
    setTimeout(() => fireIOSHaptic(), 100);
    setTimeout(() => fireIOSHaptic(), 220);
    playTone(800, 0.05, 0.06, 'sine');
    setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 80);
    setTimeout(() => playTone(1600, 0.08, 0.10, 'sine'), 180);
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]);
    return;
  }
  playTone(800, 0.05, 0.06, 'sine');
  setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 80);
  setTimeout(() => playTone(1600, 0.08, 0.10, 'sine'), 180);
}
