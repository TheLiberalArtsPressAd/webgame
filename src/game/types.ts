export type Element = 'none' | 'fire' | 'water' | 'wind' | 'earth';

/** 異常狀態 */
export type Ailment = 'poison' | 'paralysis' | 'sleep';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export type Shape = 'beast' | 'bird' | 'blob' | 'bug' | 'fish' | 'human' | 'dragon';

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
}
