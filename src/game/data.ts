import type { Ailment, Element, EquipSlot, EvolutionDef, GemEffect, PassiveDef, Shape, SkillDef, SpeciesDef, Stats, Unit } from './types';
import { EQUIP_SLOTS } from './types';
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

// ─────────────────────────────────────────────────────────────
// 裝備欄位
// ─────────────────────────────────────────────────────────────
export const EQUIP_SLOT_NAME: Record<EquipSlot, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '飾品'
};

export const STAT_KEYS: (keyof Stats)[] = ['hp', 'mp', 'atk', 'def', 'mag', 'spd'];

export const STAT_NAME: Record<keyof Stats, string> = {
  hp: 'HP',
  mp: 'MP',
  atk: '攻擊',
  def: '防禦',
  mag: '魔力',
  spd: '速度'
};

// ─────────────────────────────────────────────────────────────
// 種族被動特性
// ─────────────────────────────────────────────────────────────
export const PASSIVES: Record<string, PassiveDef> = {
  // 依身形的通用特性
  swift: { id: 'swift', name: '疾風之翼', desc: '速度 +15%，先發制人。', statMult: { spd: 0.15 } },
  sturdy: { id: 'sturdy', name: '厚鱗', desc: '防禦 +12%，並受到地屬性傷害 -15%。', statMult: { def: 0.12 }, elementResist: { earth: 0.15 } },
  fierce: { id: 'fierce', name: '猛襲', desc: '攻擊 +12%。', statMult: { atk: 0.12 } },
  absorb: { id: 'absorb', name: '黏液體質', desc: '造成傷害時吸取 12% 作為自身 HP。', drain: 0.12 },
  venomproof: { id: 'venomproof', name: '抗毒甲殼', desc: '免疫中毒。', immune: ['poison'] },
  aquatic: { id: 'aquatic', name: '親水鱗', desc: '受到水屬性傷害 -25%。', elementResist: { water: 0.25 } },
  // 元素特化
  flameheart: { id: 'flameheart', name: '焰心', desc: '魔力 +12%，受到火屬性傷害 -20%。', statMult: { mag: 0.12 }, elementResist: { fire: 0.2 } },
  iceveil: { id: 'iceveil', name: '冰幕', desc: '受到水屬性傷害 -25%，免疫冰凍。', elementResist: { water: 0.25 }, immune: ['freeze'] },
  galecloak: { id: 'galecloak', name: '風之斗篷', desc: '速度 +10%，受到風屬性傷害 -20%。', statMult: { spd: 0.1 }, elementResist: { wind: 0.2 } },
  stonebody: { id: 'stonebody', name: '岩體', desc: '防禦 +15%，受到地屬性傷害 -25%。', statMult: { def: 0.15 }, elementResist: { earth: 0.25 } },
  // 稀有 / 頭目
  starpact: { id: 'starpact', name: '星辰之契', desc: '魔力 +10%，免疫混亂。', statMult: { mag: 0.1 }, immune: ['confuse'] },
  unyielding: { id: 'unyielding', name: '不屈', desc: 'HP +12%，免疫麻痺。', statMult: { hp: 0.12 }, immune: ['paralysis'] },
  vampire: { id: 'vampire', name: '噬血', desc: '造成傷害時吸取 22% 作為自身 HP。', drain: 0.22 },
  voidscale: { id: 'voidscale', name: '虛空鱗', desc: '受到無屬性傷害 -25%，免疫混亂。', elementResist: { none: 0.25 }, immune: ['confuse'] },
  celestial: { id: 'celestial', name: '星穹加護', desc: '所有屬性傷害 -15%，戰鬥經驗 +15%。', elementResist: { fire: 0.15, water: 0.15, wind: 0.15, earth: 0.15, none: 0.15 }, expBonus: 0.15 },
  abyssal: { id: 'abyssal', name: '深淵加護', desc: '所有屬性傷害 -20%，金幣 +25%。', elementResist: { fire: 0.2, water: 0.2, wind: 0.2, earth: 0.2, none: 0.2 }, goldBonus: 0.25 },
  sprinter: { id: 'sprinter', name: '疾走', desc: '速度 +12%，逃跑必定成功。', statMult: { spd: 0.12 }, fleeAlways: true },
  greedy: { id: 'greedy', name: '貪慾', desc: '戰鬥勝利金幣 +25%。', goldBonus: 0.25 },
  // 隱藏種族 / 進化分支
  solarmight: { id: 'solarmight', name: '曜日之力', desc: '魔力 +15%，受到火屬性傷害 -25%。', statMult: { mag: 0.15 }, elementResist: { fire: 0.25 } },
  tidalgrace: { id: 'tidalgrace', name: '潮汐恩澤', desc: 'HP +15%，受到水屬性傷害 -25%，免疫冰凍。', statMult: { hp: 0.15 }, elementResist: { water: 0.25 }, immune: ['freeze'] },
  skylord: { id: 'skylord', name: '蒼穹之主', desc: '速度 +18%，受到風屬性傷害 -25%，逃跑必定成功。', statMult: { spd: 0.18 }, elementResist: { wind: 0.25 }, fleeAlways: true },
  earthshaker: { id: 'earthshaker', name: '大地震怒', desc: '攻擊 +15%、防禦 +12%，受到地屬性傷害 -25%。', statMult: { atk: 0.15, def: 0.12 }, elementResist: { earth: 0.25 } },
  prismweave: { id: 'prismweave', name: '稜彩之軀', desc: '魔力 +10%，所有屬性傷害 -15%。', statMult: { mag: 0.1 }, elementResist: { fire: 0.15, water: 0.15, wind: 0.15, earth: 0.15, none: 0.15 } },
  chronoweave: { id: 'chronoweave', name: '時序編織', desc: '速度 +20%，戰鬥經驗 +20%。', statMult: { spd: 0.2 }, expBonus: 0.2 },
  nightveil: { id: 'nightveil', name: '夜幕之影', desc: '造成傷害時吸取 25%，免疫睡眠。', drain: 0.25, immune: ['sleep'] },
  auroraveil: { id: 'auroraveil', name: '極光帷幕', desc: '所有屬性傷害 -20%，金幣 +20%。', elementResist: { fire: 0.2, water: 0.2, wind: 0.2, earth: 0.2, none: 0.2 }, goldBonus: 0.2 },
  // ── 星海（第五彈） ──
  nebulaheart: { id: 'nebulaheart', name: '星霧之心', desc: '魔力 +12%，免疫睡眠。', statMult: { mag: 0.12 }, immune: ['sleep'] },
  cometfire: { id: 'cometfire', name: '彗星之炎', desc: '攻擊 +12%、速度 +10%。', statMult: { atk: 0.12, spd: 0.1 } },
  ironhide: { id: 'ironhide', name: '隕鐵之甲', desc: '防禦 +15%，受到地屬性傷害 -20%。', statMult: { def: 0.15 }, elementResist: { earth: 0.2 } },
  starwing: { id: 'starwing', name: '星羽', desc: '速度 +18%，受到風屬性傷害 -15%。', statMult: { spd: 0.18 }, elementResist: { wind: 0.15 } },
  prismcarapace: {
    id: 'prismcarapace',
    name: '稜晶甲殼',
    desc: '防禦 +10%，所有異常狀態抗性 +30%。',
    statMult: { def: 0.1 },
    ailmentResist: { poison: 0.3, bleed: 0.3, paralysis: 0.3, sleep: 0.3, freeze: 0.3, confuse: 0.3 }
  },
  forgeblood: { id: 'forgeblood', name: '鍛爐之血', desc: '攻擊 +15%，受到火屬性傷害 -20%。', statMult: { atk: 0.15 }, elementResist: { fire: 0.2 } },
  tidalveil: { id: 'tidalveil', name: '星潮帷幕', desc: '受到水屬性傷害 -30%，造成傷害時吸取 8%。', elementResist: { water: 0.3 }, drain: 0.08 },
  gravcore: { id: 'gravcore', name: '重力核心', desc: 'HP +12%、防禦 +10%。', statMult: { hp: 0.12, def: 0.1 } },
  novaheart: { id: 'novaheart', name: '新星之心', desc: '魔力 +18%，受到火屬性傷害 -25%。', statMult: { mag: 0.18 }, elementResist: { fire: 0.25 } },
  voidanchor: {
    id: 'voidanchor',
    name: '虛空之錨',
    desc: '免疫混亂，所有異常狀態抗性 +20%。',
    immune: ['confuse'],
    ailmentResist: { poison: 0.2, bleed: 0.2, paralysis: 0.2, sleep: 0.2, freeze: 0.2 }
  },
  staraegis: { id: 'staraegis', name: '星海守護', desc: '所有屬性傷害 -25%，HP +20%。', statMult: { hp: 0.2 }, elementResist: { fire: 0.25, water: 0.25, wind: 0.25, earth: 0.25, none: 0.25 } },
  solarforged: { id: 'solarforged', name: '烈陽鍛體', desc: '攻擊 +20%，受到火屬性傷害 -25%。', statMult: { atk: 0.2 }, elementResist: { fire: 0.25 } }
};

/** 未指定 passive 時，依身形推導 */
const SHAPE_PASSIVE: Record<Shape, string | undefined> = {
  beast: 'fierce',
  bird: 'swift',
  blob: 'absorb',
  bug: 'venomproof',
  fish: 'aquatic',
  human: undefined,
  dragon: 'sturdy'
};

/**
 * 個別種族的專屬特性覆寫（優先於身形推導）。
 * 放在這裡集中管理，admin 改動種族數值時也不會遺失。
 */
