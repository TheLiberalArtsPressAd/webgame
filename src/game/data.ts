import type { Ailment, Element, SkillDef, SpeciesDef, Stats, Unit } from './types';
import { RULES } from './rules';

// ─────────────────────────────────────────────────────────────
// 屬性相剋：火 → 風 → 地 → 水 → 火
// ─────────────────────────────────────────────────────────────
export const ELEMENTS: Element[] = ['fire', 'water', 'wind', 'earth'];

export const ELEMENT_NAME: Record<Element, string> = {
  none: '無',
  fire: '火',
  water: '水',
  wind: '風',
  earth: '地'
};

export const ELEMENT_COLOR: Record<Element, string> = {
  none: '#c8ced9',
  fire: '#ff7a45',
  water: '#4fb0ff',
  wind: '#79e08d',
  earth: '#d1a05a'
};

// ─────────────────────────────────────────────────────────────
// 異常狀態
// ─────────────────────────────────────────────────────────────
export const AILMENT_NAME: Record<Ailment, string> = {
  poison: '中毒',
  bleed: '流血',
  paralysis: '麻痺',
  sleep: '睡眠',
  freeze: '冰凍',
  confuse: '混亂'
};

export const AILMENT_COLOR: Record<Ailment, string> = {
  poison: '#b07ae0',
  bleed: '#e06060',
  paralysis: '#f0d060',
  sleep: '#8ab0e8',
  freeze: '#7fe0f0',
  confuse: '#e0a0e0'
};

export const AILMENT_ICON: Record<Ailment, string> = {
  poison: '☠',
  bleed: '✚',
  paralysis: '⚡',
  sleep: 'Z',
  freeze: '❄',
  confuse: '？'
};

export const ALL_AILMENTS: Ailment[] = ['poison', 'bleed', 'paralysis', 'sleep', 'freeze', 'confuse'];

const BEATS: Record<Element, Element> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire',
  none: 'none'
};

export function elementMultiplier(atk: Element, def: Element): number {
  if (atk === 'none' || def === 'none') return 1;
  if (BEATS[atk] === def) return 1.6;
  if (BEATS[def] === atk) return 0.6;
  return 1;
}

export function elementHint(atk: Element, def: Element): string {
  const m = elementMultiplier(atk, def);
  return m > 1 ? '效果絕佳！' : m < 1 ? '效果不佳…' : '';
}

