let audioCtx: AudioContext | null = null;
let soundOn = true;

export function isSoundOn(): boolean {
  return soundOn;
}
export function setSoundOn(v: boolean): void {
  soundOn = v;
}
export function toggleSound(): boolean {
  soundOn = !soundOn;
  return soundOn;
}

function ctx(): AudioContext {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx = audioCtx || new AC();
  return audioCtx;
}

/** Uppåtgående "pling" med lika många toner som ordlängden (max 7). */
export function pling(len: number): void {
  if (!soundOn) return;
  try {
    const ac = ctx();
    const notes = Math.min(len, 7);
    for (let i = 0; i < notes; i++) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = 440 * Math.pow(2, (i * 3) / 12);
      const t = ac.currentTime + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.3);
    }
  } catch {
    /* ignorera ljudfel */
  }
}

/** Dov "thud" när en bricka landar. */
export function thud(): void {
  if (!soundOn) return;
  try {
    const ac = ctx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.1);
    g.gain.setValueAtTime(0.15, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);
    o.connect(g).connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + 0.13);
  } catch {
    /* ignorera ljudfel */
  }
}
