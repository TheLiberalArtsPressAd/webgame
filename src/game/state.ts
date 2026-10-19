import { ELEMENT_NAME, SPECIES, ITEMS, DEX_REWARDS, expToNext, skillsFor, statAtLevel, statsForUnit, createUnit, evolveUnit, autoEvolution, evolutionEligible, fusionResult, fusionPotential, fusionLevel, fusionCost, HIDDEN_FUSION_POTENTIAL, upgradeCost, MAX_UPGRADE, MAX_SOCKETS, gemsOf } from './data';
import { ACHIEVEMENTS } from './achievements';
import type { AchievementDef } from './achievements';
import { RULES } from './rules';
import type { EquipSlot, Unit } from './types';
import type { QuestDef } from './quests';

export interface GameState {
  version: number;
  /** 存檔欄位（1~3） */
  slot: number;
  playerName: string;
  mapId: string;
  px: number;
  py: number;
  facing: number;
  /** 出戰隊伍（最多 4） */
  party: Unit[];
  /** 待命幻獸 */
  storage: Unit[];
  inventory: Record<string, number>;
  gold: number;
  /** 累計獲得金幣（成就用） */
  goldEarned: number;
  flags: Record<string, boolean>;
  stage: number;
  steps: number;
  playTime: number;
  battlesWon: number;
  captured: number;
  /** 幻獸圖鑑 */
  dex: Record<string, boolean>;
  /** 最近造訪的城鎮（傳送羽用） */
  lastTown: string;
  /** 已接取的委託 */
  questTaken: string[];
  /** 委託進度（擊倒 / 封印 / 抵達次數） */
  questProgress: Record<string, number>;
  /** 一次性委託是否已回報 */
  questClaimed: Record<string, boolean>;
  /** 重複委託完成次數 */
  questClears: Record<string, number>;
  /** 完成的委託總件數（成就用） */
  questsDone: number;
  /** 已領取的圖鑑收集獎勵 id */
  dexRewards: string[];
  /** 隨機委託（討伐委託板）目前這一批 */
  bounties: QuestDef[];
  /** 隨機委託批號（換一批時 +1） */
  bountyRound: number;
  /** 隨機委託的種子（建立存檔時決定） */
  bountySeed: number;
  /** 完成的討伐委託件數（成就用） */
  bountiesDone: number;
  /** 每日委託 */
  dailies: QuestDef[];
  /** 每日委託所屬日期（YYYY-MM-DD，本地時區） */
  dailyKey: string;
  /** 當日已完成的每日委託數 */
  dailyDone: number;
  /** 連續完成全部每日委託的天數 */
  dailyStreak: number;
  /** 最後一次完成全部每日委託的日期（連續天數判定用） */
  dailyLastDoneKey: string;
  /** 合成次數（成就用） */
  fusions: number;
  /** 強化次數（成就用） */
  upgrades: number;
  /** 鑲嵌次數（成就用） */
  gemsSocketed: number;
  /** 進化次數（成就用） */
  evolutions: number;
  /** 已解鎖成就 id → 解鎖時間戳 */
  achievements: Record<string, number>;
  /** 最後儲存時間 */
  savedAt?: number;
}

export const SAVE_KEY_PREFIX = 'stardust-beasts-save-v1';
/** 相容舊版：單一存檔欄位 */
export const SAVE_KEY = `${SAVE_KEY_PREFIX}-s1`;
export const SAVE_SLOTS = 4;
export const MAX_PARTY = 4;

/** 欄位存檔鍵 */
export function slotKey(slot: number): string {
  const n = Math.max(1, Math.min(SAVE_SLOTS, Math.floor(slot) || 1));
  return `${SAVE_KEY_PREFIX}-s${n}`;
}