// ─────────────────────────────────────────────────────────────
// 技能
// ─────────────────────────────────────────────────────────────
export const SKILLS: Record<string, SkillDef> = {
  // 基礎
  strike: {
    id: 'strike',
    name: '重擊',
    desc: '灌注力量的普通攻擊，傷害略高。',
    element: 'none',
    mp: 3,
    power: 15,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  // 火
  fireball: {
    id: 'fireball',
    name: '火球術',
    desc: '凝聚火元素擲向單體敵人。',
    element: 'fire',
    mp: 6,
    power: 26,
    kind: 'attack',
    target: 'enemy'
  },
  inferno: {
    id: 'inferno',
    name: '炎獄爆',
    desc: '引爆全場火元素，攻擊所有敵人。',
    element: 'fire',
    mp: 20,
    power: 46,
    kind: 'attack',
    target: 'allEnemy'
  },
  // 水
  icepick: {
    id: 'icepick',
    name: '冰錐術',
    desc: '凝結冰錐貫穿單體敵人。',
    element: 'water',
    mp: 6,
    power: 26,
    kind: 'attack',
    target: 'enemy'
  },
  blizzard: {
    id: 'blizzard',
    name: '暴風雪',
    desc: '召喚冰雪風暴襲擊所有敵人。',
    element: 'water',
    mp: 20,
    power: 45,
    kind: 'attack',
    target: 'allEnemy'
  },
  // 風
  windblade: {
    id: 'windblade',
    name: '風刃',
    desc: '壓縮氣流成刃，斬擊單體敵人。',
    element: 'wind',
    mp: 6,
    power: 27,
    kind: 'attack',
    target: 'enemy'
  },
  cyclone: {
    id: 'cyclone',
    name: '龍捲風',
    desc: '捲起巨大氣旋橫掃所有敵人。',
    element: 'wind',
    mp: 20,
    power: 45,
    kind: 'attack',
    target: 'allEnemy'
  },
  // 地
  rockfall: {
    id: 'rockfall',
    name: '落石術',
    desc: '使岩石自敵人頭頂落下。',
    element: 'earth',
    mp: 6,
    power: 28,
    kind: 'attack',
    target: 'enemy'
  },
  quake: {
    id: 'quake',
    name: '大地震',
    desc: '震裂地面，重擊所有敵人。',
    element: 'earth',
    mp: 20,
    power: 47,
    kind: 'attack',
    target: 'allEnemy'
  },
  // 無屬性
  starburst: {
    id: 'starburst',
    name: '星塵爆',
    desc: '釋放純粹星塵魔力，無視屬性相剋。',
    element: 'none',
    mp: 12,
    power: 34,
    kind: 'attack',
    target: 'enemy'
  },
  // 輔助
  heal: {
    id: 'heal',
    name: '治療術',
    desc: '回復我方單體 HP。',
    element: 'none',
    mp: 7,
    power: 34,
    kind: 'heal',
    target: 'ally'
  },
  healall: {
    id: 'healall',
    name: '星泉之癒',
    desc: '回復我方全體 HP。',
    element: 'none',
    mp: 18,
    power: 30,
    kind: 'heal',
    target: 'allAlly'
  },
  revive: {
    id: 'revive',
    name: '復甦術',
    desc: '使戰鬥不能的同伴以少量 HP 復活。',
    element: 'none',
    mp: 22,
    power: 0.35,
    kind: 'revive',
    target: 'ally'
  },
  powerup: {
    id: 'powerup',
    name: '力量強化',
    desc: '提升我方單體攻擊力 40%（3 回合）。',
    element: 'none',
    mp: 9,
    power: 0.4,
    kind: 'buff',
    target: 'ally',
    stat: 'atk',
    turns: 3
  },
  guardup: {
    id: 'guardup',
    name: '鐵壁守護',
    desc: '提升我方單體防禦力 40%（3 回合）。',
    element: 'none',
    mp: 9,
    power: 0.4,
    kind: 'buff',
    target: 'ally',
    stat: 'def',
    turns: 3
  },
  haste: {
    id: 'haste',
    name: '疾風之息',
    desc: '提升我方單體速度 40%（3 回合）。',
    element: 'none',
    mp: 8,
    power: 0.4,
    kind: 'buff',
    target: 'ally',
    stat: 'spd',
    turns: 3
  },
  weaken: {
    id: 'weaken',
    name: '弱化咒',
    desc: '降低敵方單體攻擊力 30%（3 回合）。',
    element: 'none',
    mp: 8,
    power: -0.3,
    kind: 'debuff',
    target: 'enemy',
    stat: 'atk',
    turns: 3
  },
  // 敵人專用
  bite: {
    id: 'bite',
    name: '撕咬',
    desc: '以尖牙撕咬敵人。',
    element: 'none',
    mp: 0,
    power: 18,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  shadowclaw: {
    id: 'shadowclaw',
    name: '蝕影爪',
    desc: '纏繞暗影的利爪。',
    element: 'none',
    mp: 6,
    power: 34,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  crystalbeam: {
    id: 'crystalbeam',
    name: '晶石光束',
    desc: '失控的晶石能量掃射全體。',
    element: 'none',
    mp: 12,
    power: 30,
    kind: 'attack',
    target: 'allEnemy'
  },

  // ── 追加：屬性攻擊（中階） ──
  ember: {
    id: 'ember',
    name: '火星',
    desc: '彈出小火花，消耗極低的火屬性攻擊。',
    element: 'fire',
    mp: 4,
    power: 18,
    kind: 'attack',
    target: 'enemy'
  },
  flameburst: {
    id: 'flameburst',
    name: '烈焰爆',
    desc: '凝聚高熱火球炸裂單體敵人。',
    element: 'fire',
    mp: 14,
    power: 40,
    kind: 'attack',
    target: 'enemy'
  },
  lavaburst: {
    id: 'lavaburst',
    name: '熔岩噴發',
    desc: '地面裂開噴出岩漿，燒灼所有敵人。',
    element: 'fire',
    mp: 24,
    power: 52,
    kind: 'attack',
    target: 'allEnemy'
  },
  aquajet: {
    id: 'aquajet',
    name: '水箭',
    desc: '射出高壓水箭，消耗極低的水屬性攻擊。',
    element: 'water',
    mp: 4,
    power: 18,
    kind: 'attack',
    target: 'enemy'
  },
  tidalwave: {
    id: 'tidalwave',
    name: '潮濤',
    desc: '掀起巨浪重擊單體敵人。',
    element: 'water',
    mp: 14,
    power: 40,
    kind: 'attack',
    target: 'enemy'
  },
  tsunami: {
    id: 'tsunami',
    name: '海嘯',
    desc: '吞沒全場的巨浪，攻擊所有敵人。',
    element: 'water',
    mp: 24,
    power: 50,
    kind: 'attack',
    target: 'allEnemy'
  },
  frostbreath: {
    id: 'frostbreath',
    name: '霜之吐息',
    desc: '吐出極寒之氣凍結所有敵人。',
    element: 'water',
    mp: 18,
    power: 42,
    kind: 'attack',
    target: 'allEnemy'
  },
  gust: {
    id: 'gust',
    name: '疾風',
    desc: '掃出銳利風刃，消耗極低的風屬性攻擊。',
    element: 'wind',
    mp: 4,
    power: 18,
    kind: 'attack',
    target: 'enemy'
  },
  thunderbolt: {
    id: 'thunderbolt',
    name: '落雷',
    desc: '召下天雷貫穿單體敵人。',
    element: 'wind',
    mp: 14,
    power: 41,
    kind: 'attack',
    target: 'enemy'
  },
  tempest: {
    id: 'tempest',
    name: '風暴',
    desc: '怒號的暴風撕扯所有敵人。',
    element: 'wind',
    mp: 24,
    power: 50,
    kind: 'attack',
    target: 'allEnemy'
  },
  stonepunch: {
    id: 'stonepunch',
    name: '岩石拳',
    desc: '以岩石拳頭敲擊，消耗極低的土屬性攻擊。',
    element: 'earth',
    mp: 4,
    power: 19,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  stoneedge: {
    id: 'stoneedge',
    name: '岩刃',
    desc: '從地面刺出岩刃貫穿單體敵人。',
    element: 'earth',
    mp: 14,
    power: 40,
    kind: 'attack',
    target: 'enemy'
  },
  sandtomb: {
    id: 'sandtomb',
    name: '沙縛',
    desc: '流沙吞沒所有敵人的腳步。',
    element: 'earth',
    mp: 20,
    power: 40,
    kind: 'attack',
    target: 'allEnemy'
  },
  starlance: {
    id: 'starlance',
    name: '星光槍',
    desc: '投出星光長槍，無視屬性相剋。',
    element: 'none',
    mp: 10,
    power: 30,
    kind: 'attack',
    target: 'enemy'
  },
  cometfall: {
    id: 'cometfall',
    name: '隕星墜',
    desc: '召來漫天隕石，無視屬性相剋地攻擊全體。',
    element: 'none',
    mp: 26,
    power: 54,
    kind: 'attack',
    target: 'allEnemy'
  },
  voidclaw: {
    id: 'voidclaw',
    name: '虛空爪',
    desc: '撕開空間的爪擊，容易造成麻痺。',
    element: 'none',
    mp: 8,
    power: 32,
    kind: 'attack',
    target: 'enemy',
    physical: true,
    ailment: 'paralysis',
    ailmentChance: 0.4,
    ailmentTurns: 3
  },

  // ── 追加：異常狀態 ──
  venomfang: {
    id: 'venomfang',
    name: '毒牙',
    desc: '帶毒的獠牙，高機率使敵人中毒。',
    element: 'none',
    mp: 5,
    power: 22,
    kind: 'attack',
    target: 'enemy',
    physical: true,
    ailment: 'poison',
    ailmentChance: 0.85,
    ailmentTurns: 4
  },
  paralyzepalm: {
    id: 'paralyzepalm',
    name: '麻痺掌',
    desc: '帶電的掌擊，使敵人麻痺、可能無法行動。',
    element: 'none',
    mp: 7,
    power: 24,
    kind: 'attack',
    target: 'enemy',
    physical: true,
    ailment: 'paralysis',
    ailmentChance: 0.7,
    ailmentTurns: 3
  },
  lullaby: {
    id: 'lullaby',
    name: '搖籃曲',
    desc: '使所有敵人陷入沉睡，暫時無法行動。',
    element: 'none',
    mp: 14,
    power: 0,
    kind: 'status',
    target: 'allEnemy',
    ailment: 'sleep',
    ailmentChance: 0.6,
    ailmentTurns: 3
  },
  frostnova: {
    id: 'frostnova',
    name: '霜華爆',
    desc: '綻放的冰華，凍傷並可能麻痺所有敵人。',
    element: 'water',
    mp: 20,
    power: 46,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'paralysis',
    ailmentChance: 0.3,
    ailmentTurns: 3
  },

  // ── 追加：輔助 ──
  purify: {
    id: 'purify',
    name: '淨化',
    desc: '解除我方單體的異常狀態。',
    element: 'none',
    mp: 6,
    power: 0,
    kind: 'heal',
    target: 'ally',
    cure: true
  },
  barrier: {
    id: 'barrier',
    name: '星之壁',
    desc: '提升我方全體防禦力 30%（3 回合）。',
    element: 'none',
    mp: 16,
    power: 0.3,
    kind: 'buff',
    target: 'allAlly',
    stat: 'def',
    turns: 3
  },
  focus: {
    id: 'focus',
    name: '凝神',
    desc: '提升我方單體魔力 35%（3 回合）。',
    element: 'none',
    mp: 8,
    power: 0.35,
    kind: 'buff',
    target: 'ally',
    stat: 'mag',
    turns: 3
  },
  slow: {
    id: 'slow',
    name: '遲緩',
    desc: '降低敵方單體速度 30%（3 回合）。',
    element: 'none',
    mp: 8,
    power: -0.3,
    kind: 'debuff',
    target: 'enemy',
    stat: 'spd',
    turns: 3
  },

  // ── 追加：BOSS 專用 ──
  dragonbreath: {
    id: 'dragonbreath',
    name: '龍息',
    desc: '席捲全場的龍之吐息。',
    element: 'none',
    mp: 16,
    power: 44,
    kind: 'attack',
    target: 'allEnemy'
  },
  eclipsebolt: {
    id: 'eclipsebolt',
    name: '蝕影閃',
    desc: '凝縮暗影的貫穿光束。',
    element: 'none',
    mp: 12,
    power: 44,
    kind: 'attack',
    target: 'enemy'
  },
  voidstorm: {
    id: 'voidstorm',
    name: '虛空風暴',
    desc: '扭曲空間的風暴，襲擊所有敵人。',
    element: 'none',
    mp: 26,
    power: 50,
    kind: 'attack',
    target: 'allEnemy'
  },
  creationray: {
    id: 'creationray',
    name: '創世射線',
    desc: '改寫世界的光之射線，無情地掃過全體。',
    element: 'none',
    mp: 30,
    power: 56,
    kind: 'attack',
    target: 'allEnemy'
  },

  // ── 追加：新異常狀態 ──
  rend: {
    id: 'rend',
    name: '撕裂',
    desc: '深可見骨的爪擊，使敵人流血不止。',
    element: 'none',
    mp: 6,
    power: 28,
    kind: 'attack',
    target: 'enemy',
    physical: true,
    ailment: 'bleed',
    ailmentChance: 0.8,
    ailmentTurns: 4
  },
  icebind: {
    id: 'icebind',
    name: '冰縛',
    desc: '將敵人凍結在冰牢之中，使其無法行動。',
    element: 'water',
    mp: 12,
    power: 30,
    kind: 'attack',
    target: 'enemy',
    ailment: 'freeze',
    ailmentChance: 0.5,
    ailmentTurns: 2
  },
  chaosgaze: {
    id: 'chaosgaze',
    name: '混亂凝視',
    desc: '擾亂敵人的意識，使其陷入混亂。',
    element: 'none',
    mp: 10,
    power: 0,
    kind: 'status',
    target: 'enemy',
    ailment: 'confuse',
    ailmentChance: 0.7,
    ailmentTurns: 3
  },
  deepfreeze: {
    id: 'deepfreeze',
    name: '絕對零度',
    desc: '席捲全場的極寒，凍傷並可能凍結所有敵人。',
    element: 'water',
    mp: 24,
    power: 42,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'freeze',
    ailmentChance: 0.35,
    ailmentTurns: 2
  },
  bloodmoon: {
    id: 'bloodmoon',
    name: '血月斬',
    desc: '染紅夜空的斬擊，使所有敵人嚴重流血。',
    element: 'none',
    mp: 20,
    power: 38,
    kind: 'attack',
    target: 'allEnemy',
    physical: true,
    ailment: 'bleed',
    ailmentChance: 0.6,
    ailmentTurns: 4
  },

  // ── 追加：輔助（我方） ──
  purifyAll: {
    id: 'purifyAll',
    name: '大淨化',
    desc: '解除我方全體的異常狀態。',
    element: 'none',
    mp: 14,
    power: 0,
    kind: 'heal',
    target: 'allAlly',
    cure: true
  },
  warcry: {
    id: 'warcry',
    name: '戰吼',
    desc: '提升我方全體攻擊力 30%（3 回合）。',
    element: 'none',
    mp: 14,
    power: 0.3,
    kind: 'buff',
    target: 'allAlly',
    stat: 'atk',
    turns: 3
  },
  regen: {
    id: 'regen',
    name: '生命之泉',
    desc: '回復我方全體 HP。',
    element: 'none',
    mp: 22,
    power: 40,
    kind: 'heal',
    target: 'allAlly'
  },

  // ── 追加：深淵（終盤） ──
  abyssgrasp: {
    id: 'abyssgrasp',
    name: '深淵之握',
    desc: '自深淵伸出的黑暗之手，襲擊所有敵人。',
    element: 'none',
    mp: 28,
    power: 52,
    kind: 'attack',
    target: 'allEnemy'
  },
  stardeath: {
    id: 'stardeath',
    name: '星滅',
    desc: '讓星辰殞落的一擊，威力驚人。',
    element: 'none',
    mp: 34,
    power: 74,
    kind: 'attack',
    target: 'enemy'
  },
  aegis: {
    id: 'aegis',
    name: '神盾',
    desc: '大幅提升我方全體防禦力 50%（3 回合）。',
    element: 'none',
    mp: 20,
    power: 0.5,
    kind: 'buff',
    target: 'allAlly',
    stat: 'def',
    turns: 3
  },
  judgement: {
    id: 'judgement',
    name: '天罰',
    desc: '自天頂落下的審判之光，橫掃所有敵人。',
    element: 'none',
    mp: 32,
    power: 58,
    kind: 'attack',
    target: 'allEnemy'
  }
};

// ─────────────────────────────────────────────────────────────
// 場地效果：依戰鬥背景給予屬性加成
// ─────────────────────────────────────────────────────────────
export interface FieldEffectDef {
  name: string;
  /** 受到加成的屬性（none = 無加成，僅有敘述） */
  element: Element;
  /** 該屬性傷害倍率 */
  mult: number;
  desc: string;
}

export const FIELD_EFFECTS: Record<string, FieldEffectDef> = {
  field: { name: '草原之風', element: 'wind', mult: 1.2, desc: '微風吹拂，風屬性傷害 +20%。' },
  cave: { name: '星塵魔力', element: 'none', mult: 1.15, desc: '晶石共鳴，所有傷害 +15%。' },
  road: { name: '荒野塵土', element: 'earth', mult: 1.2, desc: '大地乾裂，地屬性傷害 +20%。' },
  harbor: { name: '海潮', element: 'water', mult: 1.2, desc: '海氣瀰漫，水屬性傷害 +20%。' },
  snow: { name: '極寒', element: 'water', mult: 1.3, desc: '寒氣刺骨，水屬性傷害 +30%。' },
  volcano: { name: '熔岩', element: 'fire', mult: 1.3, desc: '熱浪翻騰，火屬性傷害 +30%。' },
  sky: { name: '星穹', element: 'none', mult: 1.2, desc: '星辰之力，所有傷害 +20%。' },
  abyss: { name: '深淵', element: 'none', mult: 1.3, desc: '深淵侵蝕，所有傷害 +30%。' }
};

/** 場地加成：'none' 表示全屬性加成 */
export function fieldMultiplier(bg: string, element: Element): number {
  const f = FIELD_EFFECTS[bg];
  if (!f) return 1;
  if (f.element === 'none') return f.mult;
  return f.element === element ? f.mult : 1;
}

// ─────────────────────────────────────────────────────────────
// 種族（幻獸 + 劇情角色）
// ─────────────────────────────────────────────────────────────
const g = (hp: number, mp: number, atk: number, def: number, mag: number, spd: number): Stats => ({
  hp,
  mp,
  atk,
  def,
  mag,
  spd
});

export const SPECIES: Record<string, SpeciesDef> = {
  // ── 劇情角色 ──
  hero_asa: {
    id: 'hero_asa',
    name: '旭',
    element: 'none',
    shape: 'human',
    base: g(64, 26, 15, 13, 12, 13),
    growth: g(10, 4, 2.3, 2.0, 1.9, 1.1),
    catchRate: 0,
    size: 1,
    c1: '#f0c8a0',
    c2: '#3a6fd8',
    desc: '星見村出身的見習幻獸使，天生能聽見晶石的低語。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 1, id: 'fireball' },
      { level: 6, id: 'heal' },
      { level: 8, id: 'purify' },
      { level: 10, id: 'starburst' },
      { level: 14, id: 'inferno' },
      { level: 18, id: 'cometfall' }
    ]
  },
  hero_rin: {
    id: 'hero_rin',
    name: '鈴',
    element: 'wind',
    shape: 'human',
    base: g(50, 42, 10, 9, 18, 15),
    growth: g(7.5, 6, 1.5, 1.4, 2.9, 1.4),
    catchRate: 0,
    size: 1,
    c1: '#f6d2b0',
    c2: '#59c2a8',
    desc: '微風草原的遊俠少女，操縱風與雷的咒術使。',
    skills: [
      { level: 1, id: 'windblade' },
      { level: 1, id: 'heal' },
      { level: 8, id: 'haste' },
      { level: 10, id: 'paralyzepalm' },
      { level: 12, id: 'cyclone' },
      { level: 16, id: 'healall' },
      { level: 20, id: 'tempest' }
    ]
  },
  hero_tieshan: {
    id: 'hero_tieshan',
    name: '鐵山',
    element: 'earth',
    shape: 'human',
    base: g(84, 18, 19, 20, 6, 7),
    growth: g(13, 2.5, 2.8, 2.9, 0.8, 0.6),
    catchRate: 0,
    size: 1.05,
    c1: '#d8a878',
    c2: '#8a6634',
    desc: '暮色港的礦工老大，一身硬骨頭與厚實拳頭。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 1, id: 'guardup' },
      { level: 7, id: 'rockfall' },
      { level: 13, id: 'quake' }
    ]
  },

  // ── 無屬性 ──
  dusthare: {
    id: 'dusthare',
    name: '星塵兔',
    element: 'none',
    shape: 'blob',
    base: g(38, 14, 9, 8, 9, 12),
    growth: g(6, 2, 1.4, 1.3, 1.5, 1.5),
    catchRate: 0.55,
    size: 0.85,
    c1: '#efe6f5',
    c2: '#c9b6e8',
    desc: '毛皮會沾附星塵微光，性格溫馴，是新手幻獸使的第一個夥伴。',
    skills: [
      { level: 1, id: 'heal' },
      { level: 5, id: 'starburst' },
      { level: 12, id: 'healall' }
    ]
  },
  glimmermouse: {
    id: 'glimmermouse',
    name: '微光鼠',
    element: 'none',
    shape: 'blob',
    base: g(34, 16, 11, 7, 10, 14),
    growth: g(5, 2.4, 1.7, 1.2, 1.7, 1.7),
    catchRate: 0.6,
    size: 0.8,
    c1: '#cfd8e8',
    c2: '#8fa2c4',
    desc: '成群出沒於草原，尾巴會發出螢火般的光點。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 6, id: 'weaken' },
      { level: 13, id: 'haste' }
    ]
  },

  // ── 火 ──
  flamefox: {
    id: 'flamefox',
    name: '炎狐',
    element: 'fire',
    shape: 'beast',
    base: g(48, 30, 14, 11, 17, 13),
    growth: g(7, 4.5, 2.0, 1.6, 2.7, 1.2),
    catchRate: 0.3,
    size: 0.95,
    c1: '#f2703a',
    c2: '#ffd06a',
    horns: false,
    desc: '尾端的火焰隨情緒改變顏色，據說能感應地底的熔岩脈動。',
    skills: [
      { level: 1, id: 'fireball' },
      { level: 7, id: 'powerup' },
      { level: 14, id: 'inferno' }
    ]
  },
  magmaboar: {
    id: 'magmaboar',
    name: '熔岩野豬',
    element: 'fire',
    shape: 'beast',
    base: g(72, 16, 19, 16, 8, 8),
    growth: g(11, 2, 2.7, 2.4, 1.0, 0.7),
    catchRate: 0.22,
    size: 1.15,
    c1: '#a8412a',
    c2: '#f0a63c',
    horns: true,
    desc: '背脊裂開的岩甲下流著岩漿，衝撞起來像一堵會走的火山。',
    skills: [
      { level: 1, id: 'bite' },
      { level: 8, id: 'guardup' },
      { level: 15, id: 'inferno' }
    ]
  },

  // ── 水 ──
  dewfrog: {
    id: 'dewfrog',
    name: '露水蛙',
    element: 'water',
    shape: 'blob',
    base: g(46, 32, 10, 11, 17, 11),
    growth: g(7, 4.8, 1.4, 1.7, 2.8, 1.0),
    catchRate: 0.42,
    size: 0.9,
    c1: '#59b8e8',
    c2: '#a8e6c8',
    desc: '喉囊能儲存大量水元素，鳴叫時會在空中凝出水珠。',
    skills: [
      { level: 1, id: 'icepick' },
      { level: 6, id: 'heal' },
      { level: 13, id: 'blizzard' }
    ]
  },
  frostdeer: {
    id: 'frostdeer',
    name: '霜角鹿',
    element: 'water',
    shape: 'beast',
    base: g(58, 34, 13, 14, 18, 14),
    growth: g(8.5, 5, 1.8, 2.1, 2.9, 1.3),
    catchRate: 0.25,
    size: 1.05,
    c1: '#d6eaf8',
    c2: '#8ec8ec',
    horns: true,
    desc: '角上終年結霜的優雅幻獸，走過之處會留下薄薄的白霜足跡。',
    skills: [
      { level: 1, id: 'icepick' },
      { level: 8, id: 'guardup' },
      { level: 12, id: 'purify' },
      { level: 15, id: 'blizzard' }
    ]
  },

  // ── 風 ──
  galehawk: {
    id: 'galehawk',
    name: '疾風鷹',
    element: 'wind',
    shape: 'bird',
    base: g(44, 24, 16, 9, 12, 20),
    growth: g(6.5, 3.4, 2.4, 1.4, 1.8, 2.0),
    catchRate: 0.35,
    size: 1.0,
    c1: '#8fd8f0',
    c2: '#4f8ad8',
    desc: '俯衝時幾乎無聲，是草原上最快的幻獸。',
    skills: [
      { level: 1, id: 'windblade' },
      { level: 7, id: 'haste' },
      { level: 14, id: 'cyclone' }
    ]
  },
  thunderbird: {
    id: 'thunderbird',
    name: '雷羽雀',
    element: 'wind',
    shape: 'bird',
    base: g(40, 36, 12, 8, 20, 18),
    growth: g(6, 5.6, 1.6, 1.2, 3.1, 1.8),
    catchRate: 0.28,
    size: 0.92,
    c1: '#ffe066',
    c2: '#8a6ef0',
    desc: '拍翅時羽毛間會迸出細小閃電，脾氣相當暴躁。',
    skills: [
      { level: 1, id: 'windblade' },
      { level: 6, id: 'weaken' },
      { level: 12, id: 'cyclone' }
    ]
  },

  // ── 地 ──
  mossbear: {
    id: 'mossbear',
    name: '苔甲熊',
    element: 'earth',
    shape: 'beast',
    base: g(80, 14, 17, 19, 7, 7),
    growth: g(12, 2, 2.4, 2.8, 0.9, 0.6),
    catchRate: 0.25,
    size: 1.15,
    c1: '#6f8f52',
    c2: '#4a5f38',
    desc: '背上長滿青苔的巨熊，一動也不動時常被誤認成石頭。',
    skills: [
      { level: 1, id: 'bite' },
      { level: 8, id: 'guardup' },
      { level: 15, id: 'quake' }
    ]
  },
  rockturtle: {
    id: 'rockturtle',
    name: '磐石龜',
    element: 'earth',
    shape: 'bug',
    base: g(90, 16, 13, 24, 8, 6),
    growth: g(13, 2.4, 1.7, 3.2, 1.0, 0.5),
    catchRate: 0.28,
    size: 1.1,
    c1: '#8e9099',
    c2: '#5a5d66',
    desc: '龜甲由整塊星塵岩構成，防禦力驚人，行動卻慢得可愛。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 7, id: 'guardup' },
      { level: 14, id: 'quake' }
    ]
  },

  // ── BOSS ──
  shadowwolf: {
    id: 'shadowwolf',
    name: '蝕影狼',
    element: 'none',
    shape: 'beast',
    base: g(110, 36, 20, 14, 12, 17),
    growth: g(14, 4, 2.4, 1.8, 1.6, 1.6),
    catchRate: 0,
    size: 1.35,
    c1: '#4b3f6b',
    c2: '#241f38',
    desc: '被蝕影教團以暗晶石汙染的幻獸，眼中只剩混濁的黑。',
    skills: [
      { level: 1, id: 'shadowclaw' },
      { level: 1, id: 'bite' },
      { level: 5, id: 'weaken' }
    ]
  },
  crystalwarden: {
    id: 'crystalwarden',
    name: '晶石守衛',
    element: 'none',
    shape: 'dragon',
    base: g(200, 60, 20, 18, 14, 14),
    growth: g(22, 6, 2.2, 2.2, 1.8, 1.2),
    catchRate: 0,
    size: 1.4,
    c1: '#7f6ce0',
    c2: '#c0b0f8',
    desc: '守護洞窟礦脈的古代造物，失控後再也分不清敵我。',
    skills: [
      { level: 1, id: 'crystalbeam' },
      { level: 1, id: 'shadowclaw' },
      { level: 5, id: 'guardup' }
    ]
  },
  sectleader: {
    id: 'sectleader',
    name: '蝕影祭司．瓦倫',
    element: 'none',
    shape: 'human',
    base: g(180, 90, 16, 16, 24, 18),
    growth: g(22, 10, 2.0, 2.0, 3.0, 1.6),
    catchRate: 0,
    size: 1.2,
    c1: '#cfc6e8',
    c2: '#2a1f42',
    desc: '蝕影教團的祭司，堅信只有讓幻獸全部暴走，才能「淨化」世界。',
    skills: [
      { level: 1, id: 'shadowclaw' },
      { level: 1, id: 'blizzard' },
      { level: 1, id: 'heal' },
      { level: 5, id: 'crystalbeam' }
    ]
  },

  // ── 火 ──
  emberpup: {
    id: 'emberpup',
    name: '火苗犬',
    element: 'fire',
    shape: 'beast',
    base: g(40, 20, 13, 10, 12, 14),
    growth: g(6, 3, 1.9, 1.4, 1.6, 1.6),
    catchRate: 0.5,
    size: 0.82,
    c1: '#f59a5a',
    c2: '#ffd88a',
    desc: '尾巴上燃著一小撮不會熄滅的火苗，情緒激動時會劈啪作響。',
    evolvesTo: { species: 'flamefox', level: 14 },
    skills: [
      { level: 1, id: 'ember' },
      { level: 5, id: 'bite' },
      { level: 12, id: 'flameburst' }
    ]
  },
  cinderimp: {
    id: 'cinderimp',
    name: '灰燼小鬼',
    element: 'fire',
    shape: 'blob',
    base: g(44, 32, 11, 9, 17, 13),
    growth: g(6, 4.4, 1.5, 1.3, 2.6, 1.3),
    catchRate: 0.35,
    size: 0.86,
    c1: '#c25a3a',
    c2: '#ffb060',
    desc: '喜歡躲在炭火堆裡惡作劇，會偷走旅人行李中的乾糧。',
    skills: [
      { level: 1, id: 'ember' },
      { level: 6, id: 'weaken' },
      { level: 13, id: 'flameburst' },
      { level: 20, id: 'lavaburst' }
    ]
  },
  lavadrake: {
    id: 'lavadrake',
    name: '熔岩亞龍',
    element: 'fire',
    shape: 'dragon',
    base: g(88, 40, 20, 17, 18, 12),
    growth: g(11, 5, 2.3, 2.2, 2.2, 1.1),
    catchRate: 0.12,
    size: 1.25,
    c1: '#b8442a',
    c2: '#ffcf6a',
    horns: true,
    desc: '鱗片之間流著岩漿的亞龍，棲息在焰心地脈的深處。',
    skills: [
      { level: 1, id: 'flameburst' },
      { level: 1, id: 'bite' },
      { level: 8, id: 'guardup' },
      { level: 16, id: 'lavaburst' }
    ]
  },
  phoenixbird: {
    id: 'phoenixbird',
    name: '燼羽鳳',
    element: 'fire',
    shape: 'bird',
    base: g(70, 54, 14, 13, 24, 20),
    growth: g(9, 6.5, 1.7, 1.6, 3.1, 1.8),
    catchRate: 0.08,
    size: 1.1,
    c1: '#f0683a',
    c2: '#ffe58a',
    wings: true,
    desc: '傳說中死而復生的火鳥，羽毛落下的地方會長出小小的火苗。',
    skills: [
      { level: 1, id: 'flameburst' },
      { level: 1, id: 'heal' },
      { level: 14, id: 'purify' },
      { level: 18, id: 'lavaburst' },
      { level: 22, id: 'revive' }
    ]
  },

  // ── 水 ──
  bubbletad: {
    id: 'bubbletad',
    name: '泡泡蝌蚪',
    element: 'water',
    shape: 'blob',
    base: g(38, 24, 9, 10, 14, 11),
    growth: g(5.6, 3.4, 1.3, 1.5, 2.2, 1.2),
    catchRate: 0.55,
    size: 0.78,
    c1: '#7fd0f0',
    c2: '#d6f4ff',
    desc: '身邊總飄著幾顆水泡，緊張時會一次吐出一整串。',
    evolvesTo: { species: 'dewfrog', level: 14 },
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 6, id: 'heal' }
    ]
  },
  tidecaller: {
    id: 'tidecaller',
    name: '潮語者',
    element: 'water',
    shape: 'fish',
    base: g(56, 48, 11, 13, 21, 15),
    growth: g(8, 5.6, 1.5, 1.7, 2.8, 1.4),
    catchRate: 0.25,
    size: 1.0,
    c1: '#4fa8d8',
    c2: '#b8f0e0',
    desc: '能聽懂潮水的語言，在港口被漁民視為吉祥的幻獸。',
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 1, id: 'icepick' },
      { level: 12, id: 'tidalwave' },
      { level: 14, id: 'lullaby' },
      { level: 16, id: 'barrier' }
    ]
  },
  frostfang: {
    id: 'frostfang',
    name: '霜牙狼',
    element: 'water',
    shape: 'beast',
    base: g(62, 26, 18, 14, 12, 17),
    growth: g(8.4, 3, 2.2, 1.8, 1.4, 1.9),
    catchRate: 0.3,
    size: 1.0,
    c1: '#bfe4f5',
    c2: '#6aa8d8',
    desc: '在雪原上成群狩獵，呼出的氣息會在空氣中結成細冰。',
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 1, id: 'bite' },
      { level: 14, id: 'frostbreath' }
    ]
  },
  leviathan: {
    id: 'leviathan',
    name: '冰海巨鯨',
    element: 'water',
    shape: 'fish',
    base: g(160, 60, 21, 18, 20, 11),
    growth: g(18, 6, 2.3, 2.2, 2.0, 1.0),
    catchRate: 0.05,
    size: 1.45,
    c1: '#2f7ab8',
    c2: '#a8e0f0',
    desc: '棲息在冰海深處的古老幻獸，鳴叫聲能傳遍整片海域。',
    skills: [
      { level: 1, id: 'tidalwave' },
      { level: 1, id: 'frostbreath' },
      { level: 8, id: 'heal' },
      { level: 18, id: 'tsunami' }
    ]
  },

  // ── 風 ──
  zephyrling: {
    id: 'zephyrling',
    name: '微風精',
    element: 'wind',
    shape: 'blob',
    base: g(36, 26, 10, 9, 15, 16),
    growth: g(5, 3.6, 1.4, 1.3, 2.4, 1.9),
    catchRate: 0.55,
    size: 0.76,
    c1: '#a8f0c8',
    c2: '#6ad8a8',
    desc: '幾乎沒有重量，被風一吹就會飄起來，需要抓住牠的尾巴。',
    evolvesTo: { species: 'galehawk', level: 14 },
    skills: [
      { level: 1, id: 'gust' },
      { level: 6, id: 'haste' }
    ]
  },
  stormroc: {
    id: 'stormroc',
    name: '雷暴巨鵬',
    element: 'wind',
    shape: 'bird',
    base: g(76, 36, 19, 12, 17, 24),
    growth: g(10, 4.6, 2.4, 1.6, 2.2, 2.4),
    catchRate: 0.18,
    size: 1.2,
    c1: '#8a9ff0',
    c2: '#ffe066',
    wings: true,
    desc: '展翅時會捲起雷雲，據說牠飛過之處必有暴雨。',
    skills: [
      { level: 1, id: 'thunderbolt' },
      { level: 1, id: 'gust' },
      { level: 8, id: 'haste' },
      { level: 12, id: 'paralyzepalm' },
      { level: 18, id: 'tempest' }
    ]
  },
  skywhale: {
    id: 'skywhale',
    name: '風空鯨',
    element: 'wind',
    shape: 'fish',
    base: g(150, 58, 17, 16, 22, 14),
    growth: g(17, 6, 1.9, 1.9, 2.4, 1.3),
    catchRate: 0.06,
    size: 1.5,
    c1: '#9fd8f0',
    c2: '#d8f0ff',
    desc: '在大氣層中游動的巨大幻獸，背上會長出漂浮的風之島。',
    skills: [
      { level: 1, id: 'tempest' },
      { level: 1, id: 'barrier' },
      { level: 12, id: 'lullaby' },
      { level: 20, id: 'healall' }
    ]
  },
  cloudserpent: {
    id: 'cloudserpent',
    name: '雲蛟',
    element: 'wind',
    shape: 'dragon',
    base: g(110, 52, 22, 16, 21, 20),
    growth: g(13, 5.6, 2.4, 1.9, 2.4, 2.0),
    catchRate: 0.07,
    size: 1.35,
    c1: '#c8e8f8',
    c2: '#7ab8e8',
    horns: true,
    desc: '在雲層間穿梭的蛟龍，鱗片會把陽光折射成一道虹。',
    skills: [
      { level: 1, id: 'thunderbolt' },
      { level: 1, id: 'tempest' },
      { level: 8, id: 'guardup' },
      { level: 10, id: 'paralyzepalm' },
      { level: 14, id: 'frostbreath' }
    ]
  },

  // ── 地 ──
  pebblet: {
    id: 'pebblet',
    name: '小石靈',
    element: 'earth',
    shape: 'bug',
    base: g(48, 14, 12, 18, 7, 8),
    growth: g(7, 2, 1.6, 2.6, 0.9, 0.8),
    catchRate: 0.5,
    size: 0.78,
    c1: '#a8a8b0',
    c2: '#6a6a72',
    desc: '由星塵岩打磨而成的迷你守衛，受傷時會縮成一顆圓石。',
    evolvesTo: { species: 'rockturtle', level: 14 },
    skills: [
      { level: 1, id: 'stonepunch' },
      { level: 6, id: 'guardup' }
    ]
  },
  crystalspine: {
    id: 'crystalspine',
    name: '晶棘獸',
    element: 'earth',
    shape: 'beast',
    base: g(94, 28, 20, 24, 12, 9),
    growth: g(12, 3.2, 2.3, 2.8, 1.4, 1.0),
    catchRate: 0.16,
    size: 1.15,
    c1: '#8a7ad8',
    c2: '#d8d0ff',
    horns: true,
    desc: '背上的晶棘能吸收大地之力，越靠近晶石礦脈就越活躍。',
    skills: [
      { level: 1, id: 'stoneedge' },
      { level: 1, id: 'guardup' },
      { level: 12, id: 'rend' },
      { level: 16, id: 'sandtomb' },
      { level: 24, id: 'quake' }
    ]
  },
  titanrock: {
    id: 'titanrock',
    name: '巨岩泰坦',
    element: 'earth',
    shape: 'dragon',
    base: g(210, 44, 24, 26, 12, 7),
    growth: g(22, 4.6, 2.5, 2.8, 1.2, 0.7),
    catchRate: 0.04,
    size: 1.5,
    c1: '#8a8a96',
    c2: '#5a5a66',
    horns: true,
    desc: '沉睡在古道底下的巨人，據說牠醒來時整座山都會震動。',
    skills: [
      { level: 1, id: 'stoneedge' },
      { level: 1, id: 'quake' },
      { level: 1, id: 'sandtomb' },
      { level: 8, id: 'guardup' }
    ]
  },

  // ── 無屬性 ──
  starling: {
    id: 'starling',
    name: '星語鳥',
    element: 'none',
    shape: 'bird',
    base: g(42, 34, 11, 10, 16, 18),
    growth: g(5.8, 3.8, 1.5, 1.4, 2.5, 2.1),
    catchRate: 0.45,
    size: 0.82,
    c1: '#e8e0ff',
    c2: '#a8b8f0',
    wings: true,
    desc: '叫聲像是有人在低聲念著古老的句子，村裡的老人很喜歡養牠。',
    skills: [
      { level: 1, id: 'starlance' },
      { level: 6, id: 'heal' },
      { level: 10, id: 'purify' },
      { level: 12, id: 'starburst' }
    ]
  },
  luminox: {
    id: 'luminox',
    name: '光紋狐',
    element: 'none',
    shape: 'beast',
    base: g(66, 44, 15, 14, 20, 17),
    growth: g(8.8, 4.6, 1.8, 1.7, 2.7, 1.9),
    catchRate: 0.2,
    size: 0.98,
    c1: '#fff0c8',
    c2: '#f0c070',
    desc: '身上的紋路會隨著星塵的濃度發光，是夜行旅人的路標。',
    skills: [
      { level: 1, id: 'starburst' },
      { level: 1, id: 'heal' },
      { level: 8, id: 'focus' },
      { level: 18, id: 'cometfall' }
    ]
  },
  voidmoth: {
    id: 'voidmoth',
    name: '蝕影蛾',
    element: 'none',
    shape: 'bug',
    base: g(72, 46, 16, 13, 22, 19),
    growth: g(9, 4.8, 1.8, 1.5, 2.8, 2.1),
    catchRate: 0.1,
    size: 1.05,
    c1: '#3a3050',
    c2: '#8a70c8',
    wings: true,
    desc: '翅膀上的紋路會吸走周圍的光，接近時會感到一陣耳鳴。',
    evolvesTo: { species: 'voiddragon', level: 30 },
    skills: [
      { level: 1, id: 'voidclaw' },
      { level: 1, id: 'weaken' },
      { level: 5, id: 'venomfang' },
      { level: 12, id: 'eclipsebolt' }
    ]
  },

  // ── 第二章：霜之國 ──
  snowpup: {
    id: 'snowpup',
    name: '雪犬',
    element: 'water',
    shape: 'beast',
    base: g(46, 20, 13, 11, 11, 15),
    growth: g(6.4, 2.6, 1.8, 1.6, 1.4, 1.8),
    catchRate: 0.5,
    size: 0.84,
    c1: '#eaf6ff',
    c2: '#a8d0e8',
    desc: '在雪原上打滾的小犬，身上覆著一層不會融化的薄雪。',
    evolvesTo: { species: 'frostbear', level: 16 },
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 4, id: 'bite' },
      { level: 10, id: 'haste' }
    ]
  },
  frostbear: {
    id: 'frostbear',
    name: '霜甲熊',
    element: 'water',
    shape: 'beast',
    base: g(104, 24, 21, 21, 10, 9),
    growth: g(13, 2.8, 2.4, 2.6, 1.2, 1.0),
    catchRate: 0.18,
    size: 1.2,
    c1: '#cfe8f8',
    c2: '#7aa8c8',
    desc: '毛皮表面結著厚厚一層霜甲，一巴掌能拍碎岩石。',
    skills: [
      { level: 1, id: 'frostbreath' },
      { level: 1, id: 'bite' },
      { level: 1, id: 'guardup' }
    ]
  },
  frostwyrm: {
    id: 'frostwyrm',
    name: '霜鱗龍',
    element: 'water',
    shape: 'dragon',
    base: g(140, 60, 22, 20, 24, 16),
    growth: g(15, 5.6, 2.2, 2.1, 2.6, 1.6),
    catchRate: 0.05,
    size: 1.4,
    c1: '#bfe0f0',
    c2: '#6a90c8',
    horns: true,
    desc: '冰晶洞窟的主人，鱗片上凝結著千年不化的霜。',
    skills: [
      { level: 1, id: 'frostbreath' },
      { level: 1, id: 'frostnova' },
      { level: 1, id: 'heal' },
      { level: 8, id: 'icebind' },
      { level: 12, id: 'dragonbreath' }
    ]
  },

  // ── 第三章：流沙與火 ──
  dunejackal: {
    id: 'dunejackal',
    name: '沙丘豺',
    element: 'earth',
    shape: 'beast',
    base: g(66, 22, 18, 14, 11, 18),
    growth: g(8.4, 2.8, 2.2, 1.7, 1.3, 2.1),
    catchRate: 0.3,
    size: 0.95,
    c1: '#d8b878',
    c2: '#a88448',
    desc: '在沙丘間高速奔跑的豺狼，腳掌能在流沙上借力。',
    evolvesTo: { species: 'miragecat', level: 20 },
    skills: [
      { level: 1, id: 'bite' },
      { level: 1, id: 'stonepunch' },
      { level: 10, id: 'rend' },
      { level: 14, id: 'sandtomb' }
    ]
  },
  miragecat: {
    id: 'miragecat',
    name: '幻影貓',
    element: 'fire',
    shape: 'beast',
    base: g(84, 44, 17, 15, 21, 22),
    growth: g(10.4, 4.6, 1.9, 1.7, 2.6, 2.4),
    catchRate: 0.14,
    size: 1.0,
    c1: '#f0c890',
    c2: '#e07040',
    desc: '身影會在熱氣中搖曳，讓人分不清哪一個才是本體。',
    skills: [
      { level: 1, id: 'ember' },
      { level: 1, id: 'flameburst' },
      { level: 6, id: 'slow' },
      { level: 14, id: 'chaosgaze' },
      { level: 20, id: 'cometfall' }
    ]
  },
  sandworm: {
    id: 'sandworm',
    name: '沙蟲',
    element: 'earth',
    shape: 'bug',
    base: g(120, 26, 22, 20, 9, 12),
    growth: g(14, 2.8, 2.4, 2.3, 1.1, 1.3),
    catchRate: 0.12,
    size: 1.3,
    c1: '#c8a878',
    c2: '#8a6a48',
    horns: true,
    desc: '潛伏在沙層底下的巨大蟲獸，會把整片沙地吸進口中。',
    skills: [
      { level: 1, id: 'sandtomb' },
      { level: 1, id: 'bite' },
      { level: 10, id: 'venomfang' },
      { level: 16, id: 'quake' }
    ]
  },

  // ── BOSS ──
  icegolem: {
    id: 'icegolem',
    name: '冰晶巨像',
    element: 'water',
    shape: 'dragon',
    base: g(240, 70, 23, 26, 22, 10),
    growth: g(24, 6.5, 2.3, 2.6, 2.4, 1.0),
    catchRate: 0,
    size: 1.5,
    c1: '#a8d8f0',
    c2: '#e8f8ff',
    desc: '以整塊冰晶雕成的古代守衛，胸口的心核發著幽藍的光。',
    skills: [
      { level: 1, id: 'frostbreath' },
      { level: 1, id: 'frostnova' },
      { level: 1, id: 'icebind' },
      { level: 1, id: 'crystalbeam' },
      { level: 8, id: 'barrier' }
    ]
  },
  magmalord: {
    id: 'magmalord',
    name: '熔岩魔王',
    element: 'fire',
    shape: 'dragon',
    base: g(260, 80, 25, 23, 26, 14),
    growth: g(26, 7, 2.5, 2.3, 2.7, 1.3),
    catchRate: 0,
    size: 1.5,
    c1: '#a8321a',
    c2: '#ffb040',
    horns: true,
    desc: '焰心地脈深處的霸主，每一次呼吸都讓洞窟的岩壁泛紅。',
    skills: [
      { level: 1, id: 'lavaburst' },
      { level: 1, id: 'dragonbreath' },
      { level: 1, id: 'inferno' },
      { level: 6, id: 'guardup' }
    ]
  },
  starsovereign: {
    id: 'starsovereign',
    name: '星之霸主',
    element: 'none',
    shape: 'dragon',
    base: g(300, 120, 27, 24, 30, 20),
    growth: g(28, 9, 2.6, 2.4, 3.0, 1.8),
    catchRate: 0,
    size: 1.6,
    c1: '#e8e0ff',
    c2: '#6a70d8',
    horns: true,
    wings: true,
    desc: '棲息在星穹神殿盡頭的古老存在，傳說牠是所有星塵晶石的源頭。',
    skills: [
      { level: 1, id: 'creationray' },
      { level: 1, id: 'cometfall' },
      { level: 1, id: 'starburst' },
      { level: 1, id: 'healall' },
      { level: 1, id: 'dragonbreath' }
    ]
  },

  // ───────────── 終盤：深淵迴廊 ─────────────
  shadehound: {
    id: 'shadehound',
    name: '影犬',
    element: 'none',
    shape: 'beast',
    base: g(96, 34, 26, 17, 15, 26),
    growth: g(11, 3.6, 2.9, 1.8, 1.5, 2.6),
    catchRate: 0.18,
    size: 1.05,
    c1: '#3a3450',
    c2: '#8f7fd8',
    desc: '在深淵的光影之間穿梭，咬痕會久久無法癒合。',
    skills: [
      { level: 1, id: 'shadowclaw' },
      { level: 1, id: 'rend' },
      { level: 10, id: 'haste' },
      { level: 20, id: 'bloodmoon' }
    ]
  },
  gloomweaver: {
    id: 'gloomweaver',
    name: '幽網蛛',
    element: 'none',
    shape: 'bug',
    base: g(110, 62, 19, 22, 27, 20),
    growth: g(12, 5.6, 2.0, 2.3, 3.0, 2.0),
    catchRate: 0.14,
    size: 1.1,
    c1: '#2a2440',
    c2: '#9a86e8',
    desc: '編織的網能纏住思緒，讓獵物連自己在做什麼都忘了。',
    skills: [
      { level: 1, id: 'venomfang' },
      { level: 1, id: 'chaosgaze' },
      { level: 12, id: 'weaken' },
      { level: 22, id: 'eclipsebolt' }
    ]
  },
  frostlich: {
    id: 'frostlich',
    name: '霜巫妖',
    element: 'water',
    shape: 'human',
    base: g(130, 96, 17, 20, 32, 18),
    growth: g(13, 8, 1.7, 2.0, 3.4, 1.8),
    catchRate: 0.12,
    size: 1.15,
    c1: '#cfe8ff',
    c2: '#5a86d8',
    desc: '把自己的名字封進冰裡的施術者，至今仍在低聲詠唱。',
    skills: [
      { level: 1, id: 'icebind' },
      { level: 1, id: 'heal' },
      { level: 10, id: 'focus' },
      { level: 18, id: 'deepfreeze' },
      { level: 26, id: 'revive' }
    ]
  },
  abyssknight: {
    id: 'abyssknight',
    name: '深淵騎士',
    element: 'none',
    shape: 'human',
    base: g(150, 60, 33, 30, 18, 17),
    growth: g(15, 5, 3.4, 3.0, 1.8, 1.7),
    catchRate: 0.1,
    size: 1.2,
    c1: '#4a4458',
    c2: '#c8b0ff',
    desc: '誓死守著迴廊入口的甲冑，裡面早已沒有身體。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 1, id: 'guardup' },
      { level: 10, id: 'aegis' },
      { level: 20, id: 'bloodmoon' },
      { level: 28, id: 'stardeath' }
    ]
  },
  voiddragon: {
    id: 'voiddragon',
    name: '虛空龍',
    element: 'none',
    shape: 'dragon',
    base: g(190, 100, 31, 26, 33, 21),
    growth: g(18, 8, 3.0, 2.5, 3.2, 2.0),
    catchRate: 0.07,
    size: 1.45,
    c1: '#241c3c',
    c2: '#9a70e8',
    horns: true,
    wings: true,
    desc: '張口時能看見牠體內整片沒有星星的夜空。',
    skills: [
      { level: 1, id: 'voidstorm' },
      { level: 1, id: 'eclipsebolt' },
      { level: 12, id: 'abyssgrasp' },
      { level: 24, id: 'dragonbreath' },
      { level: 30, id: 'stardeath' }
    ]
  },
  starwisp: {
    id: 'starwisp',
    name: '星燼',
    element: 'none',
    shape: 'blob',
    base: g(88, 120, 12, 16, 30, 24),
    growth: g(9, 10, 1.3, 1.7, 3.2, 2.3),
    catchRate: 0.16,
    size: 0.8,
    c1: '#fff4d0',
    c2: '#f0b860',
    desc: '由隕落星辰的餘燼聚成，靠近時會聽見極輕微的歌聲。',
    skills: [
      { level: 1, id: 'purifyAll' },
      { level: 1, id: 'regen' },
      { level: 8, id: 'focus' },
      { level: 16, id: 'judgement' },
      { level: 24, id: 'healall' }
    ]
  },
  nullbeast: {
    id: 'nullbeast',
    name: '虛無獸',
    element: 'none',
    shape: 'beast',
    base: g(280, 90, 36, 30, 28, 24),
    growth: g(24, 7, 3.6, 3.0, 2.8, 2.4),
    catchRate: 0.04,
    size: 1.5,
    c1: '#2a2438',
    c2: '#e0d0ff',
    horns: true,
    desc: '深淵迴廊的中樞守衛，據說牠吞下的東西不會再出現在世上。',
    skills: [
      { level: 1, id: 'abyssgrasp' },
      { level: 1, id: 'deepfreeze' },
      { level: 1, id: 'chaosgaze' },
      { level: 10, id: 'aegis' },
      { level: 20, id: 'judgement' },
      { level: 30, id: 'stardeath' }
    ]
  },
  abysssovereign: {
    id: 'abysssovereign',
    name: '深淵主宰',
    element: 'none',
    shape: 'dragon',
    base: g(420, 160, 42, 36, 40, 28),
    growth: g(30, 10, 3.4, 3.0, 3.4, 2.2),
    catchRate: 0,
    size: 1.8,
    c1: '#1a1428',
    c2: '#c8a0ff',
    horns: true,
    wings: true,
    desc: '迴廊最深處的存在。牠不說話，只是張開，讓所有光都被收進去。',
    skills: [
      { level: 1, id: 'abyssgrasp' },
      { level: 1, id: 'judgement' },
      { level: 1, id: 'stardeath' },
      { level: 1, id: 'aegis' },
      { level: 1, id: 'healall' },
      { level: 1, id: 'deepfreeze' }
    ]
  }
};

