import { AILMENT_NAME, SKILLS, SPECIES, elementMultiplier } from './data';
import { RULES } from './rules';
import type { Ailment, Element, SkillDef, Stats, Unit } from './types';

// ─────────────────────────────────────────────────────────────
// 數值
// ─────────────────────────────────────────────────────────────
export function effStat(u: Unit, stat: keyof Stats): number {
  let mult = 1;
  for (const b of u.buffs) if (b.stat === stat) mult += b.amount;
  return Math.max(1, u.max[stat] * mult);
}

export interface DamageResult {
  dmg: number;
  mult: number;
  crit: boolean;
  element: Element;
}

/** 一般攻擊（skill = null）或技能攻擊的傷害計算 */
export function calcDamage(attacker: Unit, defender: Unit, skill: SkillDef | null): DamageResult {
  const power = skill ? skill.power : RULES.basicAttackPower;
  const useAtk = !skill || !!skill.physical;
  const a = useAtk ? effStat(attacker, 'atk') : effStat(attacker, 'mag');
  const d = effStat(defender, 'def');
  const element: Element = skill ? skill.element : attacker.element;
  const mult = elementMultiplier(element, defender.element);
  const crit = Math.random() < RULES.critChance;
  let dmg =
    a *
    (1 + power / Math.max(1, RULES.damagePowerDivisor)) *
    mult *
    (RULES.damageDefenseBase /
      (RULES.damageDefenseBase + d * RULES.damageDefenseScale));
  if (crit) dmg *= RULES.critMultiplier;
  // 防禦中減傷
  if (defender.guarding) dmg *= RULES.guardMultiplier;
  const variance = Math.max(0, RULES.damageVariance);
  dmg *= 1 - variance / 2 + Math.random() * variance;
  return { dmg: Math.max(1, Math.round(dmg)), mult, crit, element };
}

export function calcHeal(caster: Unit, skill: SkillDef, target: Unit): number {
  const mag = effStat(caster, 'mag');
  const amount = Math.round(mag * (1 + skill.power / Math.max(1, RULES.healDivisor)));
  return Math.max(1, Math.min(amount, target.max.hp - target.hp));
}

/** 捕獲成功率 */
export function captureChance(target: Unit): number {
  const sp = SPECIES[target.speciesId];
  if (!sp || sp.catchRate <= 0) return 0;
  const hpRatio = target.hp / target.max.hp;
  const base = RULES.captureBase + (1 - hpRatio) * RULES.captureHpScale;
  const levelPenalty = Math.max(
    RULES.captureLevelPenaltyMin,
    1 - Math.max(0, target.level - 5) * RULES.captureLevelPenaltyPerLevel
  );
  return Math.max(
    RULES.captureMin,
    Math.min(RULES.captureMax, base * sp.catchRate * RULES.captureSpeciesScale * levelPenalty)
  );
}

/** 逃跑成功率 */
export function fleeChance(party: Unit[], enemies: Unit[]): number {
  const ps = Math.max(...party.filter((u) => u.hp > 0).map((u) => effStat(u, 'spd')), 1);
  const es = Math.max(...enemies.filter((u) => u.hp > 0).map((u) => effStat(u, 'spd')), 1);
  return Math.max(
    RULES.fleeMin,
    Math.min(RULES.fleeMax, RULES.fleeBase + (ps - es) * RULES.fleePerSpeed)
  );
}

// ─────────────────────────────────────────────────────────────
// 回合排序
// ─────────────────────────────────────────────────────────────
export function turnOrder(units: Unit[]): Unit[] {
  return units
    .filter((u) => u.hp > 0)
    .map((u) => ({ u, k: effStat(u, 'spd') * (0.9 + Math.random() * 0.2) }))
    .sort((a, b) => b.k - a.k)
    .map((o) => o.u);
}

// ─────────────────────────────────────────────────────────────
// Buff 管理
// ─────────────────────────────────────────────────────────────
export function applyBuff(
  target: Unit,
  stat: keyof Stats,
  amount: number,
  turns: number,
  name: string
) {
  const existing = target.buffs.find((b) => b.stat === stat && Math.sign(b.amount) === Math.sign(amount));
  if (existing) {
    existing.turns = turns;
    existing.amount = amount;
    return;
  }
  target.buffs.push({ stat, amount, turns, name });
}

/** 每回合結束時遞減 buff，回傳已失效的 buff 名稱 */
export function tickBuffs(units: Unit[]): { unit: Unit; name: string }[] {
  const expired: { unit: Unit; name: string }[] = [];
  for (const u of units) {
    if (u.hp <= 0) {
      u.buffs = [];
      continue;
    }
    const keep: typeof u.buffs = [];
    for (const b of u.buffs) {
      b.turns--;
      if (b.turns <= 0) expired.push({ unit: u, name: b.name });
      else keep.push(b);
    }
    u.buffs = keep;
  }
  return expired;
}