export function newGame(name = '旭', slot = 1): GameState {
  const hero = createUnit('hero_asa', 1, 'hero', name);
  const starter = createUnit('dusthare', 3, 'pet');
  const s: GameState = {
    version: 1,
    slot,
    playerName: name,
    mapId: 'village',
    px: 9,
    py: 11,
    facing: 2,
    party: [hero, starter],
    storage: [],
    inventory: { sealstone: 6, herb: 6, manadrop: 3, antidote: 2, smoke: 1 },
    gold: 400,
    goldEarned: 400,
    flags: {},
    stage: 0,
    steps: 0,
    playTime: 0,
    battlesWon: 0,
    captured: 0,
    dex: { hero_asa: true, dusthare: true },
    lastTown: 'village',
    questTaken: [],
    questProgress: {},
    questClaimed: {},
    questClears: {},
    questsDone: 0,
    dexRewards: [],
    bounties: [],
    bountyRound: 0,
    bountySeed: Math.floor(Math.random() * 0x7fffffff),
    bountiesDone: 0,
    dailies: [],
    dailyKey: '',
    dailyDone: 0,
    dailyStreak: 0,
    dailyLastDoneKey: '',
    fusions: 0,
    upgrades: 0,
    gemsSocketed: 0,
    evolutions: 0,
    achievements: {}
  };
  return s;
}

/** 增加金幣並累計「累計獲得」 */
export function addGold(s: GameState, n: number) {
  s.gold += n;
  if (n > 0) s.goldEarned = (s.goldEarned ?? 0) + n;
}

/** 扣除金幣（不足回傳 false） */
export function spendGold(s: GameState, n: number): boolean {
  if (s.gold < n) return false;
  s.gold -= n;
  return true;
}

// ─────────────────────────────────────────────────────────────
export function aliveParty(s: GameState): Unit[] {
  return s.party.filter((u) => u.hp > 0);
}

export function healParty(s: GameState, hpRatio = 1, mpRatio = 1) {
  for (const u of s.party) {
    u.hp = Math.min(u.max.hp, u.hp + Math.max(1, Math.floor(u.max.hp * hpRatio)));
    u.mp = Math.min(u.max.mp, u.mp + Math.max(1, Math.floor(u.max.mp * mpRatio)));
    u.buffs = [];
    u.guarding = false;
    u.ailment = undefined;
    u.ailmentTurns = 0;
  }
}

export function fullRestore(s: GameState) {
  for (const u of s.party) {
    u.hp = u.max.hp;
    u.mp = u.max.mp;
    u.buffs = [];
    u.guarding = false;
    u.ailment = undefined;
    u.ailmentTurns = 0;
  }
}

export function addItem(s: GameState, id: string, n = 1) {
  if (!ITEMS[id]) return;
  s.inventory[id] = (s.inventory[id] ?? 0) + n;
  if (s.inventory[id] <= 0) delete s.inventory[id];
}

export function removeItem(s: GameState, id: string, n = 1): boolean {
  const have = s.inventory[id] ?? 0;
  if (have < n) return false;
  s.inventory[id] = have - n;
  if (s.inventory[id] <= 0) delete s.inventory[id];
  return true;
}

export function itemCount(s: GameState, id: string): number {
  return s.inventory[id] ?? 0;
}

/** 可販售的道具總值 */
export function inventoryList(s: GameState): { id: string; n: number }[] {
  return Object.keys(s.inventory)
    .filter((id) => s.inventory[id] > 0)
    .map((id) => ({ id, n: s.inventory[id] }));
}

export function addPet(s: GameState, unit: Unit): 'party' | 'storage' {
  s.dex[unit.speciesId] = true;
  s.captured++;
  if (s.party.length < MAX_PARTY) {
    s.party.push(unit);
    return 'party';
  }
  s.storage.push(unit);
  return 'storage';
}

export function recalc(u: Unit) {
  const sp = SPECIES[u.speciesId];
  if (!sp) return;
  const newMax = statsForUnit(u);
  const wasDead = u.hp <= 0;
  const hpRatio = u.max.hp > 0 ? u.hp / u.max.hp : 1;
  const mpRatio = u.max.mp > 0 ? u.mp / u.max.mp : 1;
  u.max = newMax;
  u.hp = wasDead ? 0 : Math.max(1, Math.round(newMax.hp * hpRatio));
  u.mp = Math.round(newMax.mp * mpRatio);
  u.skills = skillsFor(sp, u.level);
}

