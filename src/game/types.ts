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

/**
 * 進化條件：可為單一或「多分支」陣列。
 * 判定順序為陣列順序，玩家也可在選單中手動選擇符合條件的分支。
 */
export interface EvolutionDef {
  species: string;
  /** 需要達到的等級 */
  level: number;
  /** 需要消耗的道具（進化時扣 1 個） */
  item?: string;
  /** 需要具備的屬性 */
  element?: Element;
  /** 需要的最低潛能（合成培育出的資質） */
  minPotential?: number;
  /** 需要完成的劇情旗標 */
  flag?: string;
  /** 顯示用說明 */
  desc?: string;
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
  /** 進化：可為單一條件或多個分支 */
  evolvesTo?: EvolutionDef | EvolutionDef[];
  /** 被動特性 id（未指定時依 shape 推導） */
  passive?: string;
  /** 隱藏種族：無法直接捕獲，只能透過進化或合成取得 */
  hidden?: boolean;
}

/** 鑲嵌寶石（也是一種道具，effect.type === 'gem'） */
export interface GemEffect {
  type: 'gem';
  bonus?: Partial<Stats>;
  mult?: Partial<Stats>;
  /** 異常狀態抗性（0.4 = 降低 40% 觸發機率） */
  resist?: Partial<Record<Ailment, number>>;
  /** 屬性傷害減免（0.2 = -20%） */
  elementResist?: Partial<Record<Element, number>>;
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
  /** 各欄位裝備的強化等級（+0 ~ +10） */
  equipUp?: Partial<Record<EquipSlot, number>>;
  /** 各欄位鑲嵌的寶石道具 id（最多 3 顆） */
  gems?: Partial<Record<EquipSlot, string[]>>;
  /** 潛能（0~50）：合成培育出的資質，提供額外的全能力加成 */
  potential?: number;
  /** 合成世代（第幾代繁殖出來的） */
  generation?: number;
}