// ─────────────────────────────────────────────────────────────
// 數值計算與單位建立
// ─────────────────────────────────────────────────────────────
let uidCounter = 1;

export function statAtLevel(sp: SpeciesDef, level: number): Stats {
  const l = level - 1;
  return {
    hp: Math.floor(sp.base.hp + sp.growth.hp * l),
    mp: Math.floor(sp.base.mp + sp.growth.mp * l),
    atk: Math.floor(sp.base.atk + sp.growth.atk * l),
    def: Math.floor(sp.base.def + sp.growth.def * l),
    mag: Math.floor(sp.base.mag + sp.growth.mag * l),
    spd: Math.floor(sp.base.spd + sp.growth.spd * l)
  };
}

export function skillsFor(sp: SpeciesDef, level: number): string[] {
  return sp.skills.filter((s) => s.level <= level).map((s) => s.id);
}

export function createUnit(
  speciesId: string,
  level: number,
  kind: Unit['kind'] = 'pet',
  name?: string
): Unit {
  const sp = SPECIES[speciesId];
  if (!sp) throw new Error(`未知幻獸：${speciesId}`);
  const max = statAtLevel(sp, level);
  return {
    uid: uidCounter++,
    kind,
    speciesId,
    name: name ?? sp.name,
    level,
    exp: 0,
    hp: max.hp,
    mp: max.mp,
    max,
    skills: skillsFor(sp, level),
    element: sp.element,
    sprite: { shape: sp.shape, c1: sp.c1, c2: sp.c2, size: sp.size, horns: sp.horns, wings: sp.wings },
    buffs: []
  };
}

