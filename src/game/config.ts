import { ITEMS, SKILLS, SPECIES, SPECIES_ORDER, type ItemDef } from './data';
import { MAPS, type EncounterEntry } from './maps';
import { SCRIPTED_BATTLES, SHOP_STOCK, type ScriptedBattle } from './story';
import { DEFAULT_RULES, RULES, type Rules } from './rules';
import type { SkillDef, SpeciesDef } from './types';

export const ADMIN_CONFIG_KEY = 'stardust-beasts-admin-v1';
export const CONFIG_VERSION = 1;

export interface EncounterConfig {
  rate: number;
  table: EncounterEntry[];
}

export interface GameConfig {
  version: number;
  updatedAt: number;
  /** 幻獸 / 劇情角色種族 */
  species: Record<string, SpeciesDef>;
  /** 技能 */
  skills: Record<string, SkillDef>;
  /** 道具（含售價） */
  items: Record<string, ItemDef>;
  /** 商店設定 */
  shops: {
    /** 商店販售的道具 id（依顯示順序） */
    stock: string[];
  };
  /** 各地圖的野外遇敵表（含原本沒有遇敵的地圖） */
  encounters: Record<string, EncounterConfig>;
  /** 劇情戰鬥 */
  battles: Record<string, ScriptedBattle>;
  /** 全域戰鬥 / 經濟公式 */
  rules: Rules;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceRecord<T>(target: Record<string, T>, next: Record<string, T>) {
  for (const key of Object.keys(target)) delete target[key];
  for (const [key, value] of Object.entries(next ?? {})) target[key] = clone(value);
}

/** 以目前程式內建資料建立一份完整預設設定 */
export function defaultConfig(): GameConfig {
  const encounters: Record<string, EncounterConfig> = {};
  for (const [id, map] of Object.entries(MAPS)) {
    encounters[id] = {
      rate: map.encounters?.rate ?? 0,
      table: clone(map.encounters?.table ?? [])
    };
  }
  return {
    version: CONFIG_VERSION,
    updatedAt: Date.now(),
    species: clone(SPECIES),
    skills: clone(SKILLS),
    items: clone(ITEMS),
    shops: { stock: [...SHOP_STOCK] },
    encounters,
    battles: clone(SCRIPTED_BATTLES),
    rules: clone(DEFAULT_RULES)
  };
}

export function normalizeConfig(config: GameConfig): GameConfig {
  config.version = CONFIG_VERSION;
  config.updatedAt = Number(config.updatedAt) || Date.now();
  config.species = config.species ?? {};
  config.skills = config.skills ?? {};
  config.items = config.items ?? {};
  config.shops = { stock: Array.isArray(config.shops?.stock) ? config.shops.stock : [] };
  config.encounters = config.encounters ?? {};
  config.battles = config.battles ?? {};
  config.rules = { ...DEFAULT_RULES, ...(config.rules ?? {}) };

  for (const [key, value] of Object.entries(config.species)) value.id = key;
  for (const [key, value] of Object.entries(config.skills)) value.id = key;
  for (const [key, value] of Object.entries(config.items)) value.id = key;
  for (const [key, value] of Object.entries(config.battles)) value.id = key;

  // 清掉指向不存在資料的參照，避免遊戲讀到壞資料
  for (const sp of Object.values(config.species)) {
    sp.skills = (sp.skills ?? []).filter((entry) => !!config.skills[entry.id]);
    if (sp.evolvesTo && !config.species[sp.evolvesTo.species]) sp.evolvesTo = undefined;
  }
  for (const item of Object.values(config.items)) {
    if (!item.effect || typeof item.effect !== 'object') item.effect = { type: 'none' };
  }
  config.shops.stock = config.shops.stock.filter((id) => !!config.items[id]);
  for (const encounter of Object.values(config.encounters)) {
    encounter.table = (encounter.table ?? []).filter((entry) => !!config.species[entry.species]);
  }
  for (const battle of Object.values(config.battles)) {
    battle.enemies = (battle.enemies ?? []).filter((entry) => !!config.species[entry.species]);
  }
  return config;
}

/** 讀取後台儲存的設定；沒有或格式錯誤時回傳 null */
export function loadStoredConfig(): GameConfig | null {
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    if (!parsed || typeof parsed !== 'object' || !parsed.species || !parsed.skills) return null;
    return normalizeConfig(parsed as GameConfig);
  } catch {
    return null;
  }
}

/** 讀取設定（無覆寫時提供預設值） */
export function loadConfig(): GameConfig {
  return loadStoredConfig() ?? defaultConfig();
}

/** 儲存設定到瀏覽器（與遊戲同源，重新整理遊戲後生效） */
export function saveConfig(config: GameConfig): boolean {
  try {
    config.updatedAt = Date.now();
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredConfig() {
  try {
    localStorage.removeItem(ADMIN_CONFIG_KEY);
  } catch {
    /* ignore */
  }
}

/** 把設定套用到遊戲執行中的資料表 */
export function applyConfig(config: GameConfig) {
  const cfg = normalizeConfig(clone(config));

  replaceRecord(SPECIES, cfg.species);
  replaceRecord(SKILLS, cfg.skills);
  replaceRecord(ITEMS, cfg.items);
  replaceRecord(SCRIPTED_BATTLES, cfg.battles);

  SPECIES_ORDER.splice(0, SPECIES_ORDER.length, ...Object.keys(SPECIES));

  Object.assign(RULES, DEFAULT_RULES, cfg.rules);

  for (const id of Object.keys(MAPS)) {
    const encounter = cfg.encounters[id];
    if (encounter && (encounter.rate > 0 || encounter.table.length > 0)) {
      MAPS[id].encounters = clone(encounter);
    } else {
      delete MAPS[id].encounters;
    }
  }

  const stock = cfg.shops.stock.filter((id) => !!ITEMS[id]);
  SHOP_STOCK.splice(0, SHOP_STOCK.length, ...stock);
}

/** 遊戲啟動時呼叫：有後台覆寫就套用 */
export function initGameConfig(): GameConfig | null {
  const config = loadStoredConfig();
  if (!config) {
    Object.assign(RULES, DEFAULT_RULES);
    return null;
  }
  applyConfig(config);
  return config;
}