// ─────────────────────────────────────────────────────────────
// 裝備
// ─────────────────────────────────────────────────────────────
/** 裝備道具（會把原本的同欄位裝備退回背包）。成功回傳 true。 */
export function equipItem(s: GameState, u: Unit, id: string): boolean {
  const def = ITEMS[id];
  if (!def || def.effect.type !== 'equip') return false;
  if (itemCount(s, id) <= 0) return false;
  const slot = def.effect.slot;
  const cur = u.equip?.[slot];
  if (!removeItem(s, id, 1)) return false;
  if (cur) addItem(s, cur, 1);
  u.equip = u.equip ?? {};
  u.equip[slot] = id;
  recalc(u);
  return true;
}

/** 卸下某欄位裝備並退回背包。回傳卸下的道具 id。 */
export function unequipSlot(s: GameState, u: Unit, slot: 'weapon' | 'armor' | 'accessory'): string | null {
  const cur = u.equip?.[slot];
  if (!cur) return null;
  addItem(s, cur, 1);
  if (u.equip) delete u.equip[slot];
  recalc(u);
  return cur;
}

/** 將幻獸加入隊伍或待命（不計入「封印數」） */
export function pushPet(s: GameState, unit: Unit): 'party' | 'storage' {
  s.dex[unit.speciesId] = true;
  if (s.party.length < MAX_PARTY) {
    s.party.push(unit);
    return 'party';
  }
  s.storage.push(unit);
  return 'storage';
}

/** 從隊伍或待命中移除某隻幻獸 */
export function removeUnit(s: GameState, u: Unit): boolean {
  let i = s.party.findIndex((x) => x.uid === u.uid);
  if (i >= 0) {
    s.party.splice(i, 1);
    return true;
  }
  i = s.storage.findIndex((x) => x.uid === u.uid);
  if (i >= 0) {
    s.storage.splice(i, 1);
    return true;
  }
  return false;
}

/** 把待命幻獸移到隊伍（隊伍需有空位） */
export function toParty(s: GameState, u: Unit): boolean {
  if (s.party.length >= MAX_PARTY) return false;
  const i = s.storage.findIndex((x) => x.uid === u.uid);
  if (i < 0) return false;
  s.storage.splice(i, 1);
  s.party.push(u);
  return true;
}

/** 把隊伍幻獸移到待命 */
export function toStorage(s: GameState, u: Unit): boolean {
  if (s.party.length <= 1) return false;
  const i = s.party.findIndex((x) => x.uid === u.uid);
  if (i < 0) return false;
  s.party.splice(i, 1);
  s.storage.push(u);
  return true;
}

// ─────────────────────────────────────────────────────────────
// 進化（手動選擇分支）
// ─────────────────────────────────────────────────────────────
export function evolveOptions(s: GameState, u: Unit) {
  return evolutionEligible(u, { inventory: s.inventory, flags: s.flags, requireItem: true });
}

/** 手動進化到指定種族（需符合條件、消耗道具）。成功回傳新種族名稱。 */
export function evolveManual(s: GameState, u: Unit, speciesId: string): string | null {
  const opts = evolveOptions(s, u);
  const branch = opts.find((e) => e.species === speciesId);
  if (!branch) return null;
  if (branch.item && !removeItem(s, branch.item, 1)) return null;
  if (!evolveUnit(u, speciesId)) return null;
  s.dex[speciesId] = true;
  s.evolutions = (s.evolutions ?? 0) + 1;
  return SPECIES[speciesId]?.name ?? speciesId;
}

// ─────────────────────────────────────────────────────────────
// 合成 / 育種
// ─────────────────────────────────────────────────────────────
export interface FusionPreview {
  species: string;
  level: number;
  potential: number;
  cost: number;
  recipeDesc?: string;
  canAfford: boolean;
  /** 結果是否為隱藏種族 */
  hidden: boolean;
  /** 育種提示（無固定配方時） */
  hint?: string;
}