// ─────────────────────────────────────────────────────────────
// 敵人 AI
// ─────────────────────────────────────────────────────────────
export interface AiAction {
  skill: SkillDef | null;
  target: Unit;
  /** 對自己使用（輔助技） */
  selfCast: boolean;
}

function alive(list: Unit[]): Unit[] {
  return list.filter((u) => u.hp > 0);
}

export function chooseAiAction(enemy: Unit, party: Unit[], allies: Unit[]): AiAction {
  const targets = alive(party);
  const pick = () => targets[Math.floor(Math.random() * targets.length)];

  const usable = enemy.skills
    .map((id) => SKILLS[id])
    .filter((s): s is SkillDef => !!s && enemy.mp >= s.mp);

  // 治療：血量過低且會治療
  const healSkill = usable.find((s) => s.kind === 'heal' || s.kind === 'revive');
  if (healSkill && enemy.hp / enemy.max.hp < 0.35) {
    return { skill: healSkill, target: enemy, selfCast: true };
  }

  // 復活隊友
  const reviveSkill = usable.find((s) => s.kind === 'revive');
  const deadAlly = allies.find((a) => a.hp <= 0);
  if (reviveSkill && deadAlly) {
    return { skill: reviveSkill, target: deadAlly, selfCast: false };
  }

  const attacks = usable.filter((s) => s.kind === 'attack');
  // 群體技：敵人數 >= 3 時提高使用意願
  const aoe = attacks.find((s) => s.target === 'allEnemy');
  if (aoe && targets.length >= 3 && Math.random() < 0.5) {
    return { skill: aoe, target: targets[0], selfCast: false };
  }
  const single = attacks
    .filter((s) => s.target === 'enemy')
    .sort((a, b) => b.power - a.power)[0];
  if (single && Math.random() < 0.45) {
    return { skill: single, target: pick(), selfCast: false };
  }

  // 弱化 / 狀態類
  const debuff = usable.find((s) => s.kind === 'debuff' || s.kind === 'status');
  if (debuff && Math.random() < 0.25) {
    return { skill: debuff, target: pick(), selfCast: false };
  }

  return { skill: null, target: pick(), selfCast: false };
}

// ─────────────────────────────────────────────────────────────
// 獎勵
// ─────────────────────────────────────────────────────────────
export function expReward(enemy: Unit): number {
  return Math.max(
    0,
    Math.floor(
      RULES.expRewardQuad * enemy.level * enemy.level +
        RULES.expRewardLinear * enemy.level +
        RULES.expRewardConstant
    )
  );
}

export function goldReward(enemy: Unit): number {
  return Math.max(
    0,
    Math.floor(
      enemy.level * RULES.goldLinear +
        Math.random() * enemy.level * RULES.goldRandom +
        RULES.goldConstant
    )
  );
}

export function allDead(list: Unit[]): boolean {
  return list.every((u) => u.hp <= 0);
}

// ─────────────────────────────────────────────────────────────
// 異常狀態
// ─────────────────────────────────────────────────────────────
/** 嘗試對目標附加異常狀態，回傳是否成功 */
export function tryAilment(target: Unit, ailment: Ailment, chance: number, turns: number): boolean {
  if (target.hp <= 0) return false;
  // 已中同一狀態時不覆蓋，只刷新回合
  if (target.ailment === ailment) {
    target.ailmentTurns = Math.max(target.ailmentTurns ?? 0, turns);
    return false;
  }
  if (Math.random() > chance) return false;
  target.ailment = ailment;
  target.ailmentTurns = turns;
  target.buffs = [];
  return true;
}

export function clearAilment(u: Unit) {
  u.ailment = undefined;
  u.ailmentTurns = 0;
}

export function ailmentLabel(a: Ailment): string {
  return AILMENT_NAME[a] ?? a;
}

/** 回合結束：毒傷害與狀態回合遞減。回傳中毒傷害紀錄 */
export function tickAilments(units: Unit[]): { unit: Unit; dmg: number }[] {
  const poison: { unit: Unit; dmg: number }[] = [];
  for (const u of units) {
    if (u.hp <= 0) {
      clearAilment(u);
      continue;
    }
    if (u.ailment) {
      if (u.ailment === 'poison') {
        const dmg = Math.max(1, Math.floor(u.max.hp * RULES.poisonRatio));
        u.hp = Math.max(0, u.hp - dmg);
        poison.push({ unit: u, dmg });
      }
      u.ailmentTurns = (u.ailmentTurns ?? 1) - 1;
      if (u.ailmentTurns <= 0) clearAilment(u);
    }
  }
  return poison;
}

/** 檢查單位是否能行動：sleep 必定無法、paralysis 機率無法 */
export function actionBlocked(u: Unit): 'sleep' | 'paralysis' | null {
  if (u.ailment === 'sleep') return 'sleep';
  if (u.ailment === 'paralysis' && Math.random() < 0.5) return 'paralysis';
  return null;
}
