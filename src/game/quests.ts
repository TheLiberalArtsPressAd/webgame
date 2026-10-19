/**
 * 委託板（支線委託）
 * 各城鎮的委託板可接取重複性委託，累積進度後回報換取報酬。
 * 進度掛在 GameState 上，並由戰鬥 / 抵達地圖等事件累積。
 */
import { ITEMS } from './data';
import { addItem, giveExp, itemCount, removeItem, type GameState } from './state';

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

export function isTaken(s: GameState, id: string): boolean {
  return s.questTaken.includes(id);
}

export function isClaimed(s: GameState, id: string): boolean {
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
    s.gold += q.reward.gold;
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
  return parts.join('、');
}

// ─────────────────────────────────────────────────────────────
// 事件掛鉤
// ─────────────────────────────────────────────────────────────
function bumpFor(s: GameState, kind: QuestDef['kind'], matches: (q: QuestDef) => number) {
  for (const id of [...s.questTaken]) {
    const q = questById(id);
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
    const q = questById(id);
    if (!q) return '';
    return `${q.title}（${questProgress(s, q)}/${q.count}）`;
  }).filter(Boolean);
}