/** 兩隻幻獸能否合成 */
export function canFuse(s: GameState, a: Unit, b: Unit): string | null {
  if (!a || !b) return '請選擇兩隻幻獸';
  if (a.uid === b.uid) return '不能與自己合成';
  if (a.kind !== 'pet' || b.kind !== 'pet') return '英雄無法合成';
  if (!SPECIES[a.speciesId] || !SPECIES[b.speciesId]) return '未知的幻獸';
  return null;
}

export function fusionPreview(s: GameState, a: Unit, b: Unit): FusionPreview | null {
  if (canFuse(s, a, b)) return null;
  const r = fusionResult(a, b);
  if (!SPECIES[r.species]) return null;
  const cost = fusionCost(a, b);
  const potential = fusionPotential(a, b);
  const hidden = !!SPECIES[r.species].hidden;
  let hint: string | undefined;
  if (!r.recipe && !hidden && a.element === b.element && a.element !== 'none') {
    hint = `兩隻皆為${ELEMENT_NAME[a.element]}屬性：潛能達 ${HIDDEN_FUSION_POTENTIAL} 可育出隱藏種族`;
  }
  return {
    species: r.species,
    level: fusionLevel(a, b, r.recipe),
    potential,
    cost,
    recipeDesc: r.recipe?.desc,
    canAfford: s.gold >= cost,
    hidden,
    hint
  };
}

/** 合成兩隻幻獸：消耗金幣與父母，產生新的一隻 */
export function fusePets(s: GameState, a: Unit, b: Unit): { unit: Unit; preview: FusionPreview } | null {
  const p = fusionPreview(s, a, b);
  if (!p || !spendGold(s, p.cost)) return null;
  const child = createUnit(p.species, p.level, 'pet');
  child.potential = p.potential;
  child.generation = Math.max(a.generation ?? 0, b.generation ?? 0) + 1;
  child.max = statsForUnit(child);
  child.hp = child.max.hp;
  child.mp = child.max.mp;
  removeUnit(s, a);
  removeUnit(s, b);
  pushPet(s, child);
  s.fusions = (s.fusions ?? 0) + 1;
  return { unit: child, preview: p };
}

// ─────────────────────────────────────────────────────────────
// 裝備強化 / 鑲嵌
// ─────────────────────────────────────────────────────────────
export function upgradeLevelOf(u: Unit, slot: EquipSlot): number {
  return Math.max(0, Math.min(MAX_UPGRADE, u.equipUp?.[slot] ?? 0));
}

export interface UpgradeCheck {
  ok: boolean;
  reason?: string;
  cost?: { gold: number; cores: number };
  material?: string;
  level: number;
}

export function canUpgrade(s: GameState, u: Unit, slot: EquipSlot): UpgradeCheck {
  const id = u.equip?.[slot];
  const item = id ? ITEMS[id] : undefined;
  const level = upgradeLevelOf(u, slot);
  if (!item || item.effect.type !== 'equip') return { ok: false, reason: '此欄位尚未裝備', level };
  if (level >= MAX_UPGRADE) return { ok: false, reason: '已達最高強化等級', level };
  const cost = upgradeCost(level + 1);
  const material = level + 1 >= 8 ? 'star_core' : 'stardust_core';
  if (s.gold < cost.gold) return { ok: false, reason: '金幣不足', cost, material, level };
  if (itemCount(s, material) < cost.cores) {
    return { ok: false, reason: `${ITEMS[material]?.name ?? material}不足`, cost, material, level };
  }
  return { ok: true, cost, material, level };
}

export function upgradeEquip(s: GameState, u: Unit, slot: EquipSlot): boolean {
  const c = canUpgrade(s, u, slot);
  if (!c.ok || !c.cost || !c.material) return false;
  if (!spendGold(s, c.cost.gold)) return false;
  if (!removeItem(s, c.material, c.cost.cores)) {
    addGold(s, c.cost.gold);
    return false;
  }
  u.equipUp = u.equipUp ?? {};
  u.equipUp[slot] = c.level + 1;
  s.upgrades = (s.upgrades ?? 0) + 1;
  recalc(u);
  return true;
}

