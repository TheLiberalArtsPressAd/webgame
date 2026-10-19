import { VIEW_H, VIEW_W, scenes, type Scene } from '../engine/scene';
import * as input from '../engine/input';
import { bar, drawBeast, drawHero, label, panel, shade, wrapText } from '../engine/draw';
import { createUnit, AILMENT_COLOR, AILMENT_ICON, AILMENT_NAME, ELEMENT_COLOR, ELEMENT_NAME, FIELD_EFFECTS, ITEMS, SKILLS, SPECIES, drainFor, itemName, passiveOfUnit, partyBonus, partyFleeAlways } from '../game/data';
import { session } from '../game/session';
import { addGold, addItem, addPet, giveExp, grantAchievements, itemCount, removeItem, type LevelUpInfo } from '../game/state';
import { questOnCapture, questOnWin } from '../game/quests';
import { audio, type BgmName } from '../engine/audio';
import {
  actionBlocked,
  allDead,
  calcDamage,
  calcHeal,
  captureChance,
  chooseAiAction,
  clearAilment,
  confusionSelfHit,
  effStat,
  expReward,
  fleeChance,
  goldReward,
  onDamaged,
  tickAilments,
  tickBuffs,
  tryAilment,
  turnOrder
} from '../game/battle';
import type { SkillDef, Unit } from '../game/types';
import type { BattleBg } from '../game/story';

/** 頭目戰階段：依頭目血量百分比觸發 */
export interface BattlePhase {
  /** 當頭目 HP 低於此比例（0~1）時觸發 */
  hpBelow: number;
  /** 顯示的訊息 */
  message: string;
  /** 呼叫增援 */
  summon?: { species: string; level: number }[];
  /** 狂暴：對所有敵人附加增益 */
  enrage?: { stat: 'hp' | 'mp' | 'atk' | 'def' | 'mag' | 'spd'; amount: number; turns: number }[];
  /** 回復頭目 HP（最大 HP 的比例） */
  healRatio?: number;
}

export interface BattleOptions {
  enemies: Unit[];
  bg: BattleBg;
  boss: boolean;
  canFlee: boolean;
  intro?: string;
  /** 覆寫背景音樂（未指定時：頭目 → boss，其餘 → battle） */
  music?: BgmName;
  /** 頭目階段機制（選用） */
  phases?: BattlePhase[];
  onEnd: (r: 'win' | 'lose' | 'flee') => void;
}

type CmdKind = 'attack' | 'skill' | 'item' | 'capture' | 'guard' | 'flee';

interface Command {
  kind: CmdKind;
  skillId?: string;
  itemId?: string;
  targetUid?: number;
}

interface QueuedAction {
  actor: Unit;
  cmd: Command;
}

interface Fx {
  shake: number;
  flash: number;
  ox: number;
  oy: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
  size: number;
}

const PARTY_X = [370, 470, 570, 670];
const ENEMY_X = [300, 480, 660];
const PARTY_Y = 400;
const ENEMY_Y = 252;

export class BattleScene implements Scene {
  opt: BattleOptions;
  enemies: Unit[];
  party: Unit[];

  phase: 'intro' | 'command' | 'target' | 'resolve' | 'result' = 'intro';
  time = 0;
  introTimer = 1.5;
  waitTimer = 0;
  resultTimer = 0;
  pendingResult: 'win' | 'lose' | 'flee' = 'win';

  message = '';
  queue: QueuedAction[] = [];
  /** 回合結束訊息顯示完畢後，才進入指令階段 */
  pendingCommand = false;

  commands: Command[] = [];
  cmdIdx = 0;
  menu: 'main' | 'skill' | 'item' = 'main';
  menuIdx = 0;

  pendingKind: CmdKind = 'attack';
  pendingSkill?: SkillDef;
  pendingItem?: string;
  targets: Unit[] = [];
  targetIdx = 0;

  fx = new Map<number, Fx>();
  floaters: Floater[] = [];
  defeatedEnemies: Unit[] = [];
  resultLines: string[] = [];
  showHelp = false;
  /** 頭目階段是否已觸發 */
  phaseDone: boolean[] = [];
  /** 排隊等待顯示的階段訊息 */
  phaseQueue: string[] = [];

  constructor(opt: BattleOptions) {
    this.opt = opt;
    this.enemies = opt.enemies;
    this.party = session.state.party;
    this.message = opt.intro ?? '戰鬥開始！';
    this.phaseDone = new Array(opt.phases?.length ?? 0).fill(false);
    for (const u of [...this.party, ...this.enemies]) {
      this.fx.set(u.uid, { shake: 0, flash: 0, ox: 0, oy: 0 });
      u.buffs = [];
      u.guarding = false;
      u.ailment = undefined;
      u.ailmentTurns = 0;
    }
  }

  enter() {
    this.message = this.opt.intro ?? '戰鬥開始！';
    audio.setBgm(this.opt.music ?? (this.opt.boss ? 'boss' : 'battle'));
  }

  // ─────────────────────────────────────────────────────────
  private getFx(u: Unit): Fx {
    let f = this.fx.get(u.uid);
    if (!f) {
      f = { shake: 0, flash: 0, ox: 0, oy: 0 };
      this.fx.set(u.uid, f);
    }
    return f;
  }

  private posOf(u: Unit): { x: number; y: number } {
    const ei = this.enemies.indexOf(u);
    if (ei >= 0) {
      const n = this.enemies.length;
      const spread = n === 1 ? 0 : ENEMY_X.length >= n ? ENEMY_X[ei] - 480 : (ei - (n - 1) / 2) * 170;
      return { x: 480 + spread, y: ENEMY_Y };
    }
    const pi = this.party.indexOf(u);
    const n = this.party.length;
    const base = PARTY_X.slice(0, 4);
    const x = n === 1 ? base[1] : base[pi] ?? 480;
    return { x, y: PARTY_Y };
  }

  private aliveEnemies(): Unit[] {
    return this.enemies.filter((e) => e.hp > 0);
  }

  private aliveParty(): Unit[] {
    return this.party.filter((u) => u.hp > 0);
  }

  private float(x: number, y: number, text: string, color: string, size = 22) {
    this.floaters.push({ x, y, text, color, t: 0, size });
  }

  private hit(target: Unit, amount = 1) {
    const f = this.getFx(target);
    f.shake = 1;
    f.flash = amount;
  }

  // ─────────────────────────────────────────────────────────
  update(dt: number) {
    this.time += dt;

    for (const f of this.fx.values()) {
      f.shake = Math.max(0, f.shake - dt * 3.5);
      f.flash = Math.max(0, f.flash - dt * 2.6);
      f.ox *= Math.pow(0.0015, dt);
      f.oy *= Math.pow(0.0015, dt);
    }
    for (const fl of this.floaters) {
      fl.t += dt;
      fl.y -= dt * 42;
    }
    this.floaters = this.floaters.filter((f) => f.t < 1.1);

    switch (this.phase) {
      case 'intro':
        this.introTimer -= dt;
        if (this.introTimer <= 0 || input.consume('space', 'enter')) this.beginCommandPhase();
        break;
      case 'command':
        this.updateCommand(dt);
        break;
      case 'target':
        this.updateTarget(dt);
        break;
      case 'resolve':
        this.updateResolve(dt);
        break;
      case 'result':
        this.resultTimer -= dt;
        if (this.resultTimer <= 0) this.finish();
        break;
    }
  }

