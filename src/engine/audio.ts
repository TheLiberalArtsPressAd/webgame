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
  | 'talk'
  | 'forge'
  | 'fuse'
  | 'socket';

export type BgmName = 'title' | 'town' | 'shop' | 'field' | 'battle' | 'boss' | 'abyss' | 'ending';

const MUTE_KEY = 'sb_muted';

/** MIDI 音高 → 頻率 */
function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 打擊樂風格 */
type DrumStyle = 'soft' | 'march' | 'drive' | 'heart';

interface TrackDef {
  bpm: number;
  lead: OscillatorType;
  bass: OscillatorType;
  /** 和弦進行（MIDI 音高陣列，每格一小節；可含七度音與轉位） */
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
  /** 打擊樂風格（未指定 = 無打擊樂） */
  drums?: DrumStyle;
  /** 低音節奏型：每個 16 分音符的「相對根音半音位移」，null = 不發聲 */
  bassPat?: (number | null)[];
  /** 是否加入琶音層 */
  arp?: boolean;
  /** 每小節是否加入四度疊音（和聲更厚） */
  pad7?: boolean;
}

const BASS_SOFT: (number | null)[] = [0, null, null, null, 7, null, null, null, 0, null, null, null, 5, null, null, null];

const TRACKS: Record<BgmName, TrackDef> = {
  title: {
    bpm: 64,
    lead: 'sine',
    bass: 'sine',
    chords: [
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [55, 59, 62, 65],
      [52, 55, 59, 62]
    ],
    melody: [69, 72, 76, 74, 72, 69, 67, 64, 67, 69, 72, 69],
    melodyDensity: 0.35,
    leadGain: 0.1,
    padGain: 0.07,
    bassGain: 0.12,
    bassShift: -12,
    bassPat: BASS_SOFT,
    arp: true,
    pad7: true
  },
  town: {
    bpm: 92,
    lead: 'triangle',
    bass: 'triangle',
    chords: [
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [65, 69, 72, 76],
      [67, 71, 74, 77]
    ],
    melody: [72, 76, 79, 76, 74, 72, 74, 79, 76, 72, 69, 72],
    melodyDensity: 0.5,
    leadGain: 0.085,
    padGain: 0.05,
    bassGain: 0.11,
    bassShift: -12,
    drums: 'soft',
    bassPat: [0, null, 7, null, 0, null, 5, null, 0, null, 7, null, 4, null, 7, null],
    arp: true,
    pad7: true
  },
  shop: {
    bpm: 118,
    lead: 'triangle',
    bass: 'triangle',
    chords: [
      [60, 64, 67, 71],
      [62, 65, 69, 72],
      [65, 69, 72, 76],
      [67, 71, 74, 77]
    ],
    melody: [72, 74, 76, 79, 76, 74, 72, 76, 79, 81, 79, 76],
    melodyDensity: 0.62,
    leadGain: 0.08,
    padGain: 0.045,
    bassGain: 0.1,
    bassShift: -12,
    drums: 'soft',
    bassPat: [0, null, 4, null, 5, null, 7, null, 0, null, 4, null, 5, null, 7, null],
    arp: true,
    pad7: true
  },
  field: {
    bpm: 104,
    lead: 'triangle',
    bass: 'sine',
    chords: [
      [62, 65, 69, 72],
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [59, 62, 65, 69]
    ],
    melody: [74, 77, 81, 79, 77, 74, 72, 69, 72, 74, 77, 74],
    melodyDensity: 0.55,
    leadGain: 0.08,
    padGain: 0.05,
    bassGain: 0.11,
    bassShift: -12,
    drums: 'march',
    bassPat: [0, null, 7, null, 0, null, 7, null, 5, null, 9, null, 4, null, 7, null],
    arp: true,
    pad7: true
  },
  battle: {
    bpm: 140,
    lead: 'square',
    bass: 'sawtooth',
    chords: [
      [64, 67, 71, 74],
      [62, 65, 69, 72],
      [60, 64, 67, 71],
      [65, 69, 72, 76]
    ],
    melody: [76, 79, 83, 81, 79, 76, 74, 71, 74, 76, 79, 76],
    melodyDensity: 0.7,
    leadGain: 0.065,
    padGain: 0.04,
    bassGain: 0.11,
    bassShift: -12,
    drums: 'drive',
    bassPat: [0, 0, null, 12, null, 0, null, 7, 0, 0, null, 12, null, 7, null, 5],
    pad7: false
  },
  boss: {
    bpm: 152,
    lead: 'sawtooth',
    bass: 'sawtooth',
    chords: [
      [65, 68, 72, 75],
      [64, 67, 71, 74],
      [62, 65, 69, 72],
      [67, 70, 74, 77]
    ],
    melody: [77, 80, 84, 83, 80, 77, 75, 72, 75, 77, 80, 77],
    melodyDensity: 0.75,
    leadGain: 0.07,
    padGain: 0.045,
    bassGain: 0.13,
    bassShift: -12,
    drums: 'heart',
    bassPat: [0, 0, null, 0, 12, null, 7, null, 0, 0, null, 0, 10, null, 5, null],
    pad7: false
  },
  abyss: {
    bpm: 78,
    lead: 'sine',
    bass: 'triangle',
    chords: [
      [61, 64, 67, 70],
      [60, 63, 66, 69],
      [58, 61, 65, 68],
      [63, 66, 70, 73]
    ],
    melody: [73, 70, 68, 66, 68, 70, 73, 76, 73, 68, 66, 61],
    melodyDensity: 0.4,
    leadGain: 0.08,
    padGain: 0.06,
    bassGain: 0.12,
    bassShift: -12,
    drums: 'heart',
    bassPat: [0, null, null, 3, null, null, 7, null, 0, null, null, 3, null, null, 10, null],
    arp: true,
    pad7: true
  },
  ending: {
    bpm: 58,
    lead: 'sine',
    bass: 'sine',
    chords: [
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [53, 57, 60, 64],
      [60, 64, 67, 71]
    ],
    melody: [72, 76, 79, 84, 79, 76, 74, 72, 76, 79, 76, 72],
    melodyDensity: 0.42,
    leadGain: 0.095,
    padGain: 0.065,
    bassGain: 0.11,
    bassShift: -12,
    bassPat: BASS_SOFT,
    arp: true,
    pad7: true
  }
};