const SPECIES_PASSIVE: Record<string, string> = {
  hero_asa: 'starpact',
  hero_rin: 'swift',
  hero_tieshan: 'stonebody',
  // 第一章 / 教團
  shadowwolf: 'vampire',
  crystalwarden: 'sturdy',
  sectleader: 'unyielding',
  // 火
  flamefox: 'flameheart',
  emberpup: 'flameheart',
  magmaboar: 'flameheart',
  cinderimp: 'flameheart',
  lavadrake: 'flameheart',
  phoenixbird: 'flameheart',
  magmalord: 'flameheart',
  miragecat: 'flameheart',
  // 水
  bubbletad: 'absorb',
  dewfrog: 'absorb',
  frostdeer: 'iceveil',
  frostfang: 'iceveil',
  snowpup: 'swift',
  frostbear: 'sturdy',
  frostwyrm: 'iceveil',
  frostlich: 'iceveil',
  icegolem: 'iceveil',
  tidecaller: 'aquatic',
  // 風
  zephyrling: 'galecloak',
  stormroc: 'galecloak',
  skywhale: 'galecloak',
  cloudserpent: 'galecloak',
  thunderbird: 'swift',
  // 地
  pebblet: 'sturdy',
  rockturtle: 'stonebody',
  mossbear: 'sturdy',
  crystalspine: 'stonebody',
  titanrock: 'stonebody',
  sandworm: 'venomproof',
  dunejackal: 'greedy',
  // 無屬性 / 稀有
  starling: 'starpact',
  luminox: 'starpact',
  voidmoth: 'voidscale',
  starsovereign: 'celestial',
  starwisp: 'celestial',
  shadehound: 'vampire',
  gloomweaver: 'venomproof',
  abyssknight: 'unyielding',
  voiddragon: 'voidscale',
  nullbeast: 'unyielding',
  abysssovereign: 'abyssal',
  // 隱藏種族 / 進化分支
  sunwyrm: 'solarmight',
  tidematron: 'tidalgrace',
  aerielord: 'skylord',
  geoavatar: 'earthshaker',
  prismfox: 'prismweave',
  chronodrake: 'chronoweave',
  nyxbeast: 'nightveil',
  aurorawisp: 'auroraveil',
  // 星海（第五彈）
  nebularat: 'nebulaheart',
  cometlisk: 'cometfire',
  meteorfang: 'ironhide',
  astralowl: 'starwing',
  prismspider: 'prismcarapace',
  forgehog: 'forgeblood',
  starhermit: 'tidalveil',
  gravitoad: 'gravcore',
  czarwyrm: 'stonebody',
  quasarbat: 'greedy',
  novadrake: 'novaheart',
  voidroot: 'earthshaker',
  cometlord: 'skylord',
  astralwhale: 'skylord',
  prismwyrm: 'prismweave',
  sunforger: 'solarforged',
  nebulaqueen: 'prismweave',
  starmother: 'staraegis'
};

export function passiveOf(sp: SpeciesDef | undefined | null): PassiveDef | null {
  if (!sp) return null;
  const id = sp.passive ?? SPECIES_PASSIVE[sp.id] ?? SHAPE_PASSIVE[sp.shape];
  return id ? PASSIVES[id] ?? null : null;
}

