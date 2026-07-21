/**
 * Audio alert for rest timer completion.
 * Uses Web Audio API to generate beep tones — no external files needed.
 * Also includes a silent audio keepalive to prevent iOS from suspending the timer.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (iOS requires user gesture to start audio)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Plays a short beep/chime sound when the rest timer completes.
 * Uses oscillator nodes to create a pleasant two-tone alert.
 */
export function playTimerAlert(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First beep (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 880; // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second beep (slightly delayed, different pitch)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1100; // C#6
    gain2.gain.setValueAtTime(0.3, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 0.65);

    // Third beep (highest, most attention-grabbing)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.value = 1320; // E6
    gain3.gain.setValueAtTime(0.4, now + 0.7);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.7);
    osc3.stop(now + 1.2);
  } catch {
    // Audio not available — silently fail
  }
}

/**
 * Initialize the audio context on a user gesture.
 * Must be called from a click/tap handler to unlock iOS audio.
 * Call this when the user starts a workout or opens the rest timer.
 */
export function initAudioContext(): void {
  try {
    const ctx = getAudioContext();
    // Play a silent buffer to unlock audio on iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Audio not supported
  }
}