/** 打擊樂樣式：kick / snare / hat 的 16 分音符位置 */
const DRUMS: Record<DrumStyle, { kick: number[]; snare: number[]; hat: number[] }> = {
  soft: { kick: [0, 8], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  march: { kick: [0, 6, 8, 14], snare: [4, 12], hat: [2, 6, 10, 14] },
  drive: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  heart: { kick: [0, 10], snare: [8], hat: [4, 12] }
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
        // 柔和空間感：回饋延遲（不需要外部脈衝檔）
        const delay = this.ctx.createDelay(1.0);
        delay.delayTime.value = 0.26;
        const fb = this.ctx.createGain();
        fb.gain.value = 0.27;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.16;
        this.bgmBus.connect(delay);
        delay.connect(fb).connect(delay);
        delay.connect(wet).connect(this.master);
        this.bgmBus.connect(this.master);
        // 動態壓縮，避免疊音爆音
        try {
          const comp = this.ctx.createDynamicsCompressor();
          comp.threshold.value = -14;
          comp.knee.value = 22;
          comp.ratio.value = 3.2;
          comp.attack.value = 0.006;
          comp.release.value = 0.22;
          this.master.disconnect();
          this.master.connect(comp).connect(this.ctx.destination);
        } catch {
          /* 舊瀏覽器沒有 DynamicsCompressor 時忽略 */
        }
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
      case 'forge':
        this.tone(ctx, bus, 200, 0.08, 'square', 0.2, t, -40);
        this.noise(ctx, bus, 0.06, 0.2, t);
        this.tone(ctx, bus, 300, 0.07, 'square', 0.18, t + 0.1, -30);
        this.noise(ctx, bus, 0.06, 0.18, t + 0.1);
        this.tone(ctx, bus, 784, 0.22, 'triangle', 0.16, t + 0.2, 0);
        break;
      case 'socket':
        this.tone(ctx, bus, 880, 0.08, 'sine', 0.16, t, 0);
        this.tone(ctx, bus, 1318, 0.16, 'sine', 0.14, t + 0.07, 0);
        break;
      case 'fuse': {
        const seq = [392, 523, 659, 784, 1046];
        seq.forEach((f, i) => this.tone(ctx, bus, f, 0.3, 'triangle', 0.16, t + i * 0.11, 60));
        this.noise(ctx, bus, 0.5, 0.06, t + 0.1);
        break;
      }
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
    const inBar = step % 16;
    const chord = track.chords[bar % track.chords.length];
    const beat = 60 / track.bpm;
    const barLen = beat * 4;

    // 小節開頭：和弦襯底（含七度音，尾音較輕）+ 低音根音
    if (inBar === 0) {
      chord.forEach((n, i) => {
        const gain = track.padGain * (i >= 3 && track.pad7 ? 0.55 : 1);
        this.pad(ctx, bus, hz(n + 12), at, barLen * 0.95, gain);
      });
      this.bass(ctx, bus, hz(chord[0] + track.bassShift), at, beat * 1.6, track.bassGain);
    }

    // 低音節奏型（走路低音 / 律動）
    const pat = track.bassPat;
    if (pat) {
      const off = pat[inBar];
      if (off !== null && off !== undefined) {
        const oct = off >= 12 ? -12 : 0;
        this.bass(
          ctx,
          bus,
          hz(chord[0] + track.bassShift + off + oct),
          at,
          beat * (inBar % 4 === 0 ? 1.1 : 0.5),
          track.bassGain * (inBar % 4 === 0 ? 0.85 : 0.6)
        );
      }
    } else if (inBar % 4 === 0) {
      this.bass(ctx, bus, hz(chord[0] + track.bassShift - 12), at, beat * 0.6, track.bassGain * 0.7);
    }

    // 旋律（決定性密度）
    const hash = ((step * 2654435761) >>> 0) / 4294967296;
    const melodyHit = hash < track.melodyDensity;
    if (melodyHit) {
      const note = track.melody[(step * 5 + bar * 3) % track.melody.length];
      this.tone(ctx, bus, hz(note), beat * 0.45, track.lead, track.leadGain, at, 0);
    }

    // 琶音層：旋律沒出現時，每 2 個 16 分音符補一個和弦音
    if (track.arp && !melodyHit && inBar % 2 === 0) {
      const idx = (inBar / 2 + bar) % chord.length;
      this.tone(ctx, bus, hz(chord[idx] + 12), beat * 0.22, 'sine', track.leadGain * 0.55, at, 0);
    }

    // 打擊樂
    const dr = track.drums ? DRUMS[track.drums] : null;
    if (dr) {
      if (dr.kick.includes(inBar)) this.kick(ctx, bus, at);
      if (dr.snare.includes(inBar)) this.snare(ctx, bus, at);
      if (dr.hat.includes(inBar)) this.hat(ctx, bus, at, inBar % 4 === 0 ? 0.05 : 0.032);
    }
  }

  // ── 打擊樂 ──
  private kick(ctx: AudioContext, dest: AudioNode, at: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, at);
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    g.gain.setValueAtTime(0.34, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + 0.24);
  }

  private snare(ctx: AudioContext, dest: AudioNode, at: number) {
    this.noise(ctx, dest, 0.13, 0.13, at);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, at);
    g.gain.setValueAtTime(0.1, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
    osc.connect(g).connect(dest);
    osc.start(at);
    osc.stop(at + 0.14);
  }

  private hat(ctx: AudioContext, dest: AudioNode, at: number, gain: number) {
    const frames = Math.max(1, Math.floor(ctx.sampleRate * 0.04));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    src.connect(hp).connect(g).connect(dest);
    src.start(at);
    src.stop(at + 0.05);
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