export function passiveOfUnit(u: Unit): PassiveDef | null {
  return passiveOf(SPECIES[u.speciesId]);
}

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
  starfall: {
    id: 'starfall',
    name: '星塵落',
    desc: '灑下細碎星塵，攻擊所有敵人。消耗低，適合開場清掃成群的小型幻獸。',
    element: 'none',
    mp: 9,
    power: 26,
    kind: 'attack',
    target: 'allEnemy'
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
  },
  // ── 隱藏種族 / 進化分支技能 ──
  sunburst: {
    id: 'sunburst',
    name: '曜日爆',
    desc: '凝聚成小太陽擲出，對單體造成極大火屬性傷害。',
    element: 'fire',
    mp: 30,
    power: 68,
    kind: 'attack',
    target: 'enemy'
  },
  tidalprison: {
    id: 'tidalprison',
    name: '潮汐牢',
    desc: '以巨浪困住所有敵人，並有機會使其麻痺。',
    element: 'water',
    mp: 26,
    power: 46,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'paralysis',
    ailmentChance: 0.4,
    ailmentTurns: 2
  },
  skyrend: {
    id: 'skyrend',
    name: '裂空斬',
    desc: '劃開天空的風刃，對單體造成極大風屬性傷害。',
    element: 'wind',
    mp: 28,
    power: 66,
    kind: 'attack',
    target: 'enemy'
  },
  earthwrath: {
    id: 'earthwrath',
    name: '大地怒',
    desc: '讓大地隆起並崩裂，重創所有敵人。',
    element: 'earth',
    mp: 30,
    power: 54,
    kind: 'attack',
    target: 'allEnemy'
  },
  prismray: {
    id: 'prismray',
    name: '稜彩光線',
    desc: '折射出七彩光束，對單體造成無屬性傷害並降低其魔力。',
    element: 'none',
    mp: 24,
    power: 54,
    kind: 'attack',
    target: 'enemy',
    stat: 'mag'
  },
  timebend: {
    id: 'timebend',
    name: '時序逆轉',
    desc: '大幅提升我方全體速度 60%（3 回合）。',
    element: 'none',
    mp: 22,
    power: 0.6,
    kind: 'buff',
    target: 'allAlly',
    stat: 'spd',
    turns: 3
  },
  nightfall: {
    id: 'nightfall',
    name: '夜幕降臨',
    desc: '讓夜色吞沒所有敵人，並有機會使其睡眠。',
    element: 'none',
    mp: 30,
    power: 44,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'sleep',
    ailmentChance: 0.35,
    ailmentTurns: 2
  },
  aurorabless: {
    id: 'aurorabless',
    name: '極光祝福',
    desc: '極光覆蓋全隊，回復我方全體的 HP 並解除異常。',
    element: 'none',
    mp: 30,
    power: 90,
    kind: 'heal',
    target: 'allAlly',
    cure: true
  },
  // ── 追加：星海（終章） ──
  nebulaedge: {
    id: 'nebulaedge',
    name: '星霧之刃',
    desc: '凝出星霧成刃，掃過所有敵人。',
    element: 'none',
    mp: 16,
    power: 40,
    kind: 'attack',
    target: 'allEnemy'
  },
  cometdash: {
    id: 'cometdash',
    name: '彗星突擊',
    desc: '拖著彗尾衝撞單體敵人。',
    element: 'fire',
    mp: 14,
    power: 44,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  meteorfall: {
    id: 'meteorfall',
    name: '隕石墜',
    desc: '召來成群隕石砸向所有敵人。',
    element: 'earth',
    mp: 22,
    power: 50,
    kind: 'attack',
    target: 'allEnemy'
  },
  astralchime: {
    id: 'astralchime',
    name: '星靈共鳴',
    desc: '星靈齊鳴，提升我方全體魔力 50%（3 回合）。',
    element: 'none',
    mp: 18,
    power: 0.5,
    kind: 'buff',
    target: 'allAlly',
    stat: 'mag',
    turns: 3
  },
  prismweb: {
    id: 'prismweb',
    name: '稜晶網',
    desc: '射出稜晶絲網，對單體造成傷害並有機會麻痺。',
    element: 'none',
    mp: 16,
    power: 34,
    kind: 'attack',
    target: 'enemy',
    ailment: 'paralysis',
    ailmentChance: 0.6,
    ailmentTurns: 3
  },
  forgeslam: {
    id: 'forgeslam',
    name: '鍛爐重錘',
    desc: '以鍛爐般沉重的鐵拳砸下，重創單體敵人。',
    element: 'earth',
    mp: 18,
    power: 58,
    kind: 'attack',
    target: 'enemy',
    physical: true
  },
  starcurrent: {
    id: 'starcurrent',
    name: '星流衝',
    desc: '星砂匯成急流，沖刷所有敵人。',
    element: 'water',
    mp: 22,
    power: 48,
    kind: 'attack',
    target: 'allEnemy'
  },
  gravpulse: {
    id: 'gravpulse',
    name: '重力脈衝',
    desc: '以重力壓迫單體敵人，並降低其速度。',
    element: 'water',
    mp: 20,
    power: 52,
    kind: 'attack',
    target: 'enemy',
    stat: 'spd'
  },
  novaflare: {
    id: 'novaflare',
    name: '新星爆焰',
    desc: '引爆一顆新星，灼燒所有敵人。',
    element: 'fire',
    mp: 32,
    power: 60,
    kind: 'attack',
    target: 'allEnemy'
  },
  voidbloom: {
    id: 'voidbloom',
    name: '荒根綻放',
    desc: '荒根自地下竄出，重擊所有敵人並造成流血。',
    element: 'earth',
    mp: 26,
    power: 54,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'bleed',
    ailmentChance: 0.5,
    ailmentTurns: 2
  },
  razorcomet: {
    id: 'razorcomet',
    name: '彗刃',
    desc: '化為一道銳利的彗星之刃貫穿單體敵人。',
    element: 'wind',
    mp: 20,
    power: 58,
    kind: 'attack',
    target: 'enemy'
  },
  tidalhymn: {
    id: 'tidalhymn',
    name: '潮汐詠歌',
    desc: '以潮聲撫平傷口，大量回復我方全體 HP。',
    element: 'water',
    mp: 24,
    power: 70,
    kind: 'heal',
    target: 'allAlly'
  },
  prismburst: {
    id: 'prismburst',
    name: '稜彩爆發',
    desc: '折射的七彩光炸裂，閃耀所有敵人。',
    element: 'none',
    mp: 30,
    power: 56,
    kind: 'attack',
    target: 'allEnemy'
  },
  sunlance: {
    id: 'sunlance',
    name: '烈陽矛',
    desc: '凝聚日光成矛，貫穿單體敵人。',
    element: 'fire',
    mp: 18,
    power: 62,
    kind: 'attack',
    target: 'enemy'
  },
  starblessing: {
    id: 'starblessing',
    name: '星海祝福',
    desc: '星海傾注而下，大幅回復我方全體 HP 並解除異常。',
    element: 'none',
    mp: 34,
    power: 110,
    kind: 'heal',
    target: 'allAlly',
    cure: true
  },
  ringstorm: {
    id: 'ringstorm',
    name: '星環風暴',
    desc: '星環高速旋轉，席捲所有敵人並有機會使其混亂。',
    element: 'none',
    mp: 30,
    power: 52,
    kind: 'attack',
    target: 'allEnemy',
    ailment: 'confuse',
    ailmentChance: 0.35,
    ailmentTurns: 2
  },
  zenithray: {
    id: 'zenithray',
    name: '天頂射線',
    desc: '自天頂筆直落下的光柱，造成極大的無屬性傷害。',
    element: 'none',
    mp: 28,
    power: 72,
    kind: 'attack',
    target: 'enemy'
  },
  soulforge: {
    id: 'soulforge',
    name: '靈魂鍛造',
    desc: '在戰場上重新鍛打全隊的意志，攻擊力提升 55%（3 回合）。',
    element: 'fire',
    mp: 22,
    power: 0.55,
    kind: 'buff',
    target: 'allAlly',
    stat: 'atk',
    turns: 3
  },
  voidhowl: {
    id: 'voidhowl',
    name: '虛空咆哮',
    desc: '自虛空傳出的咆哮，大幅降低所有敵人的攻擊力。',
    element: 'none',
    mp: 24,
    power: -0.35,
    kind: 'debuff',
    target: 'allEnemy',
    stat: 'atk',
    turns: 3
  },
  creationhymn: {
    id: 'creationhymn',
    name: '創世詠',
    desc: '唱出創世之初的旋律，重創所有敵人。',
    element: 'none',
    mp: 40,
    power: 78,
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
  abyss: { name: '深淵', element: 'none', mult: 1.3, desc: '深淵侵蝕，所有傷害 +30%。' },
  star: { name: '星海', element: 'none', mult: 1.25, desc: '星海之力，所有傷害 +25%。' },
  forge: { name: '爐火', element: 'fire', mult: 1.3, desc: '爐火通紅，火屬性傷害 +30%。' }
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
    base: g(80, 30, 18, 16, 14, 13),
    growth: g(12, 4.2, 2.7, 2.3, 2.1, 1.2),
    catchRate: 0,
    size: 1,
    c1: '#f0c8a0',
    c2: '#3a6fd8',
    desc: '星見村出身的見習幻獸使，天生能聽見晶石的低語。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 1, id: 'fireball' },
      { level: 2, id: 'starfall' },
      { level: 5, id: 'heal' },
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
    base: g(62, 46, 11, 12, 20, 15),
    growth: g(9, 6, 1.6, 1.8, 3.0, 1.4),
    catchRate: 0,
    size: 1,
    c1: '#f6d2b0',
    c2: '#59c2a8',
    desc: '微風草原的遊俠少女，操縱風與雷的咒術使。',
    skills: [
      { level: 1, id: 'windblade' },
      { level: 1, id: 'heal' },
      { level: 3, id: 'starfall' },
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
    base: g(102, 18, 22, 23, 6, 7),
    growth: g(15, 2.5, 3.0, 3.1, 0.8, 0.6),
    catchRate: 0,
    size: 1.05,
    c1: '#d8a878',
    c2: '#8a6634',
    desc: '暮色港的礦工老大，一身硬骨頭與厚實拳頭。',
    skills: [
      { level: 1, id: 'strike' },
      { level: 1, id: 'guardup' },
      { level: 6, id: 'starfall' },
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
    evolvesTo: [{ species: 'sunwyrm', level: 32, minPotential: 15, desc: '潛能 15 以上' }],
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
    evolvesTo: [{ species: 'tidematron', level: 36, minPotential: 15, desc: '潛能 15 以上' }],
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
    evolvesTo: [{ species: 'aerielord', level: 34, minPotential: 15, desc: '潛能 15 以上' }],
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
    evolvesTo: [{ species: 'geoavatar', level: 34, minPotential: 15, desc: '潛能 15 以上' }],
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
  },

  // ─────────────────────────────────────────────────────────────
  // 隱藏種族（無法直接捕獲，只能靠進化或合成取得）
  // ─────────────────────────────────────────────────────────────
  sunwyrm: {
    id: 'sunwyrm',
    name: '曜陽龍',
    element: 'fire',
    shape: 'dragon',
    base: g(300, 120, 34, 28, 40, 24),
    growth: g(19, 7, 2.4, 2.2, 3.2, 1.8),
    catchRate: 0,
    hidden: true,
    size: 1.6,
    c1: '#e8762a',
    c2: '#fff0b0',
    horns: true,
    wings: true,
    desc: '熔岩亞龍吸收了整片火焰後的姿態，鱗片亮得像正午的太陽。',
    skills: [
      { level: 1, id: 'flameburst' },
      { level: 1, id: 'lavaburst' },
      { level: 1, id: 'sunburst' },
      { level: 30, id: 'inferno' },
      { level: 40, id: 'aegis' }
    ]
  },
  tidematron: {
    id: 'tidematron',
    name: '潮汐聖母',
    element: 'water',
    shape: 'fish',
    base: g(300, 150, 24, 32, 34, 20),
    growth: g(20, 8, 2.0, 2.4, 2.8, 1.6),
    catchRate: 0,
    hidden: true,
    size: 1.7,
    c1: '#3f8fd0',
    c2: '#d0f8ff',
    desc: '冰海巨鯨長到極致後，歌聲能讓整片海面平靜下來。',
    skills: [
      { level: 1, id: 'tidalwave' },
      { level: 1, id: 'tsunami' },
      { level: 1, id: 'tidalprison' },
      { level: 30, id: 'healall' },
      { level: 40, id: 'barrier' }
    ]
  },
  aerielord: {
    id: 'aerielord',
    name: '蒼穹霸主',
    element: 'wind',
    shape: 'bird',
    base: g(250, 120, 32, 24, 28, 42),
    growth: g(17, 7, 2.4, 1.9, 2.3, 3.0),
    catchRate: 0,
    hidden: true,
    size: 1.7,
    c1: '#6fd0a0',
    c2: '#e8fff0',
    wings: true,
    desc: '風暴巨鳥旋上雲頂之後，翅膀一拍就能改變整片草原的風向。',
    skills: [
      { level: 1, id: 'cyclone' },
      { level: 1, id: 'tempest' },
      { level: 1, id: 'skyrend' },
      { level: 30, id: 'haste' },
      { level: 40, id: 'barrier' }
    ]
  },
  geoavatar: {
    id: 'geoavatar',
    name: '大地巨神',
    element: 'earth',
    shape: 'human',
    base: g(340, 90, 40, 46, 22, 16),
    growth: g(24, 5, 3.0, 3.4, 1.6, 1.2),
    catchRate: 0,
    hidden: true,
    size: 1.8,
    c1: '#a88448',
    c2: '#f0dcb0',
    horns: true,
    desc: '泰坦岩魔站起來的那一刻，整座山都跟著升高了一點。',
    skills: [
      { level: 1, id: 'quake' },
      { level: 1, id: 'stoneedge' },
      { level: 1, id: 'earthwrath' },
      { level: 30, id: 'aegis' },
      { level: 40, id: 'guardup' }
    ]
  },
  prismfox: {
    id: 'prismfox',
    name: '稜彩狐',
    element: 'none',
    shape: 'beast',
    base: g(190, 120, 26, 24, 34, 30),
    growth: g(13, 8.5, 2.0, 1.9, 3.0, 2.4),
    catchRate: 0,
    hidden: true,
    size: 1.2,
    c1: '#f0d0f0',
    c2: '#9fe0ff',
    desc: '毛皮會隨光線折射出不同顏色，同一隻很難被看兩次同樣的樣子。',
    skills: [
      { level: 1, id: 'starlance' },
      { level: 1, id: 'prismray' },
      { level: 1, id: 'focus' },
      { level: 26, id: 'barrier' },
      { level: 34, id: 'starburst' }
    ]
  },
  chronodrake: {
    id: 'chronodrake',
    name: '時序幻龍',
    element: 'none',
    shape: 'dragon',
    base: g(300, 150, 32, 30, 38, 34),
    growth: g(19, 9, 2.3, 2.2, 2.9, 2.6),
    catchRate: 0,
    hidden: true,
    size: 1.7,
    c1: '#8a7ad8',
    c2: '#d8f0ff',
    horns: true,
    wings: true,
    desc: '牠的每一次振翅都比上一次早一點發生，彷彿時間被折了起來。',
    skills: [
      { level: 1, id: 'creationray' },
      { level: 1, id: 'timebend' },
      { level: 1, id: 'starburst' },
      { level: 32, id: 'aegis' },
      { level: 42, id: 'stardeath' }
    ]
  },
  nyxbeast: {
    id: 'nyxbeast',
    name: '夜影獸',
    element: 'none',
    shape: 'beast',
    base: g(240, 110, 42, 26, 30, 34),
    growth: g(15, 7, 3.0, 1.9, 2.4, 2.6),
    catchRate: 0,
    hidden: true,
    size: 1.35,
    c1: '#2a2440',
    c2: '#a88af0',
    horns: true,
    desc: '由影子拼成的野獸，在沒有月光的晚上反而看得更清楚。',
    skills: [
      { level: 1, id: 'shadowclaw' },
      { level: 1, id: 'voidclaw' },
      { level: 1, id: 'nightfall' },
      { level: 28, id: 'bloodmoon' },
      { level: 38, id: 'chaosgaze' }
    ]
  },
  aurorawisp: {
    id: 'aurorawisp',
    name: '極光精靈',
    element: 'none',
    shape: 'blob',
    base: g(210, 170, 22, 26, 40, 32),
    growth: g(13, 10, 1.7, 1.9, 3.1, 2.2),
    catchRate: 0,
    hidden: true,
    size: 1.15,
    c1: '#9fe8d0',
    c2: '#f0e0ff',
    desc: '只有在最冷最安靜的夜裡，才會有一小片極光願意停下來變成牠。',
    skills: [
      { level: 1, id: 'aurorabless' },
      { level: 1, id: 'eclipsebolt' },
      { level: 1, id: 'starburst' },
      { level: 30, id: 'purifyAll' },
      { level: 40, id: 'judgement' }
    ],
    evolvesTo: [{ species: 'starmother', level: 55, minPotential: 45, desc: '潛能 45 以上、等級 55' }]
  },

  // ═══════════════════════════════════════════════════════════
  // 第五章：星海之願（一般種族）
  // ═══════════════════════════════════════════════════════════
  nebularat: {
    id: 'nebularat',
    name: '星霧鼠',
    element: 'none',
    shape: 'blob',
    base: g(52, 22, 12, 10, 15, 16),
    growth: g(8, 3.2, 1.6, 1.4, 2.3, 1.9),
    catchRate: 0.18,
    size: 0.9,
    c1: '#c8d4ec',
    c2: '#7a86a8',
    desc: '身體像一團會走動的星霧，摸起來涼涼的，尾巴拖著一縷光。',
    skills: [
      { level: 1, id: 'starburst' },
      { level: 1, id: 'nebulaedge' },
      { level: 22, id: 'haste' },
      { level: 34, id: 'prismburst' }
    ]
  },
  cometlisk: {
    id: 'cometlisk',
    name: '彗尾蜥',
    element: 'fire',
    shape: 'beast',
    base: g(68, 26, 19, 13, 16, 15),
    growth: g(10, 4.4, 2.6, 1.7, 2.4, 1.5),
    catchRate: 0.14,
    size: 1.05,
    c1: '#f0784a',
    c2: '#ffd98a',
    desc: '尾端拖著一小段彗尾，跑動時會在岩石上留下焦黑的星形痕跡。',
    skills: [
      { level: 1, id: 'ember' },
      { level: 1, id: 'cometdash' },
      { level: 24, id: 'powerup' },
      { level: 36, id: 'novaflare' }
    ],
    evolvesTo: [{ species: 'novadrake', level: 40, minPotential: 15, desc: '潛能 15 以上' }]
  },
  meteorfang: {
    id: 'meteorfang',
    name: '隕鐵牙獸',
    element: 'earth',
    shape: 'beast',
    base: g(84, 16, 22, 19, 8, 10),
    growth: g(12.5, 2, 2.9, 2.6, 0.9, 0.9),
    catchRate: 0.13,
    size: 1.2,
    c1: '#6a6a78',
    c2: '#c8b48a',
    horns: true,
    desc: '獠牙是墜地隕鐵打磨而成，據說能聞出地底深處的星塵脈。',
    skills: [
      { level: 1, id: 'bite' },
      { level: 1, id: 'rockfall' },
      { level: 26, id: 'guardup' },
      { level: 40, id: 'meteorfall' }
    ],
    evolvesTo: [{ species: 'voidroot', level: 42, minPotential: 15, desc: '潛能 15 以上' }]
  },
  astralowl: {
    id: 'astralowl',
    name: '星靈梟',
    element: 'wind',
    shape: 'bird',
    base: g(60, 36, 16, 12, 21, 22),
    growth: g(8.5, 5.4, 2.1, 1.6, 2.9, 2.3),
    catchRate: 0.12,
    size: 1.1,
    c1: '#a8b8e8',
    c2: '#f0e8b0',
    wings: true,
    desc: '翅羽間綴著會明滅的星點，振翅時整片森林的蟲鳴都會安靜下來。',
    skills: [
      { level: 1, id: 'gust' },
      { level: 1, id: 'astralchime' },
      { level: 26, id: 'thunderbolt' },
      { level: 38, id: 'razorcomet' }
    ],
    evolvesTo: [{ species: 'cometlord', level: 40, minPotential: 15, desc: '潛能 15 以上' }]
  },
  prismspider: {
    id: 'prismspider',
    name: '稜晶蛛',
    element: 'none',
    shape: 'bug',
    base: g(62, 30, 17, 15, 18, 18),
    growth: g(9, 4.6, 2.3, 2.0, 2.5, 1.9),
    catchRate: 0.15,
    size: 1.0,
    c1: '#e0c8f0',
    c2: '#9fd8f0',
    desc: '吐出的絲會折射光線，牠結的網在夜裡看起來像一小片銀河。',
    skills: [
      { level: 1, id: 'venomfang' },
      { level: 1, id: 'prismweb' },
      { level: 28, id: 'crystalbeam' },
      { level: 40, id: 'prismburst' }
    ]
  },
  forgehog: {
    id: 'forgehog',
    name: '鍛爐刺豬',
    element: 'earth',
    shape: 'beast',
    base: g(94, 12, 24, 21, 7, 7),
    growth: g(14, 1.6, 3.1, 2.9, 0.7, 0.6),
    catchRate: 0.11,
    size: 1.25,
    c1: '#8a5a3a',
    c2: '#e0a850',
    horns: true,
    desc: '背上的尖刺燒得通紅，牠躺過的地方連石頭都會被燒出凹痕。',
    skills: [
      { level: 1, id: 'stonepunch' },
      { level: 1, id: 'forgeslam' },
      { level: 30, id: 'warcry' },
      { level: 42, id: 'earthwrath' }
    ]
  },
  starhermit: {
    id: 'starhermit',
    name: '星砂寄居獸',
    element: 'water',
    shape: 'fish',
    base: g(90, 28, 16, 22, 15, 11),
    growth: g(13, 4.2, 1.9, 2.9, 2.1, 1.0),
    catchRate: 0.16,
    size: 1.15,
    c1: '#c8b090',
    c2: '#8fd0e8',
    desc: '把星砂黏成殼的研究者，每隔一段時間就會換一個更大的家。',
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 1, id: 'starcurrent' },
      { level: 26, id: 'barrier' },
      { level: 38, id: 'tidalwave' }
    ]
  },
  gravitoad: {
    id: 'gravitoad',
    name: '重力蟾',
    element: 'water',
    shape: 'blob',
    base: g(98, 26, 15, 21, 17, 9),
    growth: g(14, 3.8, 1.8, 2.8, 2.4, 0.8),
    catchRate: 0.14,
    size: 1.2,
    c1: '#5a7a58',
    c2: '#a8d0a0',
    desc: '四周的重力比別處沉重，靠近牠的飛蟲都會直直墜落。',
    skills: [
      { level: 1, id: 'aquajet' },
      { level: 1, id: 'gravpulse' },
      { level: 28, id: 'frostbreath' },
      { level: 40, id: 'tsunami' }
    ]
  },
  czarwyrm: {
    id: 'czarwyrm',
    name: '帝冠巨龍',
    element: 'none',
    shape: 'dragon',
    base: g(190, 84, 25, 23, 25, 20),
    growth: g(15, 6.5, 2.4, 2.2, 2.4, 1.8),
    catchRate: 0.05,
    size: 1.5,
    c1: '#d8c060',
    c2: '#5a4a8a',
    horns: true,
    wings: true,
    desc: '額上頂著一枚星冠，牠振翅的頻率據說與星塵晶石完全相同。',
    skills: [
      { level: 1, id: 'dragonbreath' },
      { level: 1, id: 'crystalbeam' },
      { level: 30, id: 'aegis' },
      { level: 42, id: 'creationray' }
    ]
  },
  quasarbat: {
    id: 'quasarbat',
    name: '類星蝠',
    element: 'none',
    shape: 'bird',
    base: g(56, 34, 15, 11, 23, 26),
    growth: g(8, 5.0, 2.0, 1.4, 3.0, 2.4),
    catchRate: 0.12,
    size: 1.0,
    c1: '#3a3a5a',
    c2: '#c8a8ff',
    wings: true,
    desc: '高速飛掠時會拖出一道紫光，遠看像夜空裡一顆會移動的星。',
    skills: [
      { level: 1, id: 'gust' },
      { level: 1, id: 'lullaby' },
      { level: 24, id: 'slow' },
      { level: 38, id: 'ringstorm' }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 第五章：星海之願（隱藏種族）
  // ═══════════════════════════════════════════════════════════
  novadrake: {
    id: 'novadrake',
    name: '新星巨龍',
    element: 'fire',
    shape: 'dragon',
    base: g(280, 140, 36, 28, 35, 30),
    growth: g(18, 8, 2.5, 2.1, 2.7, 2.3),
    catchRate: 0,
    hidden: true,
    size: 1.65,
    c1: '#ff7a3a',
    c2: '#ffe08a',
    horns: true,
    wings: true,
    desc: '牠的胸口燃著一枚新星，每一次呼吸都讓周圍的空氣微微發亮。',
    skills: [
      { level: 1, id: 'novaflare' },
      { level: 1, id: 'sunlance' },
      { level: 1, id: 'soulforge' },
      { level: 44, id: 'inferno' },
      { level: 54, id: 'creationhymn' }
    ]
  },
  voidroot: {
    id: 'voidroot',
    name: '荒根巨獸',
    element: 'earth',
    shape: 'blob',
    base: g(340, 92, 30, 40, 20, 14),
    growth: g(22, 5, 2.3, 3.2, 1.6, 1.1),
    catchRate: 0,
    hidden: true,
    size: 1.55,
    c1: '#4a5a3a',
    c2: '#b0d090',
    desc: '據說牠的根盤過整片大陸的地底，只是從來沒人看過另一端。',
    skills: [
      { level: 1, id: 'voidbloom' },
      { level: 1, id: 'earthwrath' },
      { level: 1, id: 'barrier' },
      { level: 46, id: 'meteorfall' },
      { level: 56, id: 'aegis' }
    ]
  },
  cometlord: {
    id: 'cometlord',
    name: '彗星之翼',
    element: 'wind',
    shape: 'dragon',
    base: g(250, 155, 30, 25, 36, 38),
    growth: g(16, 9.5, 2.2, 2.0, 2.9, 2.8),
    catchRate: 0,
    hidden: true,
    size: 1.6,
    c1: '#8fd8f0',
    c2: '#e8f0ff',
    horns: true,
    wings: true,
    desc: '劃過天際時會留下一道長長的彗尾，星海的人都會對著牠許願。',
    skills: [
      { level: 1, id: 'razorcomet' },
      { level: 1, id: 'skyrend' },
      { level: 1, id: 'timebend' },
      { level: 44, id: 'tempest' },
      { level: 54, id: 'judgement' }
    ]
  },
  astralwhale: {
    id: 'astralwhale',
    name: '星海鯨',
    element: 'wind',
    shape: 'fish',
    base: g(370, 125, 26, 32, 33, 20),
    growth: g(24, 8, 2.0, 2.6, 2.7, 1.6),
    catchRate: 0,
    hidden: true,
    size: 1.8,
    c1: '#6a8ab8',
    c2: '#cfe8ff',
    desc: '牠游過的地方會泛起一整片星海，聽過牠鳴唱的人都說像回到了故鄉。',
    skills: [
      { level: 1, id: 'starcurrent' },
      { level: 1, id: 'tidalhymn' },
      { level: 1, id: 'starblessing' },
      { level: 46, id: 'tsunami' },
      { level: 56, id: 'creationhymn' }
    ]
  },
  prismwyrm: {
    id: 'prismwyrm',
    name: '稜彩幻龍',
    element: 'none',
    shape: 'dragon',
    base: g(270, 165, 30, 26, 39, 30),
    growth: g(17, 10, 2.2, 2.0, 3.0, 2.3),
    catchRate: 0,
    hidden: true,
    size: 1.65,
    c1: '#e0b0f0',
    c2: '#a0f0ff',
    horns: true,
    wings: true,
    desc: '鱗片是一片片凝住的光，牠轉頭時整條龍會換一種顏色。',
    skills: [
      { level: 1, id: 'prismburst' },
      { level: 1, id: 'prismray' },
      { level: 1, id: 'astralchime' },
      { level: 44, id: 'zenithray' },
      { level: 54, id: 'creationray' }
    ]
  },
  sunforger: {
    id: 'sunforger',
    name: '烈陽鍛神',
    element: 'fire',
    shape: 'human',
    base: g(300, 115, 40, 31, 27, 23),
    growth: g(20, 6.5, 2.8, 2.4, 1.9, 1.7),
    catchRate: 0,
    hidden: true,
    size: 1.55,
    c1: '#f0a84a',
    c2: '#ffe0a0',
    horns: true,
    desc: '手持一把以日光鍛成的錘，牠敲下的每一下都在星海上綻開火花。',
    skills: [
      { level: 1, id: 'forgeslam' },
      { level: 1, id: 'sunlance' },
      { level: 1, id: 'soulforge' },
      { level: 44, id: 'novaflare' },
      { level: 54, id: 'stardeath' }
    ]
  },
  nebulaqueen: {
    id: 'nebulaqueen',
    name: '星霧女王',
    element: 'none',
    shape: 'bug',
    base: g(235, 185, 24, 27, 41, 34),
    growth: g(14, 11, 1.8, 2.0, 3.2, 2.4),
    catchRate: 0,
    hidden: true,
    size: 1.45,
    c1: '#b8a8e8',
    c2: '#e8f0ff',
    desc: '端坐在自己織成的星霧之網中央，所有迷路的星塵最終都會流向她。',
    skills: [
      { level: 1, id: 'prismweb' },
      { level: 1, id: 'prismburst' },
      { level: 1, id: 'voidhowl' },
      { level: 44, id: 'ringstorm' },
      { level: 54, id: 'judgement' }
    ]
  },
  starmother: {
    id: 'starmother',
    name: '星海之主',
    element: 'none',
    shape: 'human',
    base: g(430, 225, 41, 39, 46, 35),
    growth: g(24, 12, 2.6, 2.5, 3.0, 2.2),
    catchRate: 0,
    hidden: true,
    size: 1.75,
    c1: '#cfe0ff',
    c2: '#8a7ad8',
    desc: '星海最深處那個願意聆聽所有願望的存在。她不是光，她是接住光的地方。',
    skills: [
      { level: 1, id: 'starblessing' },
      { level: 1, id: 'zenithray' },
      { level: 1, id: 'creationhymn' },
      { level: 50, id: 'judgement' },
      { level: 60, id: 'stardeath' }
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
  unit.max = statsForUnit(unit);
  unit.hp = unit.max.hp;
  unit.mp = unit.max.mp;
  unit.skills = skillsFor(sp, unit.level);
  return true;
}

/** 取得種族的所有進化分支 */
export function evolutionBranches(sp: SpeciesDef): EvolutionDef[] {
  if (!sp.evolvesTo) return [];
  return Array.isArray(sp.evolvesTo) ? sp.evolvesTo : [sp.evolvesTo];
}

/** 依單位目前狀態，列出「條件已滿足」的進化分支 */
export function evolutionEligible(
  u: Unit,
  opts?: { inventory?: Record<string, number>; flags?: Record<string, boolean>; requireItem?: boolean }
): EvolutionDef[] {
  const sp = SPECIES[u.speciesId];
  if (!sp) return [];
  return evolutionBranches(sp).filter((e) => {
    if (!SPECIES[e.species]) return false;
    if (u.level < e.level) return false;
    if (e.element && u.element !== e.element) return false;
    if (e.minPotential != null && (u.potential ?? 0) < e.minPotential) return false;
    if (e.flag && !opts?.flags?.[e.flag]) return false;
    if (e.item && opts?.requireItem) {
      if ((opts.inventory?.[e.item] ?? 0) <= 0) return false;
    }
    return true;
  });
}

/**
 * 升級時的自動進化判定：
 * 只考慮「不需要消耗道具」的分支，避免自動吃掉玩家的道具。
 */
export function autoEvolution(u: Unit, flags?: Record<string, boolean>): string | null {
  const sp = SPECIES[u.speciesId];
  if (!sp) return null;
  for (const e of evolutionBranches(sp)) {
    if (e.item) continue;
    if (u.level < e.level) continue;
    if (e.element && u.element !== e.element) continue;
    if (e.minPotential != null && (u.potential ?? 0) < e.minPotential) continue;
    if (e.flag && !flags?.[e.flag]) continue;
    return e.species;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 合成 / 育種
// ─────────────────────────────────────────────────────────────
export interface FusionDef {
  a: string;
  b: string;
  result: string;
  /** 合成後的等級（未指定時取雙方平均 +1） */
  level?: number;
  desc: string;
}

/** 特定組合的合成配方（不分順序） */
export const FUSIONS: FusionDef[] = [
  { a: 'flamefox', b: 'frostdeer', result: 'prismfox', desc: '火與冰交會之處，會凝出折射光線的毛皮。' },
  { a: 'emberpup', b: 'snowpup', result: 'prismfox', desc: '兩隻幼獸一起長大時，會彼此染上對方的顏色。' },
  { a: 'shadowwolf', b: 'voidmoth', result: 'nyxbeast', desc: '影子吞下微光之後，站了起來。' },
  { a: 'shadehound', b: 'gloomweaver', result: 'nyxbeast', desc: '迴廊裡的兩種黑暗合而為一。' },
  { a: 'starwisp', b: 'luminox', result: 'aurorawisp', desc: '兩道微光合流，變成一段會呼吸的極光。' },
  { a: 'starling', b: 'voidmoth', result: 'aurorawisp', desc: '星光淨化了虛空，留下溫柔的帷幕。' },
  { a: 'crystalwarden', b: 'frostwyrm', result: 'chronodrake', desc: '晶石與冰晶的時間流動並不一致。' },
  { a: 'lavadrake', b: 'leviathan', result: 'chronodrake', desc: '火與海的古老記憶在高溫與深壓中折疊。' },
  { a: 'phoenixbird', b: 'skywhale', result: 'aerielord', desc: '天空本身就接住了兩隻飛得最高的幻獸。' },
  { a: 'titanrock', b: 'magmalord', result: 'geoavatar', desc: '大地的骨與火的血，重新拼成一個站立的神。' },
  { a: 'czarwyrm', b: 'frostbear', result: 'geoavatar', desc: '兩股厚重力量合成一尊不會倒下的形體。' },
  { a: 'lavadrake', b: 'magmalord', result: 'sunwyrm', desc: '兩團火合在一起，亮得像正午。' },
  { a: 'leviathan', b: 'tidecaller', result: 'tidematron', desc: '整片海把聲音交給了同一個存在。' },
  { a: 'stormroc', b: 'cloudserpent', result: 'aerielord', desc: '風與雲再也分不開。' },
  // ── 星海配方（第五彈） ──
  { a: 'prismspider', b: 'czarwyrm', result: 'prismwyrm', desc: '王的鱗片與蛛的稜絲交纏，織出一條會變色的龍。' },
  { a: 'quasarbat', b: 'starhermit', result: 'astralwhale', desc: '一隻總在飛、一隻總在漂，牠們決定一起游進星海。' },
  { a: 'forgehog', b: 'magmalord', result: 'sunforger', desc: '爐火與地火同源，錘下的火花凝成了一個神。' },
  { a: 'prismspider', b: 'astralowl', result: 'nebulaqueen', desc: '蛛網接住了星靈的羽毛，網裡長出了一位女王。' },
  { a: 'meteorfang', b: 'titanrock', result: 'voidroot', desc: '隕鐵的牙扎進大地的骨，根便一直長了下去。' },
  { a: 'astralowl', b: 'stormroc', result: 'cometlord', desc: '兩對最擅長高飛的翅，在同一個高度相遇。' },
  { a: 'cometlisk', b: 'phoenixbird', result: 'novadrake', desc: '彗尾穿過不死鳥的火焰，燒得更亮了一層。' },
  { a: 'gravitoad', b: 'leviathan', result: 'tidematron', desc: '重力壓進海裡，海便有了自己的重心。' },
  { a: 'nebularat', b: 'luminox', result: 'aurorawisp', desc: '一縷星霧、一點微光，合起來就成了極光。' },
  { a: 'czarwyrm', b: 'cloudserpent', result: 'chronodrake', desc: '冠上的星與雲中的時，在同一個瞬間疊在一起。' }
];

/** 沒有特定配方時，依屬性決定的合成結果（一般種族） */
const FUSION_BY_ELEMENT: Record<Element, string> = {
  fire: 'flamefox',
  water: 'tidecaller',
  wind: 'stormroc',
  earth: 'titanrock',
  none: 'starwisp'
};

/** 育種：父母同屬性且潛能達門檻時，誕生該屬性的隱藏種族 */
const FUSION_HIDDEN_BY_ELEMENT: Record<Element, string> = {
  fire: 'sunwyrm',
  water: 'tidematron',
  wind: 'aerielord',
  earth: 'geoavatar',
  none: 'aurorawisp'
};

/** 育種出隱藏種族所需的潛能門檻 */
export const HIDDEN_FUSION_POTENTIAL = 30;

export function fusionResult(a: Unit, b: Unit): { species: string; recipe: FusionDef | null } {
  for (const f of FUSIONS) {
    if ((f.a === a.speciesId && f.b === b.speciesId) || (f.a === b.speciesId && f.b === a.speciesId)) {
      return { species: f.result, recipe: f };
    }
  }
  // 同種族 → 沿用
  if (a.speciesId === b.speciesId && SPECIES[a.speciesId]) return { species: a.speciesId, recipe: null };
  const lead = a.level >= b.level ? a : b;
  const other = lead === a ? b : a;
  const el: Element = lead.element !== 'none' ? lead.element : other.element;
  // 育種：父母同屬性、潛能足夠高 → 隱藏種族
  if (
    lead.element !== 'none' &&
    lead.element === other.element &&
    fusionPotential(a, b) >= HIDDEN_FUSION_POTENTIAL
  ) {
    const hidden = FUSION_HIDDEN_BY_ELEMENT[lead.element];
    if (hidden && SPECIES[hidden]) return { species: hidden, recipe: null };
  }
  return { species: FUSION_BY_ELEMENT[el] ?? 'starwisp', recipe: null };
}

/** 合成後的潛能：父母平均 + 世代獎勵，上限 50 */
export function fusionPotential(a: Unit, b: Unit): number {
  const base = ((a.potential ?? 0) + (b.potential ?? 0)) / 2;
  const bonus = Math.min(8, Math.floor((a.level + b.level) / 12)) + 5;
  return Math.max(0, Math.min(50, Math.round(base + bonus)));
}

/** 合成後的等級 */
export function fusionLevel(a: Unit, b: Unit, recipe: FusionDef | null): number {
  if (recipe?.level) return recipe.level;
  return Math.max(1, Math.floor((a.level + b.level) / 2) + 1);
}

/** 合成消耗的金幣 */
export function fusionCost(a: Unit, b: Unit): number {
  return 200 + (a.level + b.level) * 25;
}

// ─────────────────────────────────────────────────────────────
// 裝備強化 / 鑲嵌
// ─────────────────────────────────────────────────────────────
export const MAX_UPGRADE = 10;
export const MAX_SOCKETS = 3;

/** 強化帶來的加成倍率（+1 為 1.2 倍，每級 +0.2） */
export function upgradeScale(level: number): number {
  return 1 + 0.2 * Math.max(0, Math.min(MAX_UPGRADE, level));
}

/** 強化所需：金幣與星塵核心數 */
export function upgradeCost(nextLevel: number): { gold: number; cores: number } {
  return { gold: 120 + nextLevel * 90, cores: 1 + Math.floor(nextLevel / 3) };
}

/** 取得某欄位鑲嵌的寶石效果資料 */
export function gemsOf(u: Unit, slot: EquipSlot): { id: string; effect: GemEffect }[] {
  const out: { id: string; effect: GemEffect }[] = [];
  for (const id of u.gems?.[slot] ?? []) {
    const def = ITEMS[id];
    if (def && def.effect.type === 'gem') out.push({ id, effect: def.effect });
  }
  return out;
}

/** 所有裝備 + 寶石的加成（用於 UI 顯示） */
export function socketSlots(u: Unit, slot: EquipSlot): (string | null)[] {
  const gems = u.gems?.[slot] ?? [];
  const out: (string | null)[] = [];
  for (let i = 0; i < MAX_SOCKETS; i++) out.push(gems[i] ?? null);
  return out;
}

export function gemItemIds(): string[] {
  return Object.keys(ITEMS).filter((id) => ITEMS[id].effect.type === 'gem');
}

// ─────────────────────────────────────────────────────────────
// 裝備與被動：最終能力計算
// ─────────────────────────────────────────────────────────────
/** 取得單位裝備的道具（略過無效資料） */
export function equipItems(u: Unit): { slot: EquipSlot; item: ItemDef }[] {
  const out: { slot: EquipSlot; item: ItemDef }[] = [];
  for (const slot of EQUIP_SLOTS) {
    const id = u.equip?.[slot];
    const item = id ? ITEMS[id] : undefined;
    if (item && item.effect.type === 'equip') out.push({ slot, item });
  }
  return out;
}

/** 依種族、等級、裝備強化、鑲嵌寶石與潛能計算最終能力上限 */
export function statsForUnit(u: Unit): Stats {
  const sp = SPECIES[u.speciesId];
  if (!sp) return u.max ?? { hp: 1, mp: 0, atk: 1, def: 1, mag: 1, spd: 1 };
  const base = statAtLevel(sp, u.level);
  const flat = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, spd: 0 };
  const mult = { hp: 0, mp: 0, atk: 0, def: 0, mag: 0, spd: 0 };
  for (const { slot, item } of equipItems(u)) {
    if (item.effect.type !== 'equip') continue;
    const scale = upgradeScale(u.equipUp?.[slot] ?? 0);
    for (const k of STAT_KEYS) {
      const b = item.effect.bonus?.[k];
      if (b) flat[k] += Math.round(b * scale);
      const m = item.effect.mult?.[k];
      if (m) mult[k] += m * scale;
    }
  }
  for (const slot of EQUIP_SLOTS) {
    for (const { effect } of gemsOf(u, slot)) {
      for (const k of STAT_KEYS) {
        const b = effect.bonus?.[k];
        if (b) flat[k] += b;
        const m = effect.mult?.[k];
        if (m) mult[k] += m;
      }
    }
  }
  // 潛能：0~50，提供最多 +25% 全能力
  const pot = Math.max(0, Math.min(50, u.potential ?? 0));
  const potMult = 1 + pot / 200;
  const out = {} as Stats;
  for (const k of STAT_KEYS) {
    const v = (base[k] + flat[k]) * (1 + mult[k]) * potMult;
    out[k] = Math.max(k === 'mp' ? 0 : 1, Math.round(v));
  }
  return out;
}

/** 裝備帶來的「不含裝備 → 含裝備」差異（供 UI 顯示 +X） */
export function equipDelta(u: Unit): Partial<Record<keyof Stats, number>> {
  const sp = SPECIES[u.speciesId];
  if (!sp) return {};
  const base = statAtLevel(sp, u.level);
  const withEquip = statsForUnit(u);
  const out: Partial<Record<keyof Stats, number>> = {};
  for (const k of STAT_KEYS) {
    const d = withEquip[k] - base[k];
    if (d !== 0) out[k] = d;
  }
  return out;
}

/** 異常狀態的免疫 / 抗性（裝備 + 寶石 + 被動） */
export function resistFor(u: Unit, ailment: Ailment): { immune: boolean; resist: number } {
  let immune = false;
  let resist = 0;
  const p = passiveOfUnit(u);
  if (p?.immune?.includes(ailment)) immune = true;
  if (p?.ailmentResist?.[ailment]) resist += p.ailmentResist[ailment]!;
  for (const { item } of equipItems(u)) {
    if (item.effect.type !== 'equip') continue;
    if (item.effect.resist?.[ailment]) resist += item.effect.resist[ailment]!;
  }
  for (const slot of EQUIP_SLOTS) {
    for (const { effect } of gemsOf(u, slot)) {
      if (effect.resist?.[ailment]) resist += effect.resist[ailment]!;
    }
  }
  return { immune, resist: Math.max(0, Math.min(0.9, resist)) };
}

/** 受到指定屬性傷害的減免比例（0~0.9）：被動 + 裝備 + 寶石 */
export function elementResistFor(u: Unit, element: Element): number {
  const p = passiveOfUnit(u);
  let r = p?.elementResist?.[element] ?? 0;
  for (const { item } of equipItems(u)) {
    if (item.effect.type !== 'equip') continue;
    if (item.effect.elementResist?.[element]) r += item.effect.elementResist[element]!;
  }
  for (const slot of EQUIP_SLOTS) {
    for (const { effect } of gemsOf(u, slot)) {
      if (effect.elementResist?.[element]) r += effect.elementResist[element]!;
    }
  }
  return Math.max(0, Math.min(0.9, r));
}

/** 吸血比例 */
export function drainFor(u: Unit): number {
  return Math.max(0, passiveOfUnit(u)?.drain ?? 0);
}

/** 隊伍（存活成員）的獎勵加成 */
export function partyBonus(party: Unit[], key: 'goldBonus' | 'expBonus'): number {
  let v = 0;
  for (const u of party) if (u.hp > 0) v += passiveOfUnit(u)?.[key] ?? 0;
  return v;
}

/** 隊伍中是否有人讓逃跑必定成功 */
export function partyFleeAlways(party: Unit[]): boolean {
  return party.some((u) => u.hp > 0 && !!(passiveOfUnit(u)?.fleeAlways));
}

// ─────────────────────────────────────────────────────────────
// 道具
// ─────────────────────────────────────────────────────────────
export interface EquipEffect {
  type: 'equip';
  slot: EquipSlot;
  /** 固定加值 */
  bonus?: Partial<Stats>;
  /** 百分比加值（0.15 = +15%） */
  mult?: Partial<Stats>;
  /** 異常狀態抗性：降低被附加的機率（0.5 = 50% 抗性） */
  resist?: Partial<Record<Ailment, number>>;
  /** 屬性傷害減免（0.2 = -20%） */
  elementResist?: Partial<Record<Element, number>>;
}

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
    | EquipEffect
    | GemEffect
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
  },

  // ── 裝備：武器 ──
  weapon_iron: {
    id: 'weapon_iron',
    name: '鐵劍',
    desc: '以星塵鐵打造的短劍。裝備後攻擊 +8。',
    price: 300,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { atk: 8 } }
  },
  weapon_staff: {
    id: 'weapon_staff',
    name: '星輝法杖',
    desc: '杖頂嵌著碎星的木杖。裝備後魔力 +10、MP +8。',
    price: 420,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { mag: 10, mp: 8 } }
  },
  weapon_claw: {
    id: 'weapon_claw',
    name: '影爪',
    desc: '從蝕影獸身上取下的利爪。裝備後攻擊 +14、速度 +4。',
    price: 900,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { atk: 14, spd: 4 } }
  },
  weapon_abyss: {
    id: 'weapon_abyss',
    name: '深淵之刃',
    desc: '迴廊深處的漆黑之刃。裝備後攻擊 +24、魔力 +8。',
    price: 2400,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { atk: 24, mag: 8 } }
  },

  // ── 裝備：防具 ──
  armor_leather: {
    id: 'armor_leather',
    name: '皮甲',
    desc: '輕便的獸皮護甲。裝備後防禦 +7、HP +20。',
    price: 280,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 7, hp: 20 } }
  },
  armor_scale: {
    id: 'armor_scale',
    name: '鱗鎧',
    desc: '以幻獸鱗片縫製的鎧甲。裝備後防禦 +14、HP +40。',
    price: 700,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 14, hp: 40 } }
  },
  armor_robe: {
    id: 'armor_robe',
    name: '秘法長袍',
    desc: '織入星塵絲的長袍。裝備後防禦 +6、魔力 +8、MP +12。',
    price: 620,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 6, mag: 8, mp: 12 } }
  },
  armor_abyss: {
    id: 'armor_abyss',
    name: '深淵鎧甲',
    desc: '吸收光芒的黑色鎧甲。裝備後防禦 +24、HP +70。',
    price: 2400,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 24, hp: 70 } }
  },

  // ── 裝備：飾品 ──
  acc_swift: {
    id: 'acc_swift',
    name: '疾風之戒',
    desc: '帶著微風氣息的戒指。裝備後速度 +9。',
    price: 350,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { spd: 9 } }
  },
  acc_vital: {
    id: 'acc_vital',
    name: '生命護符',
    desc: '溫熱的護符，貼近胸口會感到安心。裝備後 HP +45。',
    price: 520,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { hp: 45 } }
  },
  acc_ward: {
    id: 'acc_ward',
    name: '淨化護符',
    desc: '刻著潔淨符文。裝備後中毒、流血、睡眠的抗性 +50%。',
    price: 640,
    use: 'none',
    effect: {
      type: 'equip',
      slot: 'accessory',
      resist: { poison: 0.5, bleed: 0.5, sleep: 0.5 }
    }
  },
  acc_orb: {
    id: 'acc_orb',
    name: '專注寶珠',
    desc: '內有星光的寶珠。裝備後魔力 +10、MP +16。',
    price: 700,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { mag: 10, mp: 16 } }
  },
  acc_crown: {
    id: 'acc_crown',
    name: '星辰頭冠',
    desc: '星之霸主遺留的冠冕。裝備後魔力 +12、速度 +6、HP +30。',
    price: 1800,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { mag: 12, spd: 6, hp: 30 } }
  },
  acc_abyss: {
    id: 'acc_abyss',
    name: '深淵之戒',
    desc: '迴廊的黑色結晶。裝備後攻擊 +10、防禦 +10，混亂抗性 +60%。',
    price: 2200,
    use: 'none',
    effect: {
      type: 'equip',
      slot: 'accessory',
      bonus: { atk: 10, def: 10 },
      resist: { confuse: 0.6 }
    }
  },

  // ── 強化素材 ──
  stardust_core: {
    id: 'stardust_core',
    name: '星塵核心',
    desc: '凝聚星塵而成的核心，能在工房強化裝備。',
    price: 180,
    use: 'none',
    effect: { type: 'none' }
  },
  star_core: {
    id: 'star_core',
    name: '星輝核心',
    desc: '高純度的星輝核心，強化高階裝備時必需。',
    price: 420,
    use: 'none',
    effect: { type: 'none' }
  },

  // ── 鑲嵌寶石：在工房嵌進裝備欄位（每欄位最多 3 顆） ──
  gem_power: {
    id: 'gem_power',
    name: '力量寶石',
    desc: '鑲嵌後攻擊 +10。',
    price: 300,
    use: 'none',
    effect: { type: 'gem', bonus: { atk: 10 } }
  },
  gem_mana: {
    id: 'gem_mana',
    name: '魔導寶石',
    desc: '鑲嵌後魔力 +10、MP +10。',
    price: 320,
    use: 'none',
    effect: { type: 'gem', bonus: { mag: 10, mp: 10 } }
  },
  gem_vital: {
    id: 'gem_vital',
    name: '生命寶石',
    desc: '鑲嵌後 HP +50。',
    price: 340,
    use: 'none',
    effect: { type: 'gem', bonus: { hp: 50 } }
  },
  gem_guard: {
    id: 'gem_guard',
    name: '守護寶石',
    desc: '鑲嵌後防禦 +10、HP +20。',
    price: 320,
    use: 'none',
    effect: { type: 'gem', bonus: { def: 10, hp: 20 } }
  },
  gem_swift: {
    id: 'gem_swift',
    name: '疾風寶石',
    desc: '鑲嵌後速度 +9。',
    price: 300,
    use: 'none',
    effect: { type: 'gem', bonus: { spd: 9 } }
  },
  gem_pure: {
    id: 'gem_pure',
    name: '淨化寶石',
    desc: '鑲嵌後中毒、流血、麻痺、睡眠抗性 +40%。',
    price: 460,
    use: 'none',
    effect: { type: 'gem', resist: { poison: 0.4, bleed: 0.4, paralysis: 0.4, sleep: 0.4 } }
  },
  gem_ward: {
    id: 'gem_ward',
    name: '守序寶石',
    desc: '鑲嵌後冰凍、混亂抗性 +50%。',
    price: 480,
    use: 'none',
    effect: { type: 'gem', resist: { freeze: 0.5, confuse: 0.5 } }
  },
  gem_element: {
    id: 'gem_element',
    name: '元素寶石',
    desc: '鑲嵌後火、水、風、地傷害 -15%。',
    price: 620,
    use: 'none',
    effect: { type: 'gem', elementResist: { fire: 0.15, water: 0.15, wind: 0.15, earth: 0.15 } }
  },

  // ── 星海道具（第五彈） ──
  herb_max: {
    id: 'herb_max',
    name: '星輝藥',
    desc: '以星輝淬鍊的頂級藥草，回復單體大量 HP。',
    price: 320,
    use: 'both',
    effect: { type: 'heal', power: 220 }
  },
  ether_hi: {
    id: 'ether_hi',
    name: '星露精華',
    desc: '濃縮的星露，回復單體大量 MP。',
    price: 260,
    use: 'both',
    effect: { type: 'mp', power: 90 }
  },
  antidote_hi: {
    id: 'antidote_hi',
    name: '萬靈解藥',
    desc: '解除單體身上的所有異常狀態。',
    price: 180,
    use: 'both',
    effect: { type: 'cure' }
  },
  phoenix_hi: {
    id: 'phoenix_hi',
    name: '不死鳥翎',
    desc: '使戰鬥不能的同伴以大量 HP 復活。',
    price: 900,
    use: 'both',
    effect: { type: 'revive', power: 0.75 }
  },
  elixir_hi: {
    id: 'elixir_hi',
    name: '星海秘藥',
    desc: '星海提煉的秘藥，回復我方全體大量 HP。',
    price: 700,
    use: 'both',
    effect: { type: 'healAll', power: 160 }
  },
  bomb_mega: {
    id: 'bomb_mega',
    name: '碎星彈',
    desc: '擊碎一小塊星塵，對敵人造成大量傷害。',
    price: 520,
    use: 'battle',
    effect: { type: 'damage', power: 220 }
  },
  weapon_star: {
    id: 'weapon_star',
    name: '星輝長劍',
    desc: '劍身流淌著星輝。裝備後攻擊 +32、魔力 +8。',
    price: 3200,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { atk: 32, mag: 8 } }
  },
  weapon_comet: {
    id: 'weapon_comet',
    name: '彗星雙刃',
    desc: '輕盈如彗尾的雙刃。裝備後攻擊 +26、速度 +10。',
    price: 3000,
    use: 'none',
    effect: { type: 'equip', slot: 'weapon', bonus: { atk: 26, spd: 10 } }
  },
  armor_star: {
    id: 'armor_star',
    name: '星海鎧',
    desc: '以星海礦砂鍛成的鎧甲。裝備後防禦 +24、HP +80。',
    price: 3400,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 24, hp: 80 } }
  },
  armor_nebula: {
    id: 'armor_nebula',
    name: '星霧法袍',
    desc: '以星霧編織的長袍。裝備後防禦 +14、魔力 +16、MP +24。',
    price: 3100,
    use: 'none',
    effect: { type: 'equip', slot: 'armor', bonus: { def: 14, mag: 16, mp: 24 } }
  },
  acc_star: {
    id: 'acc_star',
    name: '星海護符',
    desc: '封存著一滴星海。裝備後 HP +70、MP +24。',
    price: 2600,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { hp: 70, mp: 24 } }
  },
  acc_comet: {
    id: 'acc_comet',
    name: '彗星指環',
    desc: '環面永遠向著一個方向。裝備後速度 +12、攻擊 +8。',
    price: 2600,
    use: 'none',
    effect: { type: 'equip', slot: 'accessory', bonus: { spd: 12, atk: 8 } }
  },
  gem_nova: {
    id: 'gem_nova',
    name: '新星寶石',
    desc: '鑲嵌後攻擊 +14。',
    price: 780,
    use: 'none',
    effect: { type: 'gem', bonus: { atk: 14 } }
  },
  gem_astral: {
    id: 'gem_astral',
    name: '星靈寶石',
    desc: '鑲嵌後魔力 +14、MP +14。',
    price: 800,
    use: 'none',
    effect: { type: 'gem', bonus: { mag: 14, mp: 14 } }
  },
  gem_bulwark: {
    id: 'gem_bulwark',
    name: '星壁寶石',
    desc: '鑲嵌後防禦 +13、HP +30。',
    price: 820,
    use: 'none',
    effect: { type: 'gem', bonus: { def: 13, hp: 30 } }
  },
  gem_quick: {
    id: 'gem_quick',
    name: '流星寶石',
    desc: '鑲嵌後速度 +12。',
    price: 780,
    use: 'none',
    effect: { type: 'gem', bonus: { spd: 12 } }
  }
};

