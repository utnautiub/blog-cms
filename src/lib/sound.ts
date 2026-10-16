export type SoundName = "click" | "toggle" | "open" | "success" | "error";

interface Tone {
  f0: number;
  f1?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

// Âm thanh tổng hợp bằng Web Audio API, không cần file âm thanh.
const SOUNDS: Record<SoundName, Tone[]> = {
  click: [{ f0: 1400, f1: 900, dur: 0.045, type: "sine", gain: 0.06 }],
  toggle: [{ f0: 520, f1: 760, dur: 0.09, type: "triangle", gain: 0.07 }],
  open: [{ f0: 600, f1: 900, dur: 0.1, type: "sine", gain: 0.06 }],
  success: [
    { f0: 660, dur: 0.09, type: "sine", gain: 0.07 },
    { f0: 990, dur: 0.16, type: "sine", gain: 0.07, delay: 0.09 },
  ],
  error: [{ f0: 240, f1: 160, dur: 0.18, type: "sawtooth", gain: 0.05 }],
};

const KEY = "sound";
let ctx: AudioContext | null = null;
let enabled: boolean | null = null;

export function isSoundEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = typeof window === "undefined" ? true : localStorage.getItem(KEY) !== "off";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? "on" : "off");
  } catch {
    /* ignore */
  }
}

export function playSound(name: SoundName = "click") {
  if (typeof window === "undefined" || !isSoundEnabled()) return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    for (const t of SOUNDS[name]) {
      const start = now + (t.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type ?? "sine";
      osc.frequency.setValueAtTime(t.f0, start);
      if (t.f1) osc.frequency.exponentialRampToValueAtTime(t.f1, start + t.dur);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(t.gain ?? 0.06, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + t.dur + 0.02);
    }
  } catch {
    /* trình duyệt không cho phát âm thanh: bỏ qua */
  }
}
