// ─────────────────────────────────────────────────────────────
// 程序化音效與音樂（Web Audio API，完全不使用外部音檔）
// ─────────────────────────────────────────────────────────────

export type SfxName =
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'hit'
  | 'crit'
  | 'magic'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'capture'
  | 'fail'
  | 'levelup'
  | 'victory'
  | 'defeat'
  | 'coin'
  | 'step'
  | 'portal'
  | 'talk';

export type BgmName = 'title' | 'town' | 'field' | 'battle' | 'boss' | 'abyss' | 'ending';

const MUTE_KEY = 'sb_muted';

/** MIDI 音高 → 頻率 */
function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

interface TrackDef {
  bpm: number;
  lead: OscillatorType;
  bass: OscillatorType;
  /** 和弦進行（MIDI 音高陣列，每格一小節） */
  chords: number[][];
  /** 旋律音池（MIDI 音高） */
  melody: number[];
  /** 每個 16 分音符是否要發旋律音（比例 0~1，用決定性序列） */
  melodyDensity: number;
  leadGain: number;
  padGain: number;
  bassGain: number;
  /** 低音八度位移 */
  bassShift: number;
}

const TRACKS: Record<BgmName, TrackDef> = {
  title: {
    bpm: 64,
    lead: 'sine',
    bass: 'sine',
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
      [52, 55, 59]
    ],
    melody: [69, 72, 76, 74, 72, 69, 67, 64, 67, 69, 72, 69],
    melodyDensity: 0.35,
    leadGain: 0.1,
    padGain: 0.08,
    bassGain: 0.12,
    bassShift: -12
  },
  town: {
    bpm: 92,
    lead: 'triangle',
    bass: 'triangle',
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [65, 69, 72],
      [67, 71, 74]
    ],
    melody: [72, 76, 79, 76, 74, 72, 74, 79, 76, 72, 69, 72],
    melodyDensity: 0.5,
    leadGain: 0.09,
    padGain: 0.06,
    bassGain: 0.11,
    bassShift: -12
  },
  field: {
    bpm: 104,
    lead: 'triangle',
    bass: 'sine',
    chords: [
      [62, 65, 69],
      [60, 64, 67],
      [57, 60, 64],
      [59, 62, 65]
    ],
    melody: [74, 77, 81, 79, 77, 74, 72, 69, 72, 74, 77, 74],
    melodyDensity: 0.55,
    leadGain: 0.085,
    padGain: 0.055,
    bassGain: 0.11,
    bassShift: -12
  },
  battle: {
    bpm: 140,
    lead: 'square',
    bass: 'sawtooth',
    chords: [
      [64, 67, 71],
      [62, 65, 69],
      [60, 64, 67],
      [65, 69, 72]
    ],
    melody: [76, 79, 83, 81, 79, 76, 74, 71, 74, 76, 79, 76],
    melodyDensity: 0.7,
    leadGain: 0.07,
    padGain: 0.045,
    bassGain: 0.11,
    bassShift: -12
  },
  boss: {
    bpm: 152,
    lead: 'sawtooth',
    bass: 'sawtooth',
    chords: [
      [65, 68, 72],
      [64, 67, 71],
      [62, 65, 69],
      [67, 70, 74]
    ],
    melody: [77, 80, 84, 83, 80, 77, 75, 72, 75, 77, 80, 77],
    melodyDensity: 0.75,
    leadGain: 0.075,
    padGain: 0.05,
    bassGain: 0.13,
    bassShift: -12
  },
  abyss: {
    bpm: 78,
    lead: 'sine',
    bass: 'triangle',
    chords: [
      [61, 64, 67],
      [60, 63, 66],
      [58, 61, 65],
      [61, 66, 71]
    ],
    melody: [73, 70, 68, 66, 68, 70, 73, 76, 73, 68, 66, 61],
    melodyDensity: 0.4,
    leadGain: 0.085,
    padGain: 0.07,
    bassGain: 0.12,
    bassShift: -12
  },
  ending: {
    bpm: 58,
    lead: 'sine',
    bass: 'sine',
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [53, 57, 60],
      [60, 64, 67]
    ],
    melody: [72, 76, 79, 84, 79, 76, 74, 72, 76, 79, 76, 72],
    melodyDensity: 0.42,
    leadGain: 0.1,
    padGain: 0.075,
    bassGain: 0.11,
    bassShift: -12
  }
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private bgmName: BgmName | null = null;
  private bgmTimer: number | null = null;
  private nextTime = 0;
  private step = 0;
  muted = false;
  private unavailable = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  /** 由第一次使用者互動呼叫：建立 AudioContext 並續播音樂 */
  unlock() {
    if (this.unavailable) return;
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
          this.unavailable = true;
          return;
        }
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(this.ctx.destination);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.5;
        this.sfxBus.connect(this.master);
        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = 0.5;
        this.bgmBus.connect(this.master);
      } catch {
        this.unavailable = true;
        return;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    // 解鎖後若已指定曲目，重新啟動排程
    if (this.bgmName && this.bgmTimer === null) this.startScheduler(this.bgmName);
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** 播放一次性音效 */
  play(name: SfxName) {
    if (this.muted || this.unavailable) return;
    this.unlock();
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'select':
        this.tone(ctx, bus, 620, 0.06, 'square', 0.16, t, 0);
        break;
      case 'confirm':
        this.tone(ctx, bus, 660, 0.07, 'square', 0.18, t, 0);
        this.tone(ctx, bus, 990, 0.09, 'square', 0.15, t + 0.06, 0);
        break;
      case 'cancel':
        this.tone(ctx, bus, 420, 0.09, 'square', 0.16, t, -180);
        break;
      case 'talk':
        this.tone(ctx, bus, 520, 0.04, 'triangle', 0.12, t, 0);
        break;
      case 'step':
        this.noise(ctx, bus, 0.03, 0.05, t);
        break;
      case 'coin':
        this.tone(ctx, bus, 1046, 0.07, 'square', 0.16, t, 0);
        this.tone(ctx, bus, 1568, 0.1, 'square', 0.14, t + 0.06, 0);
        break;
      case 'hit':
        this.noise(ctx, bus, 0.09, 0.24, t);
        this.tone(ctx, bus, 160, 0.1, 'square', 0.2, t, -60);
        break;
      case 'crit':
        this.noise(ctx, bus, 0.14, 0.3, t);
        this.tone(ctx, bus, 220, 0.16, 'sawtooth', 0.24, t, -90);
        break;
      case 'magic':
        this.tone(ctx, bus, 300, 0.35, 'sine', 0.2, t, 900);
        this.tone(ctx, bus, 450, 0.3, 'triangle', 0.14, t + 0.05, 1200);
        break;
      case 'heal':
        this.tone(ctx, bus, 660, 0.18, 'sine', 0.16, t, 0);
        this.tone(ctx, bus, 880, 0.22, 'sine', 0.16, t + 0.1, 0);
        this.tone(ctx, bus, 1174, 0.28, 'sine', 0.14, t + 0.2, 0);
        break;
      case 'buff':
        this.tone(ctx, bus, 440, 0.12, 'triangle', 0.16, t, 0);
        this.tone(ctx, bus, 587, 0.14, 'triangle', 0.16, t + 0.08, 0);
        this.tone(ctx, bus, 880, 0.2, 'triangle', 0.14, t + 0.16, 0);
        break;
      case 'debuff':
        this.tone(ctx, bus, 520, 0.14, 'sawtooth', 0.14, t, -240);
        this.tone(ctx, bus, 330, 0.18, 'sawtooth', 0.12, t + 0.1, -160);
        break;
      case 'capture':
        this.tone(ctx, bus, 523, 0.1, 'square', 0.16, t, 0);
        this.tone(ctx, bus, 659, 0.1, 'square', 0.16, t + 0.1, 0);
        this.tone(ctx, bus, 784, 0.12, 'square', 0.16, t + 0.2, 0);
        this.tone(ctx, bus, 1046, 0.24, 'square', 0.16, t + 0.3, 0);
        break;
      case 'fail':
        this.tone(ctx, bus, 300, 0.16, 'square', 0.18, t, -80);
        this.tone(ctx, bus, 200, 0.24, 'square', 0.16, t + 0.14, -60);
        break;
      case 'levelup':
        this.tone(ctx, bus, 523, 0.1, 'square', 0.18, t, 0);
        this.tone(ctx, bus, 659, 0.1, 'square', 0.18, t + 0.09, 0);
        this.tone(ctx, bus, 784, 0.1, 'square', 0.18, t + 0.18, 0);
        this.tone(ctx, bus, 1046, 0.3, 'square', 0.18, t + 0.27, 0);
        break;
      case 'victory': {
        const seq = [523, 659, 784, 1046, 784, 1046];
        seq.forEach((f, i) => this.tone(ctx, bus, f, i === seq.length - 1 ? 0.4 : 0.16, 'square', 0.16, t + i * 0.13, 0));
        break;
      }
      case 'defeat': {
        const seq = [523, 466, 415, 349, 262];
        seq.forEach((f, i) => this.tone(ctx, bus, f, i === seq.length - 1 ? 0.7 : 0.24, 'triangle', 0.16, t + i * 0.2, 0));
        break;
      }
      case 'portal':
        this.tone(ctx, bus, 400, 0.4, 'sine', 0.16, t, 1400);
        this.noise(ctx, bus, 0.4, 0.08, t);
        break;
      default:
        break;
    }
  }

  /** 切換背景音樂（同名不重啟） */
  setBgm(name: BgmName | null) {
    if (this.bgmName === name) return;
    this.stopScheduler();
    this.bgmName = name;
    if (!name) return;
    if (this.muted || this.unavailable) return;
    // 尚未取得使用者互動時不建立 AudioContext，等 unlock() 再啟動
    if (this.ctx) this.startScheduler(name);
  }

  stopBgm() {
    this.setBgm(null);
  }

  // ── 內部 ──
  private startScheduler(name: BgmName) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    const tick = () => {
      const c = this.ctx;
      if (!c) return;
      const track = TRACKS[name];
      const stepDur = 60 / track.bpm / 4; // 16 分音符
      let guard = 0;
      while (this.nextTime < c.currentTime + 0.15 && guard++ < 64) {
        this.scheduleStep(name, this.step, this.nextTime);
        this.nextTime += stepDur;
        this.step++;
      }
    };
    tick();
    this.bgmTimer = window.setInterval(tick, 40);
  }

  private stopScheduler() {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleStep(name: BgmName, step: number, at: number) {
    const ctx = this.ctx;
    const bus = this.bgmBus;
    if (!ctx || !bus) return;
    const track = TRACKS[name];
    const bar = Math.floor(step / 16);
    const chord = track.chords[bar % track.chords.length];
    const beat = 60 / track.bpm;
    const barLen = beat * 4;

    // 小節開頭：和弦襯底 + 低音
    if (step % 16 === 0) {
      for (const n of chord) this.pad(ctx, bus, hz(n + 12), at, barLen * 0.95, track.padGain);
      this.bass(ctx, bus, hz(chord[0] + track.bassShift), at, beat * 1.8, track.bassGain);
    }
    // 每拍的低音脈動
    if (step % 4 === 0) {
      this.bass(ctx, bus, hz(chord[0] + track.bassShift - 12), at, beat * 0.6, track.bassGain * 0.7);
    }
    // 旋律（決定性密度）
    const hash = ((step * 2654435761) >>> 0) / 4294967296;
    if (hash < track.melodyDensity) {
      const note = track.melody[(step * 5 + bar * 3) % track.melody.length];
      this.tone(ctx, bus, hz(note), beat * 0.45, track.lead, track.leadGain, at, 0);
    }
  }

  private tone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    at: number,
    slide: number
  ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), at);
    if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + Math.min(0.02, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.03);
  }

  private pad(ctx: AudioContext, dest: AudioNode, freq: number, at: number, dur: number, gain: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.25);
    g.gain.linearRampToValueAtTime(0.0001, at + Math.max(0.3, dur));
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + Math.max(0.3, dur) + 0.05);
  }

  private bass(ctx: AudioContext, dest: AudioNode, freq: number, at: number, dur: number, gain: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(Math.max(20, freq), at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.03);
  }

  private noise(ctx: AudioContext, dest: AudioNode, dur: number, gain: number, at: number) {
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    src.connect(filter).connect(g).connect(dest);
    src.start(at);
    src.stop(at + dur + 0.02);
  }
}

export const audio = new AudioEngine();

/** 依地圖判斷背景音樂 */
export function bgmForMap(mapId: string, town: boolean): BgmName {
  if (mapId.startsWith('abyss')) return 'abyss';
  if (town) return 'town';
  if (mapId === 'skytemple') return 'boss';
  return 'field';
}