/** 升級門檻：達到後升 1 級 */
export function expToNext(level: number): number {
  return Math.max(
    1,
    Math.floor(RULES.expQuad * level * level + RULES.expLinear * level + RULES.expConstant)
  );
}

/** 圖鑑編號（依 SPECIES 定義順序） */
export const SPECIES_ORDER: string[] = Object.keys(SPECIES);
export function dexNumber(id: string): number {
  const i = SPECIES_ORDER.indexOf(id);
  return i < 0 ? 0 : i + 1;
}

/** 將 unit 就地進化成另一種族，保留等級與經驗 */
export function evolveUnit(unit: Unit, speciesId: string): boolean {
  const sp = SPECIES[speciesId];
  if (!sp) return false;
  unit.speciesId = sp.id;
  unit.name = sp.name;
  unit.element = sp.element;
  unit.sprite = {
    shape: sp.shape,
    c1: sp.c1,
    c2: sp.c2,
    size: sp.size,
    horns: sp.horns,
    wings: sp.wings
  };
  unit.max = statAtLevel(sp, unit.level);
  unit.hp = unit.max.hp;
  unit.mp = unit.max.mp;
  unit.skills = skillsFor(sp, unit.level);
  return true;
}

/** 若已達進化等級則回傳目標種族 id */
export function evolutionTarget(sp: SpeciesDef, level: number): string | null {
  if (sp.evolvesTo && level >= sp.evolvesTo.level) return sp.evolvesTo.species;
  return null;
}