  // ── 指令輸入 ─────────────────────────────────────────────
  private beginCommandPhase() {
    this.phase = 'command';
    this.commands = [];
    this.cmdIdx = 0;
    this.menu = 'main';
    this.menuIdx = 0;
    for (const u of this.party) u.guarding = false;
    this.skipToNextActor();
    if (this.phase === 'command') {
      const u = this.party[this.cmdIdx];
      this.message = `請選擇 ${u?.name ?? ''} 的行動。`;
    }
  }

  private skipToNextActor() {
    while (this.cmdIdx < this.party.length && this.party[this.cmdIdx].hp <= 0) this.cmdIdx++;
    if (this.cmdIdx >= this.party.length) this.startResolve();
  }

  private mainMenu(unit: Unit): { id: CmdKind; text: string; enabled: boolean }[] {
    const canCapture = itemCount(session.state, 'sealstone') > 0 && this.aliveEnemies().length > 0;
    const list: { id: CmdKind; text: string; enabled: boolean }[] = [
      { id: 'attack', text: '攻擊', enabled: true },
      { id: 'skill', text: '技能', enabled: unit.skills.length > 0 },
      { id: 'item', text: '道具', enabled: Object.keys(session.state.inventory).some((k) => itemCount(session.state, k) > 0) },
      { id: 'capture', text: `封印 (石 x${itemCount(session.state, 'sealstone')})`, enabled: canCapture },
      { id: 'guard', text: '防禦', enabled: true }
    ];
    if (this.opt.canFlee) list.push({ id: 'flee', text: '逃走', enabled: true });
    return list;
  }

  private updateCommand(dt: number) {
    const unit = this.party[this.cmdIdx];
    if (!unit) {
      this.startResolve();
      return;
    }

    if (this.showHelp) {
      if (input.consume('escape', 'space', 'enter')) this.showHelp = false;
      return;
    }

    if (input.consume('escape')) {
      if (this.menu !== 'main') {
        this.menu = 'main';
        this.menuIdx = 0;
        return;
      }
      this.showHelp = true;
      return;
    }

    if (this.menu === 'main') {
      const list = this.mainMenu(unit);
      if (input.nav('arrowup', dt) || input.nav('w', dt)) this.menuIdx = (this.menuIdx - 1 + list.length) % list.length;
      if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.menuIdx = (this.menuIdx + 1) % list.length;
      if (input.consume('space', 'enter')) {
        const item = list[this.menuIdx];
        if (!item) {
          this.menuIdx = 0;
          return;
        }
        if (!item.enabled) return;
        this.chooseMain(item.id, unit);
      }
      return;
    }

    if (this.menu === 'skill') {
      const ids = unit.skills;
      if (input.nav('arrowup', dt) || input.nav('w', dt)) this.menuIdx = (this.menuIdx - 1 + ids.length) % ids.length;
      if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.menuIdx = (this.menuIdx + 1) % ids.length;
      if (input.consume('space', 'enter')) {
        const sk = SKILLS[ids[this.menuIdx]];
        if (!sk || unit.mp < sk.mp) return;
        this.pendingSkill = sk;
        this.pendingKind = 'skill';
        this.beginTarget(unit, sk);
      }
      return;
    }

    if (this.menu === 'item') {
      const ids = this.itemList();
      if (ids.length === 0) {
        this.menu = 'main';
        return;
      }
      if (input.nav('arrowup', dt) || input.nav('w', dt)) this.menuIdx = (this.menuIdx - 1 + ids.length) % ids.length;
      if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.menuIdx = (this.menuIdx + 1) % ids.length;
      if (input.consume('space', 'enter')) {
        const id = ids[this.menuIdx];
        const def = ITEMS[id];
        if (!def) return;
        this.pendingItem = id;
        this.pendingKind = 'item';
        if (def.effect.type === 'escape') {
          this.pendingKind = 'flee';
          this.commitCommand(unit, { kind: 'flee' });
          return;
        }
        // 選擇目標
        const ally =
          def.effect.type === 'heal' ||
          def.effect.type === 'mp' ||
          def.effect.type === 'revive' ||
          def.effect.type === 'healAll' ||
          def.effect.type === 'cure';
        this.targets = ally ? this.party.slice() : this.aliveEnemies();
        this.targetIdx = ally ? this.party.indexOf(unit) : 0;
        this.phase = 'target';
      }
      return;
    }
  }

  private itemList(): string[] {
    const s = session.state;
    return Object.keys(s.inventory).filter((id) => {
      const def = ITEMS[id];
      return (
        s.inventory[id] > 0 &&
        !!def &&
        (def.use === 'battle' || def.use === 'both') &&
        id !== 'sealstone'
      );
    });
  }

  private chooseMain(kind: CmdKind, unit: Unit) {
    switch (kind) {
      case 'attack':
        this.pendingKind = 'attack';
        this.beginTarget(unit, null);
        break;
      case 'skill':
        this.menu = 'skill';
        this.menuIdx = 0;
        break;
      case 'item':
        this.menu = 'item';
        this.menuIdx = 0;
        break;
      case 'capture':
        this.pendingKind = 'capture';
        this.beginTarget(unit, null);
        break;
      case 'guard':
        this.commitCommand(unit, { kind: 'guard' });
        break;
      case 'flee':
        this.commitCommand(unit, { kind: 'flee' });
        break;
    }
  }

  private beginTarget(unit: Unit, skill: SkillDef | null) {
    if (skill && (skill.target === 'self')) {
      this.commitCommand(unit, { kind: 'skill', skillId: skill.id, targetUid: unit.uid });
      return;
    }
    if (skill && (skill.target === 'allEnemy' || skill.target === 'allAlly')) {
      this.commitCommand(unit, { kind: 'skill', skillId: skill.id });
      return;
    }
    if (!skill && this.pendingKind === 'attack') {
      this.targets = this.aliveEnemies();
    } else if (skill && (skill.target === 'ally')) {
      this.targets = this.party.slice();
    } else if (skill && skill.target === 'enemy') {
      this.targets = this.aliveEnemies();
    } else if (this.pendingKind === 'capture') {
      this.targets = this.aliveEnemies();
    }
    this.targetIdx = 0;
    this.phase = 'target';
  }

