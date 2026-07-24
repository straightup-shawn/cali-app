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
 * Play a round, bubbly "water drop" sound — layered harmonics with pitch bend.
 * Think: bubble pop, water drip, that satisfying iOS keyboard sound.
 */
function playNote(freq: number, duration: number, volume: number = 0.15): void {
  if (!audioCtx || isMuted()) return;
  try {
    const now = audioCtx.currentTime;

    // Main tone — sine for roundness
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq * 1.5, now); // Start higher
    osc1.frequency.exponentialRampToValueAtTime(freq, now + duration * 0.3); // Drop down (bubble effect)
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume, now + 0.003); // Instant attack
    gain1.gain.setValueAtTime(volume, now + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration); // Smooth decay
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + duration + 0.02);

    // Harmonic overtone for richness (one octave up, quieter)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 3, now);
    osc2.frequency.exponentialRampToValueAtTime(freq * 2, now + duration * 0.2);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(volume * 0.3, now + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now);
    osc2.stop(now + duration + 0.02);
  } catch {
    // Silently fail
  }
}

// =============================================================================
// Public feedback functions
// =============================================================================

/**
 * Light tap — nav switches, toggles
 * Tiny bubble pop
 */
export function hapticLight(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate(8);
  playNote(1800, 0.07, 0.12);
}

/**
 * Medium tap — set completion, saves
 * Satisfying water drop "plop"
 */
export function hapticMedium(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate(15);
  playNote(1000, 0.1, 0.2);
}

/**
 * Success — achievements, PRs
 * Two ascending bubble pops
 */
export function hapticSuccess(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([12, 40, 12]);
  playNote(800, 0.1, 0.16);
  setTimeout(() => playNote(1200, 0.12, 0.2), 100);
}

/**
 * Heavy — finishing workout
 * Deep satisfying "bloop"
 */
export function hapticHeavy(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([25, 40, 25]);
  playNote(500, 0.15, 0.22);
}

/**
 * Error/warning — failed actions
 * Two descending "bonks"
 */
export function hapticError(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([30, 20, 30]);
  playNote(600, 0.08, 0.15);
  setTimeout(() => playNote(400, 0.1, 0.12), 90);
}

/**
 * Celebration — milestones, unlocks
 * Three ascending bubbles (like a reward sound)
 */
export function hapticCelebration(): void {
  if (!isIOS && navigator.vibrate) navigator.vibrate([10, 30, 10, 30, 10, 30, 20]);
  playNote(700, 0.1, 0.15);
  setTimeout(() => playNote(1000, 0.1, 0.18), 120);
  setTimeout(() => playNote(1400, 0.15, 0.22), 260);
}