export function gemSlots(u: Unit, slot: EquipSlot): (string | null)[] {
  const g = u.gems?.[slot] ?? [];
  const out: (string | null)[] = [];
  for (let i = 0; i < MAX_SOCKETS; i++) out.push(g[i] ?? null);
  return out;
}

export function canSocket(u: Unit, slot: EquipSlot): boolean {
  const id = u.equip?.[slot];
  const item = id ? ITEMS[id] : undefined;
  if (!item || item.effect.type !== 'equip') return false;
  return (u.gems?.[slot] ?? []).length < MAX_SOCKETS;
}

export function socketGem(s: GameState, u: Unit, slot: EquipSlot, gemId: string): boolean {
  const def = ITEMS[gemId];
  if (!def || def.effect.type !== 'gem') return false;
  if (!canSocket(u, slot)) return false;
  if (!removeItem(s, gemId, 1)) return false;
  u.gems = u.gems ?? {};
  u.gems[slot] = [...(u.gems[slot] ?? []), gemId];
  s.gemsSocketed = (s.gemsSocketed ?? 0) + 1;
  recalc(u);
  return true;
}

/** 取下第 index 顆寶石並退回背包 */
export function removeGem(s: GameState, u: Unit, slot: EquipSlot, index: number): boolean {
  const cur = u.gems?.[slot];
  if (!cur || index < 0 || index >= cur.length) return false;
  const gem = cur.splice(index, 1)[0];
  addItem(s, gem, 1);
  if (cur.length === 0 && u.gems) delete u.gems[slot];
  recalc(u);
  return true;
}

/** 某欄位目前鑲嵌的寶石（含效果） */
export function socketedGems(u: Unit, slot: EquipSlot) {
  return gemsOf(u, slot);
}

// ─────────────────────────────────────────────────────────────
// 成就
// ─────────────────────────────────────────────────────────────
export function unlockedCount(s: GameState): number {
  return Object.keys(s.achievements ?? {}).length;
}

/** 檢查並發放所有已達成但未領取的成就，回傳本次新解鎖的成就 */
export function grantAchievements(s: GameState): AchievementDef[] {
  s.achievements = s.achievements ?? {};
  const got: AchievementDef[] = [];
  for (let pass = 0; pass < 4; pass++) {
    let any = false;
    for (const a of ACHIEVEMENTS) {
      if (s.achievements[a.id]) continue;
      let ok = false;
      try {
        ok = a.check(s);
      } catch {
        ok = false;
      }
      if (!ok) continue;
      s.achievements[a.id] = Date.now();
      if (a.gold) addGold(s, a.gold);
      for (const it of a.items ?? []) addItem(s, it.id, it.n);
      if (a.exp) for (const u of [...s.party, ...s.storage]) giveExp(s, u, a.exp);
      got.push(a);
      any = true;
    }
    if (!any) break;
  }
  return got;
}

// ─────────────────────────────────────────────────────────────
// 圖鑑收集獎勵
// ─────────────────────────────────────────────────────────────
export function dexCollected(s: GameState): number {
  return Object.keys(s.dex).filter((k) => SPECIES[k]).length;
}

/** 領取所有已達成的圖鑑獎勵，回傳獎勵說明 */
export function claimDexRewards(s: GameState): string[] {
  const collected = dexCollected(s);
  s.dexRewards = s.dexRewards ?? [];
  const out: string[] = [];
  for (const r of DEX_REWARDS) {
    if (collected < r.count || s.dexRewards.includes(r.id)) continue;
    s.dexRewards.push(r.id);
    const parts: string[] = [];
    if (r.gold) {
      addGold(s, r.gold);
      parts.push(`${r.gold} G`);
    }
    for (const it of r.items ?? []) {
      addItem(s, it.id, it.n);
      parts.push(`${ITEMS[it.id]?.name ?? it.id} ×${it.n}`);
    }
    if (r.exp) {
      for (const u of [...s.party, ...s.storage]) giveExp(s, u, r.exp);
      parts.push(`${r.exp} 經驗值`);
    }
    out.push(`圖鑑 ${r.count} 種 → ${parts.join('、')}`);
  }
  return out;
}