export function itemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}

// ─────────────────────────────────────────────────────────────
// 圖鑑收集獎勵
// ─────────────────────────────────────────────────────────────
export interface DexRewardDef {
  id: string;
  /** 圖鑑登錄數門檻 */
  count: number;
  desc: string;
  gold?: number;
  items?: { id: string; n: number }[];
  exp?: number;
}

export const DEX_REWARDS: DexRewardDef[] = [
  { id: 'dex5', count: 5, desc: '療癒草 ×3', gold: 200, items: [{ id: 'herb', n: 3 }] },
  { id: 'dex8', count: 8, desc: '封印石 ×5', gold: 300, items: [{ id: 'sealstone', n: 5 }] },
  { id: 'dex12', count: 12, desc: '星露藥 ×3、魔力水滴 ×2', items: [{ id: 'herb_hi', n: 3 }, { id: 'manadrop', n: 2 }] },
  { id: 'dex16', count: 16, desc: '鐵劍（武器）', gold: 500, items: [{ id: 'weapon_iron', n: 1 }] },
  { id: 'dex21', count: 21, desc: '鱗鎧（防具）', gold: 600, items: [{ id: 'armor_scale', n: 1 }] },
  { id: 'dex26', count: 26, desc: '生命護符（飾品）', gold: 800, items: [{ id: 'acc_vital', n: 1 }] },
  { id: 'dex31', count: 31, desc: '技能石・生命之泉', gold: 900, items: [{ id: 'stone_regen', n: 1 }] },
  { id: 'dex36', count: 36, desc: '專注寶珠（飾品）', gold: 1200, items: [{ id: 'acc_orb', n: 1 }] },
  { id: 'dex42', count: 42, desc: '影爪（武器）、復甦靈藥 ×2', gold: 1500, exp: 500, items: [{ id: 'weapon_claw', n: 1 }, { id: 'elixir', n: 2 }] },
  {
    id: 'dex47',
    count: 47,
    desc: '星塵核心 ×5、元素寶石 ×1',
    gold: 1000,
    items: [{ id: 'stardust_core', n: 5 }, { id: 'gem_element', n: 1 }]
  },
  {
    id: 'dex51',
    count: 51,
    desc: '星辰頭冠、技能石・星滅、金幣 3000',
    gold: 3000,
    exp: 2000,
    items: [{ id: 'acc_crown', n: 1 }, { id: 'stone_stardeath', n: 1 }]
  },
  {
    id: 'dex54',
    count: 54,
    desc: '深淵之刃、深淵鎧甲、星輝核心 ×3',
    gold: 4000,
    exp: 1500,
    items: [{ id: 'weapon_abyss', n: 1 }, { id: 'armor_abyss', n: 1 }, { id: 'star_core', n: 3 }]
  },
  {
    id: 'dex59',
    count: 59,
    desc: '深淵之戒、全部寶石各 1、金幣 8000',
    gold: 8000,
    exp: 4000,
    items: [
      { id: 'acc_abyss', n: 1 },
      { id: 'gem_power', n: 1 },
      { id: 'gem_mana', n: 1 },
      { id: 'gem_vital', n: 1 },
      { id: 'gem_guard', n: 1 },
      { id: 'gem_swift', n: 1 },
      { id: 'gem_pure', n: 1 },
      { id: 'gem_ward', n: 1 },
      { id: 'gem_element', n: 1 },
      { id: 'star_core', n: 5 }
    ]
  },
  {
    id: 'dex63',
    count: 63,
    desc: '星輝長劍（武器）、星塵核心 ×4',
    gold: 5000,
    exp: 2500,
    items: [{ id: 'weapon_star', n: 1 }, { id: 'stardust_core', n: 4 }]
  },
  {
    id: 'dex67',
    count: 67,
    desc: '星海鎧（防具）、星輝核心 ×3',
    gold: 6000,
    exp: 3000,
    items: [{ id: 'armor_star', n: 1 }, { id: 'star_core', n: 3 }]
  },
  {
    id: 'dex71',
    count: 71,
    desc: '彗星雙刃、彗星指環、星海秘藥 ×3',
    gold: 8000,
    exp: 4000,
    items: [{ id: 'weapon_comet', n: 1 }, { id: 'acc_comet', n: 1 }, { id: 'elixir_hi', n: 3 }]
  },
  {
    id: 'dex74',
    count: 74,
    desc: '星霧法袍、星海護符、四色星海寶石各 1',
    gold: 10000,
    exp: 5000,
    items: [
      { id: 'armor_nebula', n: 1 },
      { id: 'acc_star', n: 1 },
      { id: 'gem_nova', n: 1 },
      { id: 'gem_astral', n: 1 },
      { id: 'gem_bulwark', n: 1 },
      { id: 'gem_quick', n: 1 }
    ]
  },
  {
    id: 'dex77',
    count: 77,
    desc: '星海全套裝備、星輝核心 ×8、金幣 20000',
    gold: 20000,
    exp: 8000,
    items: [
      { id: 'weapon_star', n: 1 },
      { id: 'armor_star', n: 1 },
      { id: 'acc_star', n: 1 },
      { id: 'weapon_comet', n: 1 },
      { id: 'armor_nebula', n: 1 },
      { id: 'acc_comet', n: 1 },
      { id: 'star_core', n: 8 }
    ]
  }
];

/** 圖鑑總數（用於進度顯示） */
export function dexTotal(): number {
  return SPECIES_ORDER.length;
}