  private updateTarget(dt: number) {
    if (this.targets.length === 0) {
      this.phase = 'command';
      this.menu = 'main';
      return;
    }
    const cols = 3;
    if (input.nav('arrowleft', dt) || input.nav('a', dt)) this.targetIdx = (this.targetIdx - 1 + this.targets.length) % this.targets.length;
    if (input.nav('arrowright', dt) || input.nav('d', dt)) this.targetIdx = (this.targetIdx + 1) % this.targets.length;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.targetIdx = Math.max(0, this.targetIdx - cols);
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.targetIdx = Math.min(this.targets.length - 1, this.targetIdx + cols);
    if (input.consume('escape')) {
      this.phase = 'command';
      this.menu = this.pendingKind === 'skill' ? 'skill' : this.pendingKind === 'item' ? 'item' : 'main';
      return;
    }
    if (input.consume('space', 'enter')) {
      const unit = this.party[this.cmdIdx];
      const target = this.targets[this.targetIdx];
      const cmd: Command = { kind: this.pendingKind, targetUid: target.uid };
      if (this.pendingKind === 'skill' && this.pendingSkill) cmd.skillId = this.pendingSkill.id;
      if (this.pendingKind === 'item' && this.pendingItem) cmd.itemId = this.pendingItem;
      this.pendingSkill = undefined;
      this.pendingItem = undefined;
      this.commitCommand(unit, cmd);
    }
  }

  private commitCommand(unit: Unit, cmd: Command) {
    this.commands[this.cmdIdx] = cmd;
    this.cmdIdx++;
    this.menu = 'main';
    this.menuIdx = 0;
    this.skipToNextActor();
    if (this.phase === 'command') {
      const u = this.party[this.cmdIdx];
      this.message = `請選擇 ${u?.name ?? ''} 的行動。`;
    }
  }

  // ── 戰鬥結算 ─────────────────────────────────────────────
  private startResolve() {
    this.phase = 'resolve';
    const order = turnOrder([...this.party, ...this.enemies]);
    this.queue = [];
    for (const u of order) {
      if (u.kind === 'enemy') {
        this.queue.push({ actor: u, cmd: { kind: 'attack' } });
      } else {
        const idx = this.party.indexOf(u);
        this.queue.push({ actor: u, cmd: this.commands[idx] ?? { kind: 'attack' } });
      }
    }
    this.waitTimer = 0.35;
    this.message = '—— 回合開始 ——';
  }