export interface LevelUpInfo {
  unit: Unit;
  from: number;
  to: number;
  learned: string[];
  /** 進化後的種族名稱（若有） */
  evolvedTo?: string;
}

/** 給予經驗值，處理升級與進化。回傳升級資訊。 */
export function giveExp(s: GameState, unit: Unit, amount: number): LevelUpInfo | null {
  if (unit.hp <= 0) amount = Math.floor(amount * 0.5);
  unit.exp += amount;
  const from = unit.level;
  const learned: string[] = [];
  let evolvedTo: string | undefined;
  let guard = 0;
  while (unit.exp >= expToNext(unit.level) && unit.level < RULES.maxLevel && guard++ < 100) {
    unit.exp -= expToNext(unit.level);
    const before = new Set(unit.skills);
    unit.level++;
    recalc(unit);
    unit.hp = unit.max.hp;
    unit.mp = unit.max.mp;
    for (const sk of unit.skills) if (!before.has(sk)) learned.push(sk);

    // 進化判定
    const sp = SPECIES[unit.speciesId];
    if (sp) {
      const target = autoEvolution(unit, s.flags);
      if (target && SPECIES[target]) {
        if (evolveUnit(unit, target)) {
          s.dex[target] = true;
          s.evolutions = (s.evolutions ?? 0) + 1;
          evolvedTo = SPECIES[target].name;
          for (const sk of unit.skills) if (!before.has(sk) && !learned.includes(sk)) learned.push(sk);
        }
      }
    }
  }
  if (unit.level !== from || evolvedTo) {
    return { unit, from, to: unit.level, learned, evolvedTo };
  }
  return null;
}

export function pointerDepth() {
  return 0;
}

// ─────────────────────────────────────────────────────────────
// 存檔（多欄位）
// ─────────────────────────────────────────────────────────────
const LEGACY_KEY = 'stardust-beasts-save-v1';

/** 讀取原始存檔字串（含舊版單一存檔的遷移） */
function readRaw(slot: number): string | null {
  try {
    if (slot === 1) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && !localStorage.getItem(slotKey(1))) {
        localStorage.setItem(slotKey(1), legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
    }
    return localStorage.getItem(slotKey(slot));
  } catch {
    return null;
  }
}

export interface SaveMeta {
  slot: number;
  exists: boolean;
  name?: string;
  level?: number;
  playTime?: number;
  mapId?: string;
  gold?: number;
  dexCount?: number;
  savedAt?: number;
}

