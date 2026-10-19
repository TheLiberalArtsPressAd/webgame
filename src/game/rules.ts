/**
 * 可調規則（由管理後台即時覆寫）
 * 這些數值原本散落在 battle.ts / state.ts / menus.ts，
 * 集中在這裡後，後台就能調整所有戰鬥與經濟公式。
 */
export interface Rules {
  /** 等級上限 */
  maxLevel: number;
  /** 升級所需經驗：quad * Lv² + linear * Lv + constant */
  expQuad: number;
  expLinear: number;
  expConstant: number;
  /** 戰鬥經驗獎勵：quad * Lv² + linear * Lv + constant */
  expRewardQuad: number;
  expRewardLinear: number;
  expRewardConstant: number;
  /** 金幣獎勵：linear * Lv + random * Lv * rand + constant */
  goldLinear: number;
  goldRandom: number;
  goldConstant: number;

  /** 一般攻擊（不使用技能）的威力 */
  basicAttackPower: number;
  /** 傷害公式：攻擊 * (1 + 威力 / powerDivisor) */
  damagePowerDivisor: number;
  /** 傷害公式：defenseBase / (defenseBase + 防禦 * defenseScale) */
  damageDefenseBase: number;
  damageDefenseScale: number;
  /** 爆擊率 0~1 與爆擊倍率 */
  critChance: number;
  critMultiplier: number;
  /** 傷害浮動範圍，0.16 = 88% ~ 104% */
  damageVariance: number;
  /** 防禦指令的傷害倍率，0.5 = 減半 */
  guardMultiplier: number;
  /** 治療公式：魔力 * (1 + 威力 / healDivisor) */
  healDivisor: number;

  /** 捕獲率公式 */
  captureBase: number;
  captureHpScale: number;
  captureSpeciesScale: number;
  captureLevelPenaltyPerLevel: number;
  captureLevelPenaltyMin: number;
  captureMin: number;
  captureMax: number;

  /** 逃跑率公式 */
  fleeBase: number;
  fleePerSpeed: number;
  fleeMin: number;
  fleeMax: number;

  /** 中毒每回合損失最大 HP 比例 */
  poisonRatio: number;
  /** 流血每回合損失最大 HP 比例 */
  bleedRatio: number;
  /** 混亂時無法行動的機率 */
  confuseChance: number;
  /** 混亂時誤傷自己的機率（在無法行動之外） */
  confuseSelfChance: number;
  /** 商店收購價倍率 */
  sellRatio: number;
  /** 載入存檔時，依目前種族數值重新計算能力 */
  recalcOnLoad: boolean;
}

export const DEFAULT_RULES: Rules = {
  maxLevel: 60,
  expQuad: 16,
  expLinear: 26,
  expConstant: 20,
  expRewardQuad: 3,
  expRewardLinear: 8,
  expRewardConstant: 10,
  goldLinear: 11,
  goldRandom: 6,
  goldConstant: 5,

  basicAttackPower: 10,
  damagePowerDivisor: 40,
  damageDefenseBase: 100,
  damageDefenseScale: 0.9,
  critChance: 0.07,
  critMultiplier: 1.6,
  damageVariance: 0.16,
  guardMultiplier: 0.5,
  healDivisor: 30,

  captureBase: 0.15,
  captureHpScale: 0.85,
  captureSpeciesScale: 1.6,
  captureLevelPenaltyPerLevel: 0.035,
  captureLevelPenaltyMin: 0.35,
  captureMin: 0.03,
  captureMax: 0.95,

  fleeBase: 0.35,
  fleePerSpeed: 0.03,
  fleeMin: 0.15,
  fleeMax: 0.95,

  poisonRatio: 0.06,
  bleedRatio: 0.08,
  confuseChance: 0.35,
  confuseSelfChance: 0.5,
  sellRatio: 0.5,
  recalcOnLoad: true
};

/** 執行期可變規則物件（開場時由設定覆寫） */
export const RULES: Rules = { ...DEFAULT_RULES };