  private findTarget(uid: number | undefined, fallbackEnemy: boolean): Unit | null {
    const pool = fallbackEnemy ? this.aliveEnemies() : this.aliveParty();
    if (uid !== undefined) {
      const found = [...this.party, ...this.enemies].find((u) => u.uid === uid);
      if (found && found.hp > 0) return found;
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private updateResolve(dt: number) {
    if (this.waitTimer > 0) {
      this.waitTimer -= dt;
      return;
    }
    // 頭目階段訊息優先顯示
    if (this.phaseQueue.length > 0) {
      this.message = this.phaseQueue.shift()!;
      this.waitTimer = 1.5;
      return;
    }
    if (this.pendingCommand) {
      this.pendingCommand = false;
      this.beginCommandPhase();
      return;
    }

    if (allDead(this.enemies)) {
      this.victory();
      return;
    }
    if (allDead(this.party)) {
      this.defeat();
      return;
    }

    if (this.queue.length === 0) {
      this.endRound();
      return;
    }

    const next = this.queue.shift()!;
    if (next.actor.hp <= 0) return;
    this.execute(next);
  }

  private endRound() {
    // 回合結束：異常狀態（毒 / 流血）與增益/減益到期
    const dots = tickAilments([...this.party, ...this.enemies]);
    const expired = tickBuffs([...this.party, ...this.enemies]);
    const parts: string[] = [];
    for (const p of dots) {
      this.hit(p.unit, 0.6);
      const pos = this.posOf(p.unit);
      const color = p.ailment === 'bleed' ? '#e06060' : '#b07ae0';
      this.float(pos.x, pos.y - 60, `${p.dmg}`, color, 20);
      parts.push(
        `${p.unit.name} 受到${AILMENT_NAME[p.ailment]}的侵蝕（${p.dmg}）。`
      );
    }
    for (const e of expired) parts.push(`${e.unit.name} 的「${e.name}」效果結束了。`);
    if (parts.length) {
      this.message = parts.join('  ');
      this.waitTimer = 0.85;
    }
    if (allDead(this.enemies)) {
      this.victory();
      return;
    }
    if (allDead(this.party)) {
      this.defeat();
      return;
    }
    const order = turnOrder([...this.party, ...this.enemies]);
    this.queue = [];
    for (const u of order) {
      if (u.kind === 'enemy') this.queue.push({ actor: u, cmd: { kind: 'attack' } });
      else this.queue.push({ actor: u, cmd: this.commands[this.party.indexOf(u)] ?? { kind: 'attack' } });
    }
    if (this.queue.length === 0) {
      this.defeat();
      return;
    }
    if (parts.length) {
      // 先讓回合結束訊息顯示完，再進入指令階段
      this.pendingCommand = true;
      return;
    }
    this.beginCommandPhase();
  }

  private lunge(actor: Unit, target: Unit) {
    const a = this.posOf(actor);
    const t = this.posOf(target);
    const dx = t.x - a.x;
    const dy = t.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const f = this.getFx(actor);
    f.ox = (dx / len) * 26;
    f.oy = (dy / len) * 18;
  }

  private damage(target: Unit, dmg: number, crit: boolean, mult: number, elementLabel: string) {
    target.hp = Math.max(0, target.hp - dmg);
    audio.play(crit ? 'crit' : 'hit');
    const pos = this.posOf(target);
    const f = this.getFx(target);
    const canSeeShake = target.hp > 0;
    this.hit(target, 1);
    if (!canSeeShake) this.getFx(target).shake = 1;
    this.float(pos.x, pos.y - 60, `${dmg}`, crit ? '#ffd24a' : '#ff8a8a', crit ? 28 : 22);
    if (crit) this.float(pos.x, pos.y - 86, '會心一擊!', '#ffd24a', 14);
    if (mult > 1) this.float(pos.x + 46, pos.y - 60, '效果絕佳', '#8ef0a8', 13);
    if (mult < 1) this.float(pos.x + 46, pos.y - 60, '效果不佳', '#a8b6cc', 13);
    if (target.hp <= 0) {
      target.buffs = [];
      this.float(pos.x, pos.y - 106, '戰鬥不能', '#c8b0ff', 14);
    } else {
      // 冰凍碎裂 / 睡眠驚醒
      const broken = onDamaged(target);
      if (broken) {
        this.float(pos.x, pos.y - 86, `${AILMENT_NAME[broken]}解除`, '#9fe0ff', 13);
      }
    }
    this.checkPhases();
  }

  // ── 頭目階段 ─────────────────────────────────────────────
  /** 頭目血量低於門檻時觸發增援 / 狂暴 / 回復 */
  private checkPhases() {
    const phases = this.opt.phases;
    if (!phases || phases.length === 0) return;
    const leader = this.enemies[0];
    if (!leader || leader.hp <= 0) return;
    const ratio = leader.hp / leader.max.hp;
    for (let i = 0; i < phases.length; i++) {
      if (this.phaseDone[i]) continue;
      const ph = phases[i];
      if (ratio > ph.hpBelow) continue;
      this.phaseDone[i] = true;
      this.applyPhase(ph, leader);
      if (ph.message) this.phaseQueue.push(ph.message);
    }
  }

  private applyPhase(ph: BattlePhase, leader: Unit) {
    // 回復
    if (ph.healRatio) {
      const amount = Math.min(Math.floor(leader.max.hp * ph.healRatio), leader.max.hp - leader.hp);
      leader.hp += amount;
      const p = this.posOf(leader);
      this.float(p.x, p.y - 60, `+${amount}`, '#8ef0a8', 22);
    }
    // 狂暴
    if (ph.enrage) {
      for (const e of this.aliveEnemies()) {
        for (const b of ph.enrage) {
          e.buffs.push({ stat: b.stat, amount: b.amount, turns: b.turns, name: '狂暴' });
        }
        this.getFx(e).flash = 1;
        const p = this.posOf(e);
        this.float(p.x, p.y - 86, '狂暴化!', '#ff9a6a', 17);
      }
    }
    // 增援
    if (ph.summon) {
      for (const sm of ph.summon) {
        if (!SPECIES[sm.species]) continue;
        const u = createUnit(sm.species, Math.max(1, sm.level), 'enemy');
        u.hp = u.max.hp;
        u.mp = u.max.mp;
        this.enemies.push(u);
        this.fx.set(u.uid, { shake: 0, flash: 0.8, ox: 0, oy: 0 });
        const p = this.posOf(u);
        this.float(p.x, p.y - 60, '增援!', '#ffd24a', 18);
      }
    }
  }

  private execute(a: QueuedAction) {
    const { actor, cmd } = a;
    const isEnemy = actor.kind === 'enemy';

    // 異常狀態：睡眠 / 冰凍必定無法行動；麻痺 / 混亂有機率無法行動
    const blocked = actionBlocked(actor);
    if (blocked) {
      const p = this.posOf(actor);
      if (blocked === 'sleep') {
        this.message = `${actor.name} 正在沉睡，無法行動。`;
        this.float(p.x, p.y - 60, '沉睡', '#8ab0e8', 16);
      } else if (blocked === 'freeze') {
        this.message = `${actor.name} 被凍住了，無法行動！`;
        this.float(p.x, p.y - 60, '冰凍', '#7fe0f0', 16);
      } else if (blocked === 'paralysis') {
        this.message = `${actor.name} 被麻痺了，無法行動！`;
        this.float(p.x, p.y - 60, '麻痺', '#f0d060', 16);
      } else {
        this.message = `${actor.name} 陷入混亂，無法行動！`;
        this.float(p.x, p.y - 60, '混亂', '#e0a0e0', 16);
      }
      this.waitTimer = 0.7;
      return;
    }
    // 混亂時可能誤傷自己
    if (actor.ailment === 'confuse' && confusionSelfHit()) {
      const res = calcDamage(actor, actor, null);
      this.damage(actor, res.dmg, res.crit, res.mult, '');
      this.message = `${actor.name} 陷入混亂，攻擊了自己！ 造成 ${res.dmg} 傷害。`;
      this.waitTimer = 0.8;
      return;
    }

    if (isEnemy) {
      const ai = chooseAiAction(actor, this.aliveParty(), this.aliveEnemies());
      if (ai.skill) {
        this.performSkill(actor, ai.skill, ai.selfCast ? actor : ai.target);
      } else {
        this.performAttack(actor, this.findTarget(ai.target.uid, false) ?? ai.target);
      }
      this.waitTimer = 0.85;
      return;
    }

    switch (cmd.kind) {
      case 'attack': {
        const t = this.findTarget(cmd.targetUid, true);
        if (!t) {
          this.waitTimer = 0.3;
          return;
        }
        this.performAttack(actor, t);
        this.waitTimer = 0.8;
        break;
      }
      case 'skill': {
        const sk = cmd.skillId ? SKILLS[cmd.skillId] : undefined;
        if (!sk || actor.mp < sk.mp) {
          this.message = `${actor.name} 魔力不足，行動失敗。`;
          this.waitTimer = 0.7;
          return;
        }
        actor.mp -= sk.mp;
        let t: Unit | null = null;
        if (sk.target === 'self') t = actor;
        else if (sk.target === 'allEnemy') t = this.aliveEnemies()[0] ?? null;
        else if (sk.target === 'allAlly') t = this.aliveParty()[0] ?? null;
        else if (sk.target === 'ally') t = this.findTarget(cmd.targetUid, false);
        else t = this.findTarget(cmd.targetUid, true);
        if (!t) {
          this.waitTimer = 0.3;
          return;
        }
        this.performSkill(actor, sk, t);
        this.waitTimer = 0.95;
        break;
      }
      case 'item': {
        const def = cmd.itemId ? ITEMS[cmd.itemId] : undefined;
        if (!def || !removeItem(session.state, def.id, 1)) {
          this.message = '道具不足。';
          this.waitTimer = 0.6;
          return;
        }
        const t = this.findTarget(cmd.targetUid, false) ?? actor;
        this.performItem(actor, def.id, t);
        this.waitTimer = 0.9;
        break;
      }
      case 'capture': {
        if (!removeItem(session.state, 'sealstone', 1)) {
          this.message = '封印石不足。';
          this.waitTimer = 0.6;
          return;
        }
        const t = this.findTarget(cmd.targetUid, true);
        if (!t) {
          this.waitTimer = 0.3;
          return;
        }
        this.performCapture(actor, t);
        this.waitTimer = 1.1;
        break;
      }
      case 'guard':
        actor.guarding = true;
        this.message = `${actor.name} 擺出了防禦姿態。`;
        this.float(this.posOf(actor).x, this.posOf(actor).y - 60, '防禦', '#8ed0ff', 16);
        this.waitTimer = 0.5;
        break;
      case 'flee': {
        const chance = fleeChance(this.party, this.enemies);
        if (this.opt.boss) {
          this.message = '無法從這場戰鬥中逃脫！';
          this.waitTimer = 0.9;
          break;
        }
        if (partyFleeAlways(this.party) || Math.random() < chance) {
          this.message = '成功逃走了！';
          this.pendingResult = 'flee';
          this.resultLines = ['成功逃走了。'];
          this.phase = 'result';
          this.resultTimer = 1.2;
        } else {
          this.message = '逃跑失敗！';
          this.waitTimer = 0.8;
        }
        break;
      }
    }
  }

  private performAttack(actor: Unit, target: Unit) {
    this.lunge(actor, target);
    const res = calcDamage(actor, target, null, this.opt.bg);
    const el = actor.element === 'none' ? '' : `【${ELEMENT_NAME[actor.element]}】`;
    this.damage(target, res.dmg, res.crit, res.mult, el);
    this.message = `${actor.name} 的攻擊！ 對 ${target.name} 造成 ${res.dmg} 傷害。`;
    this.applyDrain(actor, res.dmg);
  }

  /** 被動「吸血」：造成傷害後回復自身 HP */
  private applyDrain(attacker: Unit, dmg: number) {
    const ratio = drainFor(attacker);
    if (ratio <= 0 || dmg <= 0 || attacker.hp <= 0) return;
    const before = attacker.hp;
    attacker.hp = Math.min(attacker.max.hp, attacker.hp + Math.max(1, Math.round(dmg * ratio)));
    const gained = attacker.hp - before;
    if (gained > 0) {
      const p = this.posOf(attacker);
      this.float(p.x, p.y - 74, `+${gained}`, '#8ef0a8', 15);
    }
  }

  private performSkill(actor: Unit, sk: SkillDef, primary: Unit) {
    const label2 = `【${sk.name}】`;
    if (sk.kind === 'heal' || sk.kind === 'revive' || sk.cure) audio.play('heal');
    else if (sk.kind === 'buff') audio.play('buff');
    else if (sk.kind === 'debuff' || sk.kind === 'status') audio.play('debuff');
    else audio.play('magic');
    // 目標清單必須依「施術者陣營」判定，否則敵方的全體技會打到自己的同伴
    const actorIsEnemy = actor.kind === 'enemy';
    const foes = () => (actorIsEnemy ? this.aliveParty() : this.aliveEnemies());
    const allies = () => (actorIsEnemy ? this.aliveEnemies() : this.aliveParty());
    if (sk.cure) {
      const list = sk.target === 'allAlly' ? allies() : [primary];
      const cured: string[] = [];
      for (const t of list) {
        if (t.ailment) {
          cured.push(`${t.name}（${AILMENT_NAME[t.ailment]}）`);
          clearAilment(t);
          this.getFx(t).flash = 0.5;
          this.float(this.posOf(t).x, this.posOf(t).y - 60, '淨化', '#8ef0a8', 18);
        }
      }
      this.message = cured.length
        ? `${actor.name} 使用了${label2}，解除了 ${cured.join('、')} 的異常狀態。`
        : `${actor.name} 使用了${label2}，但沒有需要解除的狀態。`;
      return;
    }
    if (sk.kind === 'heal') {
      const list = sk.target === 'allAlly' ? allies() : [primary];
      let total = 0;
      for (const t of list) {
        const amount = calcHeal(actor, sk, t);
        t.hp = Math.min(t.max.hp, t.hp + amount);
        total += amount;
        const p = this.posOf(t);
        this.float(p.x, p.y - 60, `+${amount}`, '#8ef0a8', 22);
      }
      this.message = `${actor.name} 使用了${label2}，回復了 ${total} HP。`;
      return;
    }
    if (sk.kind === 'revive') {
      const t = primary;
      if (t.hp > 0) {
        this.message = `${t.name} 尚未倒下。`;
        return;
      }
      t.hp = Math.max(1, Math.floor(t.max.hp * sk.power));
      t.buffs = [];
      const p = this.posOf(t);
      this.float(p.x, p.y - 60, '復活!', '#ffe98a', 20);
      this.message = `${actor.name} 使用了${label2}，${t.name} 重新站了起來！`;
      return;
    }
    if (sk.kind === 'buff' || sk.kind === 'debuff') {
      const list =
        sk.target === 'allAlly'
          ? allies()
          : sk.kind === 'buff'
          ? [primary]
          : sk.target === 'allEnemy'
          ? foes()
          : [primary];
      for (const t of list) {
        this.getFx(t).flash = 0.6;
        t.buffs = t.buffs.filter((b) => !(b.stat === sk.stat && Math.sign(b.amount) === Math.sign(sk.power)));
        t.buffs.push({
          stat: sk.stat!,
          amount: sk.power,
          turns: sk.turns ?? 3,
          name: sk.name
        });
        const p = this.posOf(t);
        this.float(p.x, p.y - 60, sk.kind === 'buff' ? '能力提升' : '能力下降', sk.kind === 'buff' ? '#8ed0ff' : '#e08aff', 14);
      }
      this.message = `${actor.name} 使用了${label2}！`;
      return;
    }
    if (sk.kind === 'status') {
      const list = sk.target === 'allEnemy' ? foes() : [primary];
      const names: string[] = [];
      for (const t of list) {
        if (!sk.ailment) continue;
        const applied = tryAilment(t, sk.ailment, sk.ailmentChance ?? 1, sk.ailmentTurns ?? 3);
        const p = this.posOf(t);
        this.getFx(t).flash = applied ? 0.7 : 0.2;
        this.float(
          p.x,
          p.y - 66,
          AILMENT_NAME[sk.ailment],
          AILMENT_COLOR[sk.ailment],
          applied ? 17 : 13
        );
        if (applied) names.push(t.name);
      }
      this.message = names.length
        ? `${actor.name} 使用了${label2}！ ${names.join('、')} 陷入了${AILMENT_NAME[sk.ailment!]}。`
        : `${actor.name} 使用了${label2}，但沒有奏效。`;
      return;
    }
    // 攻擊技
    this.lunge(actor, primary);
    const targets = sk.target === 'allEnemy' ? foes() : [primary];
    let total = 0;
    let anyCrit = false;
    let mult = 1;
    const appliedNames: string[] = [];
    for (const t of targets) {
      const res = calcDamage(actor, t, sk, this.opt.bg);
      this.damage(t, res.dmg, res.crit, res.mult, '');
      total += res.dmg;
      mult = res.mult;
      anyCrit = anyCrit || res.crit;
      if (sk.ailment && t.hp > 0) {
        const applied = tryAilment(t, sk.ailment, sk.ailmentChance ?? 1, sk.ailmentTurns ?? 3);
        if (applied) {
          const p = this.posOf(t);
          this.float(p.x, p.y - 86, AILMENT_NAME[sk.ailment], AILMENT_COLOR[sk.ailment], 15);
          appliedNames.push(t.name);
        }
      }
    }
    this.message = `${actor.name} 使用了${label2}！ 造成 ${total} 傷害。${
      mult > 1 ? '（效果絕佳）' : mult < 1 ? '（效果不佳）' : ''
    }${
      appliedNames.length
        ? ` ${appliedNames.join('、')} 陷入了${AILMENT_NAME[sk.ailment!]}。`
        : ''
    }`;
    this.applyDrain(actor, total);
  }

  private performItem(actor: Unit, itemId: string, target: Unit) {
    const def = ITEMS[itemId];
    const p = this.posOf(target);
    switch (def.effect.type) {
      case 'heal': {
        const amount = Math.min(def.effect.power, target.max.hp - target.hp);
        target.hp += amount;
        this.float(p.x, p.y - 60, `+${amount}`, '#8ef0a8', 22);
        this.message = `${actor.name} 對 ${target.name} 使用了 ${def.name}，回復 ${amount} HP。`;
        break;
      }
      case 'mp': {
        const amount = Math.min(def.effect.power, target.max.mp - target.mp);
        target.mp += amount;
        this.float(p.x, p.y - 60, `+${amount} MP`, '#8ed0ff', 20);
        this.message = `${actor.name} 對 ${target.name} 使用了 ${def.name}，回復 ${amount} MP。`;
        break;
      }
      case 'revive': {
        if (target.hp > 0) {
          this.message = `${target.name} 尚未倒下。`;
          break;
        }
        target.hp = Math.max(1, Math.floor(target.max.hp * def.effect.power));
        this.float(p.x, p.y - 60, '復活!', '#ffe98a', 20);
        this.message = `${actor.name} 使用了 ${def.name}，${target.name} 復活了！`;
        break;
      }
      case 'cure': {
        const had = target.ailment;
        clearAilment(target);
        this.getFx(target).flash = 0.5;
        this.float(
          p.x,
          p.y - 60,
          had ? '解除' : '—',
          had ? '#8ef0a8' : '#a8b6cc',
          18
        );
        this.message = had
          ? `${actor.name} 對 ${target.name} 使用了 ${def.name}，解除了${AILMENT_NAME[had]}。`
          : `${target.name} 並沒有異常狀態。`;
        break;
      }
      case 'healAll': {
        let total = 0;
        for (const u of this.aliveParty()) {
          const amount = Math.min(def.effect.power, u.max.hp - u.hp);
          u.hp += amount;
          total += amount;
          const q = this.posOf(u);
          this.float(q.x, q.y - 60, `+${amount}`, '#8ef0a8', 18);
        }
        this.message = `${actor.name} 使用了 ${def.name}，全隊共回復 ${total} HP。`;
        break;
      }
      case 'damage': {
        this.damage(target, def.effect.power, false, 1, '');
        this.message = `${actor.name} 投出了 ${def.name}！ 對 ${target.name} 造成 ${def.effect.power} 傷害。`;
        break;
      }
      default:
        this.message = `${def.name} 沒有效果。`;
    }
  }

  private performCapture(actor: Unit, target: Unit) {
    const chance = captureChance(target);
    const p = this.posOf(target);
    this.getFx(target).flash = 1;
    if (chance <= 0) {
      this.float(p.x, p.y - 60, '無法封印', '#c8b0ff', 18);
      this.message = `${target.name} 的力量太強，封印石碎裂了！`;
      return;
    }
    if (Math.random() < chance) {
      this.float(p.x, p.y - 60, '封印成功!', '#ffe98a', 22);
      audio.play('capture');
      const caught = createUnit(target.speciesId, target.level, 'pet');
      caught.hp = Math.max(1, target.hp);
      caught.mp = target.mp;
      const where = addPet(session.state, caught);
      target.hp = 0;
      questOnCapture(session.state, target.speciesId);
      const ach = grantAchievements(session.state);
      this.message = `${target.name} 被封印了！${
        where === 'party' ? '加入了出戰隊伍。' : '已送往待命區。'
      }${ach.length ? `  🏆 ${ach.map((a) => a.name).join('、')}` : ''}`;
    } else {
      this.float(p.x, p.y - 60, '失敗…', '#a8b6cc', 18);
      audio.play('fail');
      this.message = `${actor.name} 投出了封印石……但 ${target.name} 掙脫了！`;
    }
  }

  // ── 勝敗 ─────────────────────────────────────────────────
  private victory() {
    const s = session.state;
    const goldMult = 1 + partyBonus(this.party, 'goldBonus');
    const expMult = 1 + partyBonus(this.party, 'expBonus');
    const totalExp = Math.round(this.enemies.reduce((a, e) => a + expReward(e), 0) * expMult);
    const totalGold = Math.round(this.enemies.reduce((a, e) => a + goldReward(e), 0) * goldMult);
    addGold(s, totalGold);

    const lines: string[] = [`獲得 ${totalExp} 經驗值、${totalGold} G。`];
    const levelUps: LevelUpInfo[] = [];
    for (const u of this.party) {
      const info = giveExp(s, u, totalExp);
      if (info) levelUps.push(info);
    }
    for (const info of levelUps) {
      let msg = `${info.unit.name} 升到了 Lv${info.to}！`;
      if (info.learned.length) {
        msg += ` 學會 ${info.learned.map((k) => SKILLS[k]?.name ?? k).join('、')}！`;
      }
      lines.push(msg);
      if (info.evolvedTo) {
        lines.push(`★ ${info.unit.name} 進化了！ 種族登錄至圖鑑。`);
      }
    }
    // 素材掉落
    if (Math.random() < 0.4) {
      addItem(s, 'stardust', 1);
      lines.push('撿到了 星塵碎片 ×1。');
    }
    s.battlesWon++;
    questOnWin(
      s,
      this.enemies.map((e) => e.speciesId)
    );
    for (const a of grantAchievements(s)) {
      lines.push(`🏆 成就達成：${a.name}！`);
    }

    this.resultLines = lines;
    this.message = '戰鬥勝利！';
    audio.play(levelUps.length ? 'levelup' : 'victory');
    this.pendingResult = 'win';
    this.phase = 'result';
    this.resultTimer = this.opt.boss ? 3.0 : 2.4;

    for (const u of this.party) {
      u.buffs = [];
      u.guarding = false;
      clearAilment(u);
    }
  }

  private defeat() {
    this.resultLines = ['隊伍全滅了……'];
    this.message = '戰鬥失敗……';
    audio.play('defeat');
    this.pendingResult = 'lose';
    this.phase = 'result';
    this.resultTimer = 2.6;
    for (const u of this.party) {
      u.buffs = [];
      u.guarding = false;
      clearAilment(u);
    }
  }

  private finish() {
    this.opt.onEnd(this.pendingResult);
    scenes.pop();
  }

  // ─────────────────────────────────────────────────────────
  // 繪圖
  // ─────────────────────────────────────────────────────────
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawBackground(ctx);

    // 敵人
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      this.drawUnit(ctx, e, true);
    }
    // 我方
    for (const u of this.party) {
      if (u.hp <= 0) continue;
      this.drawUnit(ctx, u, false);
    }

    // 目標指示
    if (this.phase === 'target' && this.targets[this.targetIdx]) {
      const t = this.targets[this.targetIdx];
      const p = this.posOf(t);
      const bob = Math.sin(this.time * 8) * 3;
      ctx.fillStyle = '#ffe06a';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 78 + bob);
      ctx.lineTo(p.x - 11, p.y - 96 + bob);
      ctx.lineTo(p.x + 11, p.y - 96 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,150,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 2, 32, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 敵人血條
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const p = this.posOf(e);
      const w = 92;
      panel(ctx, p.x - w / 2 - 2, p.y - 84, w + 4, 30, {
        alpha: 0.8,
        radius: 5,
        fill: 'rgba(10,14,26,0.85)',
        border: 'rgba(255,255,255,0.18)'
      });
      label(ctx, `${e.name} Lv${e.level}`, p.x, p.y - 68, {
        size: 11,
        align: 'center',
        color: '#ffd9d9',
        bold: true
      });
      bar(ctx, p.x - w / 2, p.y - 62, w, 6, e.hp / e.max.hp, {
        color: '#e05a5a',
        color2: 'rgba(255,255,255,0.25)'
      });
    }

    for (const f of this.floaters) {
      label(ctx, f.text, f.x, f.y, {
        size: f.size,
        align: 'center',
        color: f.color,
        bold: true,
        alpha: Math.max(0, 1 - f.t / 1.1)
      });
    }

    this.drawBottom(ctx);
    this.drawFieldFx(ctx);
    if (this.showHelp) this.drawHelp(ctx);
  }

