/**
 * 委託板（支線委託）
 * 各城鎮的委託板可接取重複性委託，累積進度後回報換取報酬。
 * 進度掛在 GameState 上，並由戰鬥 / 抵達地圖等事件累積。
 * 另有「討伐委託」：以存檔種子隨機產生，可按 R 換一批。
 */
import { ITEMS, SPECIES, itemName } from './data';
import { MAPS } from './maps';
import { addGold, addItem, giveExp, itemCount, removeItem, type GameState } from './state';

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  /** kill = 擊倒, catch = 封印, deliver = 繳交道具, reach = 抵達地圖 */
  kind: 'kill' | 'catch' | 'deliver' | 'reach';
  /** 目標：幻獸 id / 道具 id / 地圖 id */
  target: string;
  count: number;
  /** 可重複接取 */
  repeatable?: boolean;
  /** 需要先完成的 flag */
  requires?: string;
  reward: { gold?: number; items?: { id: string; n: number }[]; exp?: number };
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q_hare',
    title: '草原的野兔',
    desc: '把草原上數量失控的塵兔帶走。',
    kind: 'kill',
    target: 'dusthare',
    count: 3,
    repeatable: true,
    reward: { gold: 120, items: [{ id: 'herb', n: 2 }] }
  },
  {
    id: 'q_mouse',
    title: '星光鼠患',
    desc: '倉庫又被輝鼠咬破了，請協助驅除。',
    kind: 'kill',
    target: 'glimmermouse',
    count: 4,
    repeatable: true,
    reward: { gold: 150, items: [{ id: 'sealstone', n: 2 }] }
  },
  {
    id: 'q_stardust',
    title: '收集星塵',
    desc: '研究需要星塵碎片，越多越好。',
    kind: 'deliver',
    target: 'stardust',
    count: 3,
    repeatable: true,
    reward: { gold: 200, items: [{ id: 'manadrop', n: 2 }] }
  },
  {
    id: 'q_frog',
    title: '露水蛙觀察',
    desc: '想近距離觀察露水蛙的捕食方式，請替我抓一隻。',
    kind: 'catch',
    target: 'dewfrog',
    count: 1,
    requires: 'ch1_done',
    reward: { gold: 400, items: [{ id: 'ether', n: 1 }] }
  },
  {
    id: 'q_wolf',
    title: '驅逐影狼',
    desc: '古道上出現成群影狼，過往商隊無法通行。',
    kind: 'kill',
    target: 'shadowwolf',
    count: 5,
    repeatable: true,
    requires: 'ch1_done',
    reward: { gold: 350, items: [{ id: 'herb_hi', n: 3 }] }
  },
  {
    id: 'q_snow',
    title: '雪原巡邏',
    desc: '請協助驅離靠近村口的雪犬。',
    kind: 'kill',
    target: 'snowpup',
    count: 4,
    repeatable: true,
    requires: 'ch2_mid',
    reward: { gold: 400, items: [{ id: 'manadrop', n: 3 }] }
  },
  {
    id: 'q_reach_ice',
    title: '洞窟的路線',
    desc: '替我們確認冰晶洞窟的入口是否安全。',
    kind: 'reach',
    target: 'icecave',
    count: 1,
    requires: 'ch2_mid',
    reward: { gold: 600, items: [{ id: 'stone_icebind', n: 1 }] }
  },
  {
    id: 'q_dune',
    title: '沙原護衛',
    desc: '商隊要穿越流金沙原，需要有人先清理沙丘豺。',
    kind: 'kill',
    target: 'dunejackal',
    count: 3,
    repeatable: true,
    requires: 'ch3_mid',
    reward: { gold: 500, items: [{ id: 'bomb_hi', n: 2 }] }
  },
  {
    id: 'q_catch_mirage',
    title: '幻影貓觀察',
    desc: '幻影貓的熱氣折射之謎，需要活體樣本。',
    kind: 'catch',
    target: 'miragecat',
    count: 1,
    requires: 'ch3_mid',
    reward: { gold: 700, items: [{ id: 'stone_warcry', n: 1 }] }
  },
  {
    id: 'q_crystal',
    title: '晶石研究',
    desc: '收集高純度的星輝結晶，我要做實驗。',
    kind: 'deliver',
    target: 'stardust_hi',
    count: 1,
    requires: 'ch3_mid',
    reward: { gold: 800, items: [{ id: 'stone_rend', n: 1 }] }
  },
  {
    id: 'q_reach_sky',
    title: '星穹的路標',
    desc: '請替我們確認通往星穹神殿的路還在。',
    kind: 'reach',
    target: 'skytemple',
    count: 1,
    requires: 'ch3_boss',
    reward: { gold: 900, items: [{ id: 'stone_regen', n: 1 }] }
  },
  {
    id: 'q_abyss',
    title: '深淵的腳步',
    desc: '風空港下方出現了裂縫，請查明通往何處。',
    kind: 'reach',
    target: 'abyssgate',
    count: 1,
    requires: 'ended',
    reward: { gold: 1200, items: [{ id: 'stone_aegis', n: 1 }] }
  },
  {
    id: 'q_catch_shade',
    title: '影犬樣本',
    desc: '想研究影犬為何能讓傷口無法癒合。',
    kind: 'catch',
    target: 'shadehound',
    count: 2,
    repeatable: true,
    requires: 'abyss_enter',
    reward: { gold: 1500, items: [{ id: 'elixir', n: 2 }] }
  },
  {
    id: 'q_void',
    title: '虛無的證明',
    desc: '若你真的走到了迴廊深處，帶點證據回來。',
    kind: 'deliver',
    target: 'stardust_hi',
    count: 3,
    requires: 'abyss_mid',
    reward: { gold: 3000, items: [{ id: 'stone_stardeath', n: 1 }], exp: 1200 }
  }
];

