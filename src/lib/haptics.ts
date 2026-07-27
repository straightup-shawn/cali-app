/**
 * Haptic / Audio Feedback Utility
 *
 * Priority order:
 * 1. Android: Vibration API
 * 2. iOS 18.0–26.4: checkbox switch trick via label.click()
 * 3. Fallback: Web Audio micro-sounds (iOS 26.5+ where switch is patched)
 *
 * Respects mute setting for audio fallback.
 */

// =============================================================================
// Mute setting
// =============================================================================

const MUTE_KEY = 'isometrix:sounds-muted';

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
}

// =============================================================================
// Platform detection
// =============================================================================

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// =============================================================================
// iOS checkbox switch haptic (works iOS 18.0–26.4)
// The trick: label.click() within a user-activation context fires the haptic.
// =============================================================================

let _hapticLabel: HTMLLabelElement | null = null;

function ensureIOSHaptic(): void {
  if (_hapticLabel) return;
  try {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('switch', '');
    checkbox.id = '__iso_haptic';
    checkbox.style.cssText =
      'position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0;pointer-events:none;';

    const label = document.createElement('label');
    label.htmlFor = '__iso_haptic';
    label.style.cssText =
      'position:fixed;top:-100px;left:-100px;width:1px;height:1px;opacity:0;pointer-events:none;';

    document.body.appendChild(checkbox);
    document.body.appendChild(label);
    _hapticLabel = label;
  } catch {
    // DOM not ready or unavailable
  }
}

/** Fire one haptic pulse via label.click(). Must be in user-activation context. */
function iosHaptic(): void {
  ensureIOSHaptic();
  try { _hapticLabel?.click(); } catch { /* ignore */ }
}

// =============================================================================
// Web Audio fallback (iOS 26.5+ / desktop)
// =============================================================================

let audioCtx: AudioContext | null = null;

export function initHapticAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch { /* ignore */ }
  if (isIOS) ensureIOSHaptic();
}

function playTone(
  freq: number,
  duration: number,
  volume = 0.08,
  type: OscillatorType = 'sine',
): void {
  if (!audioCtx || isMuted()) return;
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
  } catch { /* ignore */ }
}

// =============================================================================
// Public API
// =============================================================================

/** Light tap — nav, toggles */
export function hapticLight(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate(10); return; }
  if (isIOS) iosHaptic();
  playTone(4200, 0.015, 0.06, 'sine');
}

/** Medium tap — set completion, saves */
export function hapticMedium(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate(20); return; }
  if (isIOS) iosHaptic();
  playTone(2800, 0.025, 0.08, 'sine');
}

/** Success — PRs, unlocks */
export function hapticSuccess(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate([15, 50, 15]); return; }
  if (isIOS) { iosHaptic(); setTimeout(iosHaptic, 80); }
  playTone(1200, 0.04, 0.07, 'sine');
  setTimeout(() => playTone(1800, 0.06, 0.09, 'sine'), 50);
}

/** Heavy — finish workout, major actions */
export function hapticHeavy(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate([30, 50, 30]); return; }
  if (isIOS) iosHaptic();
  playTone(200, 0.04, 0.12, 'triangle');
}

/** Error — failed actions */
export function hapticError(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate([40, 30, 40, 30, 40]); return; }
  if (isIOS) { iosHaptic(); setTimeout(iosHaptic, 60); }
  playTone(150, 0.05, 0.1, 'sawtooth');
  setTimeout(() => playTone(120, 0.05, 0.08, 'sawtooth'), 60);
}

/** Celebration — milestones */
export function hapticCelebration(): void {
  if (!isIOS && navigator.vibrate) { navigator.vibrate([10, 40, 10, 40, 10, 40, 20, 60, 30]); return; }
  if (isIOS) {
    iosHaptic();
    setTimeout(iosHaptic, 100);
    setTimeout(iosHaptic, 220);
  }
  playTone(800, 0.05, 0.06, 'sine');
  setTimeout(() => playTone(1200, 0.05, 0.08, 'sine'), 80);
  setTimeout(() => playTone(1600, 0.08, 0.10, 'sine'), 180);
}