// ─────────────────────────────────────────────────────────────
// 道具
// ─────────────────────────────────────────────────────────────
export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  /** battle = 戰鬥中可用, field = 場上可用, both */
  use: 'battle' | 'field' | 'both' | 'none';
  effect:
    | { type: 'heal'; power: number }
    | { type: 'mp'; power: number }
    | { type: 'revive'; power: number }
    | { type: 'capture' }
    | { type: 'healAll'; power: number }
    | { type: 'escape' }
    | { type: 'cure' }
    | { type: 'damage'; power: number }
    | { type: 'warp' }
    | { type: 'teach'; skill: string }
    | { type: 'none' };
}

export const ITEMS: Record<string, ItemDef> = {
  sealstone: {
    id: 'sealstone',
    name: '封印石',
    desc: '將瀕死的幻獸封入石中使之成為夥伴。對 BOSS 無效。',
    price: 120,
    use: 'battle',
    effect: { type: 'capture' }
  },
  herb: {
    id: 'herb',
    name: '療癒草',
    desc: '回復單體 60 HP。',
    price: 40,
    use: 'both',
    effect: { type: 'heal', power: 60 }
  },
  herb_hi: {
    id: 'herb_hi',
    name: '星露藥',
    desc: '回復單體 200 HP。',
    price: 150,
    use: 'both',
    effect: { type: 'heal', power: 200 }
  },
  manadrop: {
    id: 'manadrop',
    name: '魔力水滴',
    desc: '回復單體 40 MP。',
    price: 90,
    use: 'both',
    effect: { type: 'mp', power: 40 }
  },
  phoenix: {
    id: 'phoenix',
    name: '不死鳥羽',
    desc: '使戰鬥不能的同伴復活並回復一半 HP。',
    price: 400,
    use: 'both',
    effect: { type: 'revive', power: 0.5 }
  },
  smoke: {
    id: 'smoke',
    name: '煙霧彈',
    desc: '必定從戰鬥中逃脫。',
    price: 80,
    use: 'battle',
    effect: { type: 'escape' }
  },
  stardust: {
    id: 'stardust',
    name: '星塵碎片',
    desc: '從幻獸身上取得的結晶，可賣給商人。',
    price: 60,
    use: 'none',
    effect: { type: 'none' }
  },
  ether: {
    id: 'ether',
    name: '星泉之水',
    desc: '回復單體 80 MP。',
    price: 160,
    use: 'both',
    effect: { type: 'mp', power: 80 }
  },
  antidote: {
    id: 'antidote',
    name: '解毒草',
    desc: '解除單體的中毒、麻痺與睡眠。',
    price: 30,
    use: 'both',
    effect: { type: 'cure' }
  },
  bomb: {
    id: 'bomb',
    name: '星塵炸彈',
    desc: '對單體敵人造成固定 130 點傷害（無視防禦與屬性）。',
    price: 120,
    use: 'battle',
    effect: { type: 'damage', power: 130 }
  },
  warpwing: {
    id: 'warpwing',
    name: '傳送羽',
    desc: '在場上使用，立即回到最近造訪的城鎮。',
    price: 100,
    use: 'field',
    effect: { type: 'warp' }
  },
  stardust_hi: {
    id: 'stardust_hi',
    name: '星輝結晶',
    desc: '高純度的星塵結晶，能賣到不錯的價錢。',
    price: 220,
    use: 'none',
    effect: { type: 'none' }
  },
  elixir: {
    id: 'elixir',
    name: '復甦靈藥',
    desc: '回復我方全體 150 HP。',
    price: 320,
    use: 'both',
    effect: { type: 'healAll', power: 150 }
  },
  bomb_hi: {
    id: 'bomb_hi',
    name: '星輝炸彈',
    desc: '對單體敵人造成固定 320 點傷害（無視防禦與屬性）。',
    price: 300,
    use: 'battle',
    effect: { type: 'damage', power: 320 }
  },

  // ── 技能石：在場上對幻獸使用，可永久傳授技能 ──
  stone_purify: {
    id: 'stone_purify',
    name: '技能石・淨化',
    desc: '傳授「淨化」給一隻幻獸（解除我方單體異常狀態）。',
    price: 260,
    use: 'field',
    effect: { type: 'teach', skill: 'purify' }
  },
  stone_warcry: {
    id: 'stone_warcry',
    name: '技能石・戰吼',
    desc: '傳授「戰吼」給一隻幻獸（我方全體攻擊力 +30%）。',
    price: 320,
    use: 'field',
    effect: { type: 'teach', skill: 'warcry' }
  },
  stone_icebind: {
    id: 'stone_icebind',
    name: '技能石・冰縛',
    desc: '傳授「冰縛」給一隻幻獸（機率凍結敵人）。',
    price: 300,
    use: 'field',
    effect: { type: 'teach', skill: 'icebind' }
  },
  stone_rend: {
    id: 'stone_rend',
    name: '技能石・撕裂',
    desc: '傳授「撕裂」給一隻幻獸（使敵人流血）。',
    price: 280,
    use: 'field',
    effect: { type: 'teach', skill: 'rend' }
  },
  stone_regen: {
    id: 'stone_regen',
    name: '技能石・生命之泉',
    desc: '傳授「生命之泉」給一隻幻獸（回復我方全體 HP）。',
    price: 380,
    use: 'field',
    effect: { type: 'teach', skill: 'regen' }
  },
  stone_aegis: {
    id: 'stone_aegis',
    name: '技能石・神盾',
    desc: '傳授「神盾」給一隻幻獸（我方全體防禦力大幅提升）。',
    price: 420,
    use: 'field',
    effect: { type: 'teach', skill: 'aegis' }
  },
  stone_stardeath: {
    id: 'stone_stardeath',
    name: '技能石・星滅',
    desc: '傳授「星滅」給一隻幻獸（威力驚人的單體一擊）。',
    price: 900,
    use: 'field',
    effect: { type: 'teach', skill: 'stardeath' }
  }
};

export function itemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}