export function questById(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

/** 解析委託：先找每日 / 隨機委託，再找固定委託 */
export function resolveQuest(s: GameState, id: string): QuestDef | undefined {
  return (
    s.dailies?.find((q) => q.id === id) ??
    s.bounties?.find((q) => q.id === id) ??
    questById(id)
  );
}

/** 委託板顯示的完整清單（固定 + 每日 + 隨機） */
export function allQuests(s: GameState): QuestDef[] {
  return [...QUESTS, ...(s.dailies ?? []), ...(s.bounties ?? [])];
}

export function isDaily(q: QuestDef): boolean {
  return q.id.startsWith('day_');
}

export function isBounty(q: QuestDef): boolean {
  return q.id.startsWith('rnd');
}

// ─────────────────────────────────────────────────────────────
// 隨機委託（討伐委託板）
// ─────────────────────────────────────────────────────────────
export const BOUNTY_COUNT = 3;

/** 決定性亂數（同一存檔 + 同一批號 → 同一組委託） */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DELIVER_POOL = ['herb', 'herb_hi', 'herb_max', 'manadrop', 'ether', 'ether_hi', 'stardust', 'stardust_hi', 'antidote'];

const EQUIP_TIERS: string[][] = [
  ['armor_leather', 'weapon_iron', 'acc_swift'],
  ['weapon_staff', 'armor_scale', 'acc_vital', 'acc_ward'],
  ['weapon_claw', 'armor_robe', 'acc_orb'],
  ['weapon_abyss', 'armor_abyss', 'acc_crown', 'acc_abyss']
];

function bountyPools() {
  const species = Object.values(SPECIES)
    .filter((sp) => sp.catchRate > 0 && !sp.id.startsWith('hero_'))
    .map((sp) => sp.id);
  const maps = Object.keys(MAPS).filter((id) => !!MAPS[id].encounters);
  const items = DELIVER_POOL.filter((id) => !!ITEMS[id]);
  return { species, maps, items };
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

/** 產生一批隨機委託（不動到狀態） */
export function generateBounties(seed: number, round: number): QuestDef[] {
  const rng = mulberry32(seed + round * 977 + 13);
  const { species, maps, items } = bountyPools();
  const kinds: QuestDef['kind'][] = ['kill', 'kill', 'catch', 'deliver', 'reach'];
  // 洗牌
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const tier = Math.min(EQUIP_TIERS.length - 1, Math.floor(round / 3));
  const out: QuestDef[] = [];
  for (let i = 0; i < BOUNTY_COUNT; i++) {
    const kind = kinds[i % kinds.length];
    const count = Math.min(8, 2 + Math.floor(round / 2) + (kind === 'deliver' || kind === 'reach' ? 0 : 1));
    const gold = Math.round((200 + round * 110) * (kind === 'deliver' || kind === 'reach' ? 1.2 : 1));
    const reward: QuestDef['reward'] = { gold, exp: 60 + round * 70 };
    // 依批號提供裝備
    if (rng() < 0.6 && EQUIP_TIERS[tier].length) {
      reward.items = [{ id: pick(rng, EQUIP_TIERS[tier]), n: 1 }];
    }
    let q: QuestDef;
    if (kind === 'kill' && species.length) {
      const target = pick(rng, species);
      q = {
        id: `rnd${round}_${i}`,
        title: `${SPECIES[target].name} 討伐`,
        desc: `討伐 ${count} 隻 ${SPECIES[target].name}，維護旅人安全。`,
        kind: 'kill',
        target,
        count,
        reward
      };
    } else if (kind === 'catch' && species.length) {
      const target = pick(rng, species);
      q = {
        id: `rnd${round}_${i}`,
        title: `${SPECIES[target].name} 捕獲委託`,
        desc: `活體研究需要 ${SPECIES[target].name}，請以封印石捕捉 ${count} 隻。`,
        kind: 'catch',
        target,
        count,
        reward
      };
    } else if (kind === 'deliver' && items.length) {
      const target = pick(rng, items);
      q = {
        id: `rnd${round}_${i}`,
        title: `${itemName(target)} 徵集`,
        desc: `徵集 ${itemName(target)} ×${count}，供港口的旅人使用。`,
        kind: 'deliver',
        target,
        count,
        reward
      };
    } else if (maps.length) {
      const target = pick(rng, maps);
      q = {
        id: `rnd${round}_${i}`,
        title: `踏查 ${MAPS[target].name}`,
        desc: `前往 ${MAPS[target].name} 確認路況，並回報。`,
        kind: 'reach',
        target,
        count: 1,
        reward
      };
    } else {
      const target = pick(rng, species.length ? species : ['dusthare']);
      q = {
        id: `rnd${round}_${i}`,
        title: `${SPECIES[target]?.name ?? target} 討伐`,
        desc: '討伐指定的幻獸。',
        kind: 'kill',
        target,
        count,
        reward
      };
    }
    out.push(q);
  }
  return out;
}

/** 若目前沒有隨機委託則產生一批 */
export function ensureBounties(s: GameState) {
  if (!Array.isArray(s.bounties) || s.bounties.length === 0) {
    s.bounties = generateBounties(s.bountySeed ?? 0, s.bountyRound ?? 0);
  }
}

/** 換一批隨機委託（清除舊批次的進度） */
export function rerollBounties(s: GameState): number {
  for (const old of s.bounties ?? []) {
    delete s.questProgress[old.id];
    delete s.questClaimed[old.id];
    delete s.questClears[old.id];
    s.questTaken = s.questTaken.filter((x) => x !== old.id);
  }
  s.bountyRound = (s.bountyRound ?? 0) + 1;
  s.bounties = generateBounties(s.bountySeed ?? 0, s.bountyRound);
  return s.bountyRound;
}

// ─────────────────────────────────────────────────────────────
// 每日委託（依本地日期每天更新）
// ─────────────────────────────────────────────────────────────
export const DAILY_COUNT = 3;

/** 本地日期字串 YYYY-MM-DD */
export function dailyKeyOf(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 產生指定日期的每日委託（同一天固定同一批） */
export function generateDailies(key: string): QuestDef[] {
  const rng = mulberry32(dateSeed(key));
  const { species, maps, items } = bountyPools();
  const kinds: QuestDef['kind'][] = ['kill', 'catch', 'deliver', 'reach'];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const out: QuestDef[] = [];
  for (let i = 0; i < DAILY_COUNT; i++) {
    const kind = kinds[i % kinds.length];
    const reward: QuestDef['reward'] = {
      gold: 400 + i * 150,
      exp: 160 + i * 70,
      items: [{ id: i >= 2 ? 'star_core' : 'stardust_core', n: 1 }]
    };
    const id = `day_${key}_${i}`;
    if (kind === 'kill' && species.length) {
      const target = pick(rng, species);
      out.push({
        id,
        title: `【每日】${SPECIES[target].name} 討伐`,
        desc: `討伐 ${SPECIES[target].name} ×3，維持道路安全。`,
        kind: 'kill',
        target,
        count: 3,
        reward
      });
    } else if (kind === 'catch' && species.length) {
      const target = pick(rng, species);
      out.push({
        id,
        title: `【每日】${SPECIES[target].name} 捕獲`,
        desc: `以封印石捕捉 ${SPECIES[target].name} ×1，供研究使用。`,
        kind: 'catch',
        target,
        count: 1,
        reward
      });
    } else if (kind === 'deliver' && items.length) {
      const target = pick(rng, items);
      out.push({
        id,
        title: `【每日】${itemName(target)} 徵集`,
        desc: `徵集 ${itemName(target)} ×2，供旅人補給。`,
        kind: 'deliver',
        target,
        count: 2,
        reward
      });
    } else if (maps.length) {
      const target = pick(rng, maps);
      out.push({
        id,
        title: `【每日】踏查 ${MAPS[target].name}`,
        desc: `前往 ${MAPS[target].name} 確認路況並回報。`,
        kind: 'reach',
        target,
        count: 1,
        reward
      });
    } else {
      const target = species.length ? pick(rng, species) : 'dusthare';
      out.push({
        id,
        title: `【每日】${SPECIES[target]?.name ?? target} 討伐`,
        desc: '討伐指定的幻獸。',
        kind: 'kill',
        target,
        count: 3,
        reward
      });
    }
  }
  return out;
}

/** 跨日時更新每日委託（保留連續完成天數） */
export function ensureDailies(s: GameState): boolean {
  const key = dailyKeyOf();
  if (s.dailyKey === key && Array.isArray(s.dailies) && s.dailies.length > 0) return false;
  const prune = (rec: Record<string, unknown>) => {
    for (const k of Object.keys(rec)) if (k.startsWith('day_')) delete rec[k];
  };
  prune(s.questProgress as unknown as Record<string, unknown>);
  prune(s.questClaimed as unknown as Record<string, unknown>);
  prune(s.questClears as unknown as Record<string, unknown>);
  s.questTaken = (s.questTaken ?? []).filter((x) => !x.startsWith('day_'));
  s.dailies = generateDailies(key);
  s.dailyKey = key;
  s.dailyDone = 0;
  return true;
}

/** 今日每日委託完成情況 */
export function dailyState(s: GameState): { total: number; done: number; streak: number } {
  return { total: (s.dailies ?? []).length, done: s.dailyDone ?? 0, streak: s.dailyStreak ?? 0 };
}

export function isTaken(s: GameState, id: string): boolean {
  return s.questTaken.includes(id);
}export function isClaimed(s: GameState, id: string): boolean {
  return !!s.questClaimed[id];
}

/** 目前進度（deliver 以持有數量即時計算） */
export function questProgress(s: GameState, q: QuestDef): number {
  if (q.kind === 'deliver') return Math.min(q.count, itemCount(s, q.target));
  return Math.min(q.count, s.questProgress[q.id] ?? 0);
}

export function isComplete(s: GameState, q: QuestDef): boolean {
  return questProgress(s, q) >= q.count;
}

/** 是否可以接取 */
export function canTake(s: GameState, q: QuestDef): boolean {
  if (isTaken(s, q.id)) return false;
  if (q.requires && !s.flags[q.requires]) return false;
  if (q.repeatable) return true;
  return !isClaimed(s, q.id);
}

/** 委託是否已全部完成（顯示用） */
export function isFinished(s: GameState, q: QuestDef): boolean {
  return !q.repeatable && isClaimed(s, q.id);
}

export function takeQuest(s: GameState, q: QuestDef) {
  if (isTaken(s, q.id)) return;
  s.questTaken.push(q.id);
  if (s.questProgress[q.id] === undefined) s.questProgress[q.id] = 0;
}

export function abandonQuest(s: GameState, id: string) {
  s.questTaken = s.questTaken.filter((x) => x !== id);
}

/** 回報委託。成功回傳報酬說明，失敗回傳 null。 */
export function claimQuest(s: GameState, q: QuestDef): string | null {
  if (!isTaken(s, q.id)) return null;
  if (!isComplete(s, q)) return null;
  if (q.kind === 'deliver' && !removeItem(s, q.target, q.count)) return null;

  const parts: string[] = [];
  if (q.reward.gold) {
    addGold(s, q.reward.gold);
    parts.push(`${q.reward.gold} G`);
  }
  for (const it of q.reward.items ?? []) {
    addItem(s, it.id, it.n);
    parts.push(`${ITEMS[it.id]?.name ?? it.id} ×${it.n}`);
  }
  if (q.reward.exp) {
    for (const u of [...s.party, ...s.storage]) giveExp(s, u, q.reward.exp);
    parts.push(`${q.reward.exp} 經驗值`);
  }

  s.questTaken = s.questTaken.filter((x) => x !== q.id);
  s.questProgress[q.id] = 0;
  if (q.repeatable) s.questClears[q.id] = (s.questClears[q.id] ?? 0) + 1;
  else s.questClaimed[q.id] = true;

  s.questsDone = (s.questsDone ?? 0) + 1;
  if (isBounty(q)) s.bountiesDone = (s.bountiesDone ?? 0) + 1;
  if (isDaily(q)) {
    s.dailyDone = (s.dailyDone ?? 0) + 1;
    // 完成當日全部每日委託 → 連續天數
    if (s.dailies.length > 0 && s.dailyDone >= s.dailies.length) {
      const yesterday = dailyKeyOf(new Date(Date.now() - 86400000));
      s.dailyStreak = s.dailyLastDoneKey === yesterday ? (s.dailyStreak ?? 0) + 1 : 1;
      s.dailyLastDoneKey = s.dailyKey;
      parts.push(`每日全勤！連續 ${s.dailyStreak} 天`);
    }
  }
  return parts.join('、');
}

// ─────────────────────────────────────────────────────────────
// 事件掛鉤
// ─────────────────────────────────────────────────────────────
function bumpFor(s: GameState, kind: QuestDef['kind'], matches: (q: QuestDef) => number) {
  for (const id of [...s.questTaken]) {
    const q = resolveQuest(s, id);
    if (!q || q.kind !== kind) continue;
    const n = matches(q);
    if (n > 0) s.questProgress[q.id] = Math.min(q.count, (s.questProgress[q.id] ?? 0) + n);
  }
}

/** 戰鬥勝利：計算擊倒數量 */
export function questOnWin(s: GameState, speciesIds: string[]) {
  bumpFor(s, 'kill', (q) => speciesIds.filter((x) => x === q.target).length);
}

/** 成功封印 */
export function questOnCapture(s: GameState, speciesId: string) {
  bumpFor(s, 'catch', (q) => (q.target === speciesId ? 1 : 0));
}

/** 抵達地圖 */
export function questOnArrive(s: GameState, mapId: string) {
  bumpFor(s, 'reach', (q) => (q.target === mapId ? 1 : 0));
}

/** 進行中的委託（供任務提示用） */
export function activeQuestSummary(s: GameState): string[] {
  return s.questTaken.map((id) => {
    const q = resolveQuest(s, id);
    if (!q) return '';
    return `${q.title}（${questProgress(s, q)}/${q.count}）`;
  }).filter(Boolean);
}
