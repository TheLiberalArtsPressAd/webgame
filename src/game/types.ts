export type Element = 'none' | 'fire' | 'water' | 'wind' | 'earth';

/**
 * 異常狀態
 * - poison  中毒：每回合結束損失最大 HP
 * - bleed   流血：每回合結束損失最大 HP（比中毒更痛，但不會擴散到隊友）
 * - paralysis 麻痺：機率無法行動
 * - sleep   睡眠：必定無法行動，受到攻擊後會醒來
 * - freeze  冰凍：必定無法行動，受到攻擊後會碎裂解除
 * - confuse 混亂：機率無法行動，並可能誤傷自己
 */
export type Ailment = 'poison' | 'bleed' | 'paralysis' | 'sleep' | 'freeze' | 'confuse';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export type Shape = 'beast' | 'bird' | 'blob' | 'bug' | 'fish' | 'human' | 'dragon';

/** 裝備欄位 */
export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export const EQUIP_SLOTS: EquipSlot[] = ['weapon', 'armor', 'accessory'];

/**
 * 種族被動特性
 * 由種族 `passive` 指定；未指定時依 `shape` 推導。
 */
export interface PassiveDef {
  id: string;
  name: string;
  desc: string;
  /** 能力值百分比加成（0.15 = +15%） */
  statMult?: Partial<Stats>;
  /** 受到指定屬性傷害的減免（0.25 = -25%）；key 'none' 代表無屬性 */
  elementResist?: Partial<Record<Element, number>>;
  /** 對這些異常狀態完全免疫 */
  immune?: Ailment[];
  /** 異常狀態抗性：降低被附加的機率（0.5 = 一半機率） */
  ailmentResist?: Partial<Record<Ailment, number>>;
  /** 造成傷害時吸取的比例（0.15 = 15%） */
  drain?: number;
  /** 我方任一成員擁有時，逃跑必定成功 */
  fleeAlways?: boolean;
  /** 戰鬥勝利金幣加成（0.2 = +20%） */
  goldBonus?: number;
  /** 戰鬥勝利經驗加成 */
  expBonus?: number;
}

export interface SpriteDef {
  shape: Shape;
  c1: string;
  c2: string;
  size: number;
  horns?: boolean;
  wings?: boolean;
}

export type SkillKind = 'attack' | 'heal' | 'buff' | 'debuff' | 'revive' | 'status';
export type SkillTarget = 'enemy' | 'allEnemy' | 'ally' | 'allAlly' | 'self';

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  element: Element;
  mp: number;
  power: number;
  kind: SkillKind;
  target: SkillTarget;
  /** true = 以攻擊力計算（物理），否則以魔力計算 */
  physical?: boolean;
  stat?: keyof Stats;
  turns?: number;
  hits?: number;
  /** 造成的異常狀態 */
  ailment?: Ailment;
  /** 異常狀態發動機率 0~1（預設 1） */
  ailmentChance?: number;
  /** 異常狀態持續回合 */
  ailmentTurns?: number;
  /** 治療技：解除目標異常狀態 */
  cure?: boolean;
}

export interface SpeciesDef {
  id: string;
  name: string;
  element: Element;
  shape: Shape;
  base: Stats;
  growth: Stats;
  /** 捕獲基礎成功率 0~1（0 = 無法捕捉） */
  catchRate: number;
  size: number;
  c1: string;
  c2: string;
  horns?: boolean;
  wings?: boolean;
  desc: string;
  /** 升級時習得的技能 */
  skills: { level: number; id: string }[];
  /** 進化：達到等級後變成另一個種族 */
  evolvesTo?: { species: string; level: number };
  /** 被動特性 id（未指定時依 shape 推導） */
  passive?: string;
}

export interface Buff {
  stat: keyof Stats;
  /** 百分比，例如 0.3 = +30% */
  amount: number;
  turns: number;
  name: string;
}

export interface Unit {
  uid: number;
  /** hero = 劇情角色（不可丟棄）、pet = 幻獸、enemy = 敵人 */
  kind: 'hero' | 'pet' | 'enemy';
  speciesId: string;
  name: string;
  level: number;
  exp: number;
  hp: number;
  mp: number;
  /** 已計算的最終數值上限 */
  max: Stats;
  skills: string[];
  element: Element;
  sprite: SpriteDef;
  buffs: Buff[];
  /** 戰鬥中是否防禦 */
  guarding?: boolean;
  /** 異常狀態 */
  ailment?: Ailment;
  ailmentTurns?: number;
  /** 已裝備的道具（各欄位一個道具 id） */
  equip?: Partial<Record<EquipSlot, string>>;
}