export function saveGame(s: GameState, slot?: number): boolean {
  const n = Math.max(1, Math.min(SAVE_SLOTS, Math.floor(slot ?? s.slot ?? 1) || 1));
  try {
    s.slot = n;
    s.savedAt = Date.now();
    localStorage.setItem(slotKey(n), JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** 正規化舊存檔缺漏的欄位 */
function normalize(s: GameState): GameState {
  s.flags = s.flags ?? {};
  s.dex = s.dex ?? {};
  s.storage = s.storage ?? [];
  s.inventory = s.inventory ?? {};
  s.lastTown = s.lastTown ?? 'village';
  s.questTaken = s.questTaken ?? [];
  s.questProgress = s.questProgress ?? {};
  s.questClaimed = s.questClaimed ?? {};
  s.questClears = s.questClears ?? {};
  s.questsDone = Number(s.questsDone) || 0;
  s.dexRewards = Array.isArray(s.dexRewards) ? s.dexRewards : [];
  s.bounties = Array.isArray(s.bounties) ? s.bounties : [];
  s.bountyRound = Number(s.bountyRound) || 0;
  s.bountySeed = Number(s.bountySeed) || Math.floor(Math.random() * 0x7fffffff);
  s.bountiesDone = Number(s.bountiesDone) || 0;
  s.dailies = Array.isArray(s.dailies) ? s.dailies : [];
  s.dailyKey = s.dailyKey ?? '';
  s.dailyDone = Number(s.dailyDone) || 0;
  s.dailyStreak = Number(s.dailyStreak) || 0;
  s.dailyLastDoneKey = s.dailyLastDoneKey ?? '';
  s.fusions = Number(s.fusions) || 0;
  s.upgrades = Number(s.upgrades) || 0;
  s.gemsSocketed = Number(s.gemsSocketed) || 0;
  s.evolutions = Number(s.evolutions) || 0;
  s.achievements = s.achievements ?? {};
  s.goldEarned = Number(s.goldEarned) || s.gold || 0;
  s.slot = Number(s.slot) || 1;
  for (const u of [...s.party, ...s.storage]) {
    u.buffs = u.buffs ?? [];
    u.max = u.max ?? statAtLevel(SPECIES[u.speciesId], u.level);
    u.ailmentTurns = u.ailmentTurns ?? 0;
    u.equip = u.equip ?? {};
    u.equipUp = u.equipUp ?? {};
    u.gems = u.gems ?? {};
    u.potential = Number(u.potential) || 0;
    u.generation = Number(u.generation) || 0;
  }
  return s;
}

export function loadGame(slot = 1): GameState | null {
  try {
    const raw = readRaw(slot);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (!s || s.version !== 1 || !Array.isArray(s.party)) return null;
    s.slot = slot;
    normalize(s);
    // 後台調整種族數值後，讓舊存檔也套用新的能力值（保留 HP/MP 百分比）
    if (RULES.recalcOnLoad) {
      for (const u of [...s.party, ...s.storage]) {
        const sp = SPECIES[u.speciesId];
        if (!sp) continue;
        const next = statsForUnit(u);
        const hpRatio = u.max && u.max.hp > 0 ? u.hp / u.max.hp : 1;
        const mpRatio = u.max && u.max.mp > 0 ? u.mp / u.max.mp : 1;
        u.max = next;
        u.hp = Math.max(0, Math.min(next.hp, Math.round(next.hp * hpRatio)));
        u.mp = Math.max(0, Math.min(next.mp, Math.round(next.mp * mpRatio)));
        u.skills = skillsFor(sp, u.level);
        u.element = sp.element;
        u.sprite = {
          shape: sp.shape,
          c1: sp.c1,
          c2: sp.c2,
          size: sp.size,
          horns: sp.horns,
          wings: sp.wings
        };
      }
    }
    return s;
  } catch {
    return null;
  }
}

/** 讀取某欄位的存檔摘要（不載入整份存檔） */
export function saveMeta(slot: number): SaveMeta {
  const raw = readRaw(slot);
  if (!raw) return { slot, exists: false };
  try {
    const s = JSON.parse(raw) as GameState;
    let level = 0;
    for (const u of s.party ?? []) if (u.level > level) level = u.level;
    return {
      slot,
      exists: true,
      name: s.playerName,
      level,
      playTime: s.playTime,
      mapId: s.mapId,
      gold: s.gold,
      dexCount: Object.keys(s.dex ?? {}).filter((k) => SPECIES[k]).length,
      savedAt: s.savedAt
    };
  } catch {
    return { slot, exists: false };
  }
}

export function listSaves(): SaveMeta[] {
  const out: SaveMeta[] = [];
  for (let i = 1; i <= SAVE_SLOTS; i++) out.push(saveMeta(i));
  return out;
}

export function hasSave(slot = 1): boolean {
  return !!readRaw(slot);
}

export function anySave(): boolean {
  for (let i = 1; i <= SAVE_SLOTS; i++) if (readRaw(i)) return true;
  return false;
}

export function deleteSave(slot = 1) {
  try {
    localStorage.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
}
