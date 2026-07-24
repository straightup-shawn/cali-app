/**
 * Audio Feedback Utility
 * 
 * Satisfying, round tones inspired by Minecraft/game UI sounds.
 * Respects mute setting stored in localStorage.
 * Android also gets vibration via Vibration API.
 */

let audioCtx: AudioContext | null = null;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const MUTE_KEY = 'isometrix:sounds-muted';

/**
 * Check if sounds are muted.
 */
export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}

/**
 * Set mute state.
 */
export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
}

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
 * Play a round, satisfying tone — like a soft xylophone/marimba note.
 */
function playNote(freq: number, duration: number, volume: number = 0.15): void {
  if (!audioCtx || isMuted()) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Sine wave = round, warm sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    // Slight pitch drop for that satisfying "plop" feel
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + duration);

    // Soft attack, smooth decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005); // 5ms attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  } catch {
    // Silently fail
  }
}

// =============================================================================
// Public feedback functions
// =============================================================================

/**
 * Light tap — nav switches, toggles, minor selections
 * Soft high "pop"
 */
export function hapticLight(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate(8);
  playNote(1400, 0.06, 0.1);
}

/**
 * Medium tap — set completion, saves, pull-to-refresh
 * Satisfying "plonk" like placing a Minecraft block
 */
export function hapticMedium(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate(15);
  playNote(800, 0.08, 0.18);
}

/**
 * Success — achievements, PRs, skill unlocks
 * Ascending two-note chime
 */
export function hapticSuccess(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([12, 40, 12]);
  playNote(660, 0.1, 0.15);
  setTimeout(() => playNote(880, 0.12, 0.18), 80);
}

/**
 * Heavy — finishing a workout, major confirmations
 * Deep satisfying "thonk"
 */
export function hapticHeavy(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([25, 40, 25]);
  playNote(440, 0.12, 0.2);
}

/**
 * Error/warning — failed actions, discard confirmations
 * Low double "bonk"
 */
export function hapticError(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([30, 20, 30]);
  playNote(300, 0.08, 0.15);
  setTimeout(() => playNote(250, 0.1, 0.12), 80);
}

/**
 * Celebration — PRs, first unlocks, milestones
 * Ascending three-note chime (like Minecraft level up)
 */
export function hapticCelebration(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 10, 30, 20]);
  playNote(523, 0.1, 0.14);   // C5
  setTimeout(() => playNote(659, 0.1, 0.16), 100);  // E5
  setTimeout(() => playNote(784, 0.15, 0.2), 220);  // G5
}
