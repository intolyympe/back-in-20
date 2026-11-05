// The few sounds of the game, made on the fly (no files to credit).

let context = null;

/** Two notes, like a lift arriving: Camille is coming back. */
export function ding() {
  try {
    context ??= new AudioContext();
    const start = context.currentTime;
    for (const [frequency, at] of [[880, 0], [660, 0.28]]) {
      const tone = context.createOscillator();
      const volume = context.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, start + at);
      volume.gain.exponentialRampToValueAtTime(0.25, start + at + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.9);
      tone.connect(volume).connect(context.destination);
      tone.start(start + at);
      tone.stop(start + at + 1);
    }
  } catch {
    // No sound (no audio device, or not allowed yet): the game goes on.
  }
}