  /** 場地效果標示 */
  private drawFieldFx(ctx: CanvasRenderingContext2D) {
    const f = FIELD_EFFECTS[this.opt.bg];
    if (!f) return;
    panel(ctx, VIEW_W / 2 - 108, 12, 216, 26, {
      radius: 13,
      fill: 'rgba(8,12,24,0.72)',
      border: 'rgba(150,190,255,0.35)'
    });
    label(ctx, `場地：${f.name}`, VIEW_W / 2, 30, {
      size: 13,
      align: 'center',
      color: '#ffe6a8',
      bold: true
    });
  }

  private drawHelp(ctx: CanvasRenderingContext2D) {
    panel(ctx, 150, 96, VIEW_W - 300, VIEW_H - 250, {
      fill: 'rgba(6,10,20,0.97)',
      border: 'rgba(150,190,255,0.6)',
      radius: 12
    });
    label(ctx, '戰鬥操作', VIEW_W / 2, 138, { size: 20, align: 'center', color: '#ffe6a8', bold: true });
    const lines = [
      '↑↓ 選擇指令　空白鍵 / Enter 確定　Esc 返回上一層',
      '攻擊／技能／道具／封印／防禦／逃走',
      '封印需要消耗「封印石」，敵方 HP 越低成功率越高',
      '防禦可讓該成員本回合受到的傷害減半',
      '屬性相剋：火 → 風 → 地 → 水 → 火（效果絕佳 1.6 倍）',
      '異常狀態：☠中毒　✚流血（每回合受傷）　⚡麻痺　Z睡眠　❄冰凍　？混亂（機率無法行動）',
      '中毒 / 流血可用「解毒草」或技能「淨化」「大淨化」解除，冰凍受擊即碎',
      '場地效果會強化對應屬性傷害，畫面頂端會標示',
      '每隻幻獸都有被動特性（如抗性、吸血、免疫），可在「圖鑑」查看',
      '裝備（武器 / 防具 / 飾品）在選單「裝備」頁籤穿戴，可提升能力並提供異常抗性',
      '頭目在血量過半時可能狂暴化或呼叫增援，注意節奏',
      '',
      '再按一次 Esc 關閉本說明'
    ];
    lines.forEach((l, i) =>
      label(ctx, l, 186, 182 + i * 26, { size: 13, color: i === 0 ? '#8ed0ff' : '#d8e4ff' })
    );
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const palettes: Record<string, [string, string, string]> = {
      field: ['#1b2c4a', '#2f4a6a', '#3d6a4a'],
      cave: ['#0a0716', '#1a1230', '#241a3c'],
      road: ['#3a2438', '#5a3448', '#4a3a30'],
      harbor: ['#10203c', '#1e3a5e', '#2a4a5e'],
      snow: ['#2a3a5c', '#4a6a90', '#c8dcec'],
      volcano: ['#2a0e08', '#5a2010', '#8a3a14'],
      sky: ['#1a1638', '#3a2f74', '#7a6ac0'],
      abyss: ['#08040f', '#1c0a2e', '#2e1046'],
      star: ['#0e1030', '#2a2a6a', '#5a6ab8'],
      forge: ['#2a0e08', '#6a2a12', '#b85a1a']
    };
    const [c1, c2, c3] = palettes[this.opt.bg] ?? palettes.field;
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, c1);
    g.addColorStop(0.45, c2);
    g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // 地平線光暈
    const hg = ctx.createRadialGradient(480, 150, 20, 480, 150, 460);
    hg.addColorStop(0, 'rgba(255,240,200,0.16)');
    hg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // 前景地面
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.moveTo(0, 330);
    ctx.quadraticCurveTo(480, 292, 960, 330);
    ctx.lineTo(960, VIEW_H);
    ctx.lineTo(0, VIEW_H);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const y = 340 + i * 20;
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, y, VIEW_W, 1);
    }

    // 漂浮光點
    for (let i = 0; i < 26; i++) {
      const t = this.time * 0.25 + i * 1.7;
      const x = ((i * 137) % VIEW_W) + Math.sin(t) * 22;
      const y = (i * 63) % VIEW_H;
      ctx.fillStyle = `rgba(200,230,255,${0.05 + (Math.sin(t * 1.6) + 1) * 0.05})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawUnit(ctx: CanvasRenderingContext2D, u: Unit, enemy: boolean) {
    const base = this.posOf(u);
    const f = this.getFx(u);
    const shakeX = f.shake > 0 ? Math.sin(this.time * 60) * f.shake * 6 : 0;
    const x = base.x + f.ox + shakeX;
    const y = base.y + f.oy;

    const cur = this.phase === 'target' && this.targets[this.targetIdx] === u;

    if (cur) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(255,230,120,0.35)';
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (enemy) {
      drawBeast(ctx, x, y, 1.05, 1, u.sprite, this.time, f.flash);
    } else if (u.kind === 'hero') {
      drawHero(
        ctx,
        x,
        y,
        1,
        0,
        {
          skin: '#f0c8a0',
          hair: u.speciesId === 'hero_rin' ? '#6ad8b8' : u.speciesId === 'hero_tieshan' ? '#3a2a1a' : '#3f3128',
          cloth: u.speciesId === 'hero_rin' ? '#3aa88c' : u.speciesId === 'hero_tieshan' ? '#8a6634' : '#3a6fd8',
          cloth2: u.speciesId === 'hero_rin' ? '#25705e' : u.speciesId === 'hero_tieshan' ? '#5c4420' : '#26489a',
          cape: u.speciesId === 'hero_asa' ? '#2f8ad8' : undefined
        },
        this.time,
        true
      );
    } else {
      drawBeast(ctx, x, y, 1.0, 1, u.sprite, this.time + 0.7, f.flash);
    }

    // 狀態圖示
    if (u.buffs.length) {
      u.buffs.forEach((b, i) => {
        const bx = base.x - 22 + i * 16;
        const up = b.amount > 0;
        label(ctx, up ? '▲' : '▼', bx, base.y - 70, {
          size: 12,
          color: up ? '#8ed0ff' : '#e08aff',
          align: 'center'
        });
      });
    }
    if (u.ailment) {
      label(ctx, AILMENT_ICON[u.ailment], base.x - 34, base.y - 70, {
        size: 15,
        color: AILMENT_COLOR[u.ailment],
        align: 'center',
        bold: true
      });
    }
    if (u.guarding) {
      label(ctx, '防禦', base.x + (u.ailment ? 18 : 0), base.y - 70, { size: 11, align: 'center', color: '#8ed0ff', bold: true });
    }
  }

  private drawBottom(ctx: CanvasRenderingContext2D) {
    // 訊息框
    panel(ctx, 12, 420, VIEW_W - 24, 40, {
      fill: 'rgba(8,13,26,0.94)',
      border: 'rgba(150,190,255,0.55)',
      radius: 8
    });
    const msgLines = wrapText(ctx, this.message, VIEW_W - 60, 15);
    label(ctx, msgLines[0] ?? '', 30, 446, { size: 15, color: '#eef3ff' });

    // 我方狀態
    panel(ctx, 12, 466, 336, 126, { fill: 'rgba(8,13,26,0.92)', radius: 8 });
    this.party.forEach((u, i) => {
      const y = 480 + i * 24;
      const dead = u.hp <= 0;
      const isActor = this.phase === 'command' && this.party[this.cmdIdx] === u;
      if (isActor) {
        panel(ctx, 18, y - 11, 324, 22, {
          radius: 4,
          fill: 'rgba(70,120,220,0.35)',
          border: 'rgba(180,220,255,0.6)',
          borderWidth: 1
        });
      }
      const elColor = ELEMENT_COLOR[u.element];
      label(ctx, u.name, 26, y + 4, { size: 13, color: dead ? '#ff9a9a' : '#e8eefc', bold: true });
      ctx.fillStyle = elColor;
      ctx.beginPath();
      ctx.arc(84, y - 1, 5, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, `Lv${u.level}`, 94, y + 4, { size: 11, color: '#a8b6cc' });
      bar(ctx, 136, y - 9, 100, 7, u.hp / u.max.hp, {
        color: u.hp / u.max.hp > 0.5 ? '#54d16a' : u.hp / u.max.hp > 0.25 ? '#e8c24a' : '#e05a5a',
        color2: 'rgba(255,255,255,0.2)'
      });
      if (dead) {
        label(ctx, '倒下', 240, y + 4, { size: 11, color: '#ff9a9a' });
      } else {
        label(ctx, `${u.hp}`, 242, y + 4, { size: 11, color: '#c8d4e8' });
      }
      bar(ctx, 282, y - 9, 56, 7, u.max.mp > 0 ? u.mp / u.max.mp : 0, {
        color: '#4a86e8',
        color2: 'rgba(255,255,255,0.2)'
      });
      if (u.ailment && !dead) {
        label(ctx, AILMENT_ICON[u.ailment], 344, y + 4, {
          size: 12,
          color: AILMENT_COLOR[u.ailment],
          align: 'center',
          bold: true
        });
      }
    });

    // 指令面板
    panel(ctx, 360, 466, VIEW_W - 372, 126, { fill: 'rgba(8,13,26,0.92)', radius: 8 });
    this.drawCommandPanel(ctx);
  }

  private drawCommandPanel(ctx: CanvasRenderingContext2D) {
    const x = 372;
    const y = 476;

    if (this.phase === 'intro') {
      label(ctx, '戰鬥開始…', x, y + 40, { size: 16, color: '#ffe6a8', bold: true });
      label(ctx, '按 空白鍵 繼續', x, y + 66, { size: 12, color: '#a8b6cc' });
      return;
    }

    if (this.phase === 'resolve' || this.phase === 'result') {
      label(ctx, '結算中…', x, y + 40, { size: 15, color: '#a8b6cc' });
      if (this.phase === 'result') {
        this.resultLines.slice(0, 4).forEach((l, i) => {
          label(ctx, l, x, y + 14 + i * 20, { size: 12, color: i === 0 ? '#ffe98a' : '#8ef0a8' });
        });
      }
      return;
    }

    if (this.phase === 'target') {
      const t = this.targets[this.targetIdx];
      label(ctx, `選擇目標：${t?.name ?? ''} Lv${t?.level ?? ''}`, x, y + 22, {
        size: 14,
        color: '#ffe6a8',
        bold: true
      });
      if (t) {
        label(ctx, `HP ${t.hp}/${t.max.hp}`, x, y + 44, { size: 12, color: '#c8d4e8' });
        const el = `${ELEMENT_NAME[t.element]}屬性`;
        label(ctx, el, x + 140, y + 44, { size: 12, color: ELEMENT_COLOR[t.element] });
        if (this.pendingKind === 'capture') {
          const ch = Math.round(captureChance(t) * 100);
          label(ctx, `封印成功率：${ch}%`, x, y + 64, {
            size: 13,
            color: ch > 50 ? '#8ef0a8' : ch > 20 ? '#e8c24a' : '#ff9a9a',
            bold: true
          });
        }
      }
      label(ctx, '← → 選擇　空白鍵 確定　Esc 返回', x, y + 92, { size: 11, color: '#8a98b0' });
      return;
    }

    const unit = this.party[this.cmdIdx];
    if (!unit) return;

    if (this.menu === 'main') {
      const list = this.mainMenu(unit);
      label(ctx, `${unit.name} 的行動`, x, y + 6, { size: 13, color: '#8ed0ff', bold: true });
      list.forEach((it, i) => {
        const sel = i === this.menuIdx;
        const col = i >= 3 ? 1 : 0;
        const row = i % 3;
        const colX = x + col * 150;
        const ly = y + 30 + row * 22;
        if (sel) {
          panel(ctx, colX - 8, ly - 15, 148, 21, {
            radius: 4,
            fill: 'rgba(70,120,220,0.45)',
            border: 'rgba(180,220,255,0.7)',
            borderWidth: 1
          });
        }
        label(ctx, `${sel ? '▶' : '　'}${it.text}`, colX, ly, {
          size: 13,
          color: it.enabled ? (sel ? '#ffffff' : '#c8d4e8') : '#5a6478'
        });
      });
      label(ctx, '↑↓←→ 選擇　空白鍵 確定', x + 300, y + 114, { size: 11, color: '#8a98b0' });
      return;
    }

    if (this.menu === 'skill') {
      label(ctx, '技能', x, y + 6, { size: 13, color: '#8ed0ff', bold: true });
      unit.skills.slice(0, 5).forEach((id, i) => {
        const sk = SKILLS[id];
        if (!sk) return;
        const sel = i === this.menuIdx;
        const ly = y + 26 + i * 19;
        const ok = unit.mp >= sk.mp;
        if (sel) {
          panel(ctx, x - 8, ly - 14, 540, 18, {
            radius: 4,
            fill: 'rgba(70,120,220,0.45)',
            border: 'rgba(180,220,255,0.7)',
            borderWidth: 1
          });
        }
        label(ctx, `${sel ? '▶ ' : '   '}${sk.name}`, x, ly, {
          size: 12,
          color: ok ? (sel ? '#ffffff' : '#c8d4e8') : '#5a6478'
        });
        label(ctx, `MP ${sk.mp}`, x + 130, ly, { size: 11, color: ok ? '#8ed0ff' : '#5a6478' });
        ctx.fillStyle = ELEMENT_COLOR[sk.element];
        ctx.beginPath();
        ctx.arc(x + 178, ly - 4, 5, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, sk.desc, x + 190, ly, { size: 11, color: '#8a98b0' });
      });
      return;
    }

    if (this.menu === 'item') {
      const ids = this.itemList();
      label(ctx, '道具', x, y + 6, { size: 13, color: '#8ed0ff', bold: true });
      ids.slice(0, 5).forEach((id, i) => {
        const def = ITEMS[id];
        const sel = i === this.menuIdx;
        const ly = y + 26 + i * 19;
        if (sel) {
          panel(ctx, x - 8, ly - 14, 540, 18, {
            radius: 4,
            fill: 'rgba(70,120,220,0.45)',
            border: 'rgba(180,220,255,0.7)',
            borderWidth: 1
          });
        }
        label(ctx, `${sel ? '▶ ' : '   '}${def.name} ×${itemCount(session.state, id)}`, x, ly, {
          size: 12,
          color: sel ? '#ffffff' : '#c8d4e8'
        });
        label(ctx, def.desc, x + 230, ly, { size: 11, color: '#8a98b0' });
      });
      return;
    }
  }
}
