import { SPECIES, ITEMS, expToNext, skillsFor, statAtLevel, createUnit, evolveUnit, evolutionTarget } from './data';
import { RULES } from './rules';
import type { Unit } from './types';

export interface GameState {
  version: number;
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
}

export const SAVE_KEY = 'stardust-beasts-save-v1';
export const MAX_PARTY = 4;

export function newGame(name = '旭'): GameState {
  const hero = createUnit('hero_asa', 1, 'hero', name);
  const starter = createUnit('dusthare', 2, 'pet');
  const s: GameState = {
    version: 1,
    playerName: name,
    mapId: 'village',
    px: 9,
    py: 11,
    facing: 2,
    party: [hero, starter],
    storage: [],
    inventory: { sealstone: 5, herb: 4, manadrop: 2 },
    gold: 250,
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
    questClears: {}
  };
  return s;
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
  const newMax = statAtLevel(sp, u.level);
  const hpRatio = u.max.hp > 0 ? u.hp / u.max.hp : 1;
  const mpRatio = u.max.mp > 0 ? u.mp / u.max.mp : 1;
  u.max = newMax;
  u.hp = Math.max(1, Math.round(newMax.hp * hpRatio));
  u.mp = Math.round(newMax.mp * mpRatio);
  u.skills = skillsFor(sp, u.level);
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
      const target = evolutionTarget(sp, unit.level);
      if (target && SPECIES[target]) {
        if (evolveUnit(unit, target)) {
          s.dex[target] = true;
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
export function saveGame(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (!s || s.version !== 1 || !Array.isArray(s.party)) return null;
    // 補齊欄位，避免舊存檔缺欄位
    s.flags = s.flags ?? {};
    s.dex = s.dex ?? {};
    s.storage = s.storage ?? [];
    s.inventory = s.inventory ?? {};
    s.lastTown = s.lastTown ?? 'village';
    s.questTaken = s.questTaken ?? [];
    s.questProgress = s.questProgress ?? {};
    s.questClaimed = s.questClaimed ?? {};
    s.questClears = s.questClears ?? {};
    for (const u of [...s.party, ...s.storage]) {
      u.buffs = u.buffs ?? [];
      u.max = u.max ?? statAtLevel(SPECIES[u.speciesId], u.level);
      u.ailmentTurns = u.ailmentTurns ?? 0;
    }
    // 後台調整種族數值後，讓舊存檔也套用新的能力值（保留 HP/MP 百分比）
    if (RULES.recalcOnLoad) {
      for (const u of [...s.party, ...s.storage]) {
        const sp = SPECIES[u.speciesId];
        if (!sp) continue;
        const next = statAtLevel(sp, u.level);
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

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
