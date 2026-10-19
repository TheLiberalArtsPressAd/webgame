/**
 * 成就係統
 * 純資料 + 判定函式；實際發獎在 state.ts 的 grantAchievements()
 * （避免 achievements → state → achievements 的執行期循環依賴）。
 * 判定條件只讀取 GameState 欄位，因此只匯入型別。
 */
import { SPECIES } from './data';
import type { GameState } from './state';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** 隱藏成就：未解鎖前只顯示「？？？」 */
  hidden?: boolean;
  /** 解鎖獎勵 */
  gold?: number;
  items?: { id: string; n: number }[];
  exp?: number;
  check: (s: GameState) => boolean;
}

/** 圖鑑登錄數 */
function dexCount(s: GameState): number {
  return Object.keys(s.dex ?? {}).filter((k) => SPECIES[k]).length;
}

/** 隊伍與待命中的最高等級 */
function maxUnitLevel(s: GameState): number {
  let m = 0;
  for (const u of [...s.party, ...s.storage]) if (u.level > m) m = u.level;
  return m;
}

/** 是否已取得任一隱藏種族 */
function hasHiddenSpecies(s: GameState): boolean {
  return Object.keys(s.dex ?? {}).some((id) => SPECIES[id]?.hidden);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 戰鬥
  { id: 'a_battle1', name: '初次交手', desc: '贏得第一場戰鬥。', gold: 100, check: (s) => s.battlesWon >= 1 },
  { id: 'a_battle10', name: '漸入佳境', desc: '戰鬥勝利 10 次。', gold: 300, check: (s) => s.battlesWon >= 10 },
  { id: 'a_battle50', name: '身經百戰', desc: '戰鬥勝利 50 次。', gold: 1200, check: (s) => s.battlesWon >= 50 },
  { id: 'a_battle100', name: '百戰之軀', desc: '戰鬥勝利 100 次。', gold: 3000, items: [{ id: 'star_core', n: 2 }], check: (s) => s.battlesWon >= 100 },
  { id: 'a_battle250', name: '不敗傳說', desc: '戰鬥勝利 250 次。', gold: 12000, items: [{ id: 'gem_nova', n: 1 }], check: (s) => s.battlesWon >= 250 },
  // 封印
  { id: 'a_cap5', name: '初識夥伴', desc: '成功封印 5 隻幻獸。', items: [{ id: 'sealstone', n: 5 }], check: (s) => s.captured >= 5 },
  { id: 'a_cap20', name: '幻獸獵人', desc: '成功封印 20 隻幻獸。', gold: 800, check: (s) => s.captured >= 20 },
  { id: 'a_cap50', name: '幻獸大師', desc: '成功封印 50 隻幻獸。', gold: 2500, items: [{ id: 'gem_power', n: 1 }], check: (s) => s.captured >= 50 },
  { id: 'a_cap100', name: '萬獸之主', desc: '成功封印 100 隻幻獸。', gold: 10000, items: [{ id: 'gem_astral', n: 1 }], check: (s) => s.captured >= 100 },
  // 圖鑑
  { id: 'a_dex20', name: '圖鑑新頁', desc: '圖鑑登錄 20 種。', gold: 500, check: (s) => dexCount(s) >= 20 },
  { id: 'a_dex40', name: '圖鑑半滿', desc: '圖鑑登錄 40 種。', gold: 1500, check: (s) => dexCount(s) >= 40 },
  { id: 'a_dex59', name: '圖鑑大成', desc: '圖鑑登錄 59 種。', gold: 10000, items: [{ id: 'acc_abyss', n: 1 }], check: (s) => dexCount(s) >= 59 },
  { id: 'a_dex77', name: '圖鑑全滿', desc: '圖鑑登錄全部 77 種。', gold: 20000, exp: 5000, items: [{ id: 'star_core', n: 5 }], check: (s) => dexCount(s) >= 77 },
  // 等級
  { id: 'a_lv20', name: '站穩腳步', desc: '任一幻獸達到 Lv20。', gold: 400, check: (s) => maxUnitLevel(s) >= 20 },
  { id: 'a_lv40', name: '歷練成材', desc: '任一幻獸達到 Lv40。', gold: 1500, check: (s) => maxUnitLevel(s) >= 40 },
  { id: 'a_lv60', name: '極限突破', desc: '任一幻獸達到 Lv60。', gold: 4000, check: (s) => maxUnitLevel(s) >= 60 },
  { id: 'a_lv80', name: '登峰造極', desc: '任一幻獸達到 Lv80。', gold: 12000, items: [{ id: 'star_core', n: 3 }], check: (s) => maxUnitLevel(s) >= 80 },
  // 資產
  { id: 'a_gold5k', name: '小有積蓄', desc: '累計獲得 5,000 金幣。', gold: 500, check: (s) => (s.goldEarned ?? 0) >= 5000 },
  { id: 'a_gold30k', name: '富甲一方', desc: '累計獲得 30,000 金幣。', gold: 3000, check: (s) => (s.goldEarned ?? 0) >= 30000 },
  { id: 'a_gold100k', name: '富可敵國', desc: '累計獲得 100,000 金幣。', gold: 15000, items: [{ id: 'star_core', n: 5 }], check: (s) => (s.goldEarned ?? 0) >= 100000 },
  // 合成 / 育種
  { id: 'a_fuse1', name: '初次合成', desc: '第一次完成幻獸合成。', items: [{ id: 'stardust_core', n: 3 }], check: (s) => (s.fusions ?? 0) >= 1 },
  { id: 'a_fuse10', name: '育種家', desc: '完成 10 次幻獸合成。', gold: 1500, items: [{ id: 'star_core', n: 2 }], check: (s) => (s.fusions ?? 0) >= 10 },
  { id: 'a_fuse25', name: '星海育種師', desc: '完成 25 次幻獸合成。', gold: 6000, items: [{ id: 'star_core', n: 4 }], check: (s) => (s.fusions ?? 0) >= 25 },
  {
    id: 'a_pot50',
    name: '完美潛能',
    desc: '培育出潛能 50 的幻獸。',
    gold: 3000,
    items: [{ id: 'gem_element', n: 1 }],
    check: (s) => [...s.party, ...s.storage].some((u) => (u.potential ?? 0) >= 50)
  },
  // 強化 / 鑲嵌
  { id: 'a_up10', name: '鍛造入門', desc: '強化裝備 10 次。', items: [{ id: 'stardust_core', n: 3 }], check: (s) => (s.upgrades ?? 0) >= 10 },
  { id: 'a_up50', name: '一代名匠', desc: '強化裝備 50 次。', gold: 2000, items: [{ id: 'star_core', n: 3 }], check: (s) => (s.upgrades ?? 0) >= 50 },
  { id: 'a_up100', name: '星海宗師', desc: '強化裝備 100 次。', gold: 8000, items: [{ id: 'star_core', n: 5 }], check: (s) => (s.upgrades ?? 0) >= 100 },
  { id: 'a_gem10', name: '鑲嵌師', desc: '鑲嵌寶石 10 次。', gold: 1200, check: (s) => (s.gemsSocketed ?? 0) >= 10 },
  { id: 'a_gem30', name: '珠寶大匠', desc: '鑲嵌寶石 30 次。', gold: 5000, items: [{ id: 'gem_bulwark', n: 1 }], check: (s) => (s.gemsSocketed ?? 0) >= 30 },
  // 進化 / 隱藏血脈
  { id: 'a_evo1', name: '蛻變', desc: '完成第一次進化。', gold: 300, check: (s) => (s.evolutions ?? 0) >= 1 },
  { id: 'a_evo10', name: '幻化自如', desc: '完成 10 次進化。', gold: 4000, items: [{ id: 'gem_quick', n: 1 }], check: (s) => (s.evolutions ?? 0) >= 10 },
  {
    id: 'a_hidden',
    name: '隱藏血脈',
    desc: '取得任一隱藏種族。',
    gold: 2500,
    items: [{ id: 'star_core', n: 2 }],
    hidden: true,
    check: (s) => hasHiddenSpecies(s)
  },
  // 委託 / 每日 / 討伐
  { id: 'a_quest10', name: '委託達人', desc: '完成 10 件委託。', gold: 800, check: (s) => (s.questsDone ?? 0) >= 10 },
  { id: 'a_daily7', name: '七日勤勉', desc: '連續 7 天完成當日全部委託。', gold: 2000, check: (s) => (s.dailyStreak ?? 0) >= 7 },
  { id: 'a_daily30', name: '月度星辰', desc: '連續 30 天完成當日全部委託。', gold: 12000, items: [{ id: 'star_core', n: 5 }], check: (s) => (s.dailyStreak ?? 0) >= 30 },
  { id: 'a_bounty5', name: '賞金獵人', desc: '完成 5 件討伐委託。', gold: 1000, check: (s) => (s.bountiesDone ?? 0) >= 5 },
  {
    id: 'a_elemental',
    name: '四元素之證',
    desc: '取得四種屬性的隱藏種族各一。',
    gold: 8000,
    items: [{ id: 'gem_element', n: 2 }],
    hidden: true,
    check: (s) =>
      ['sunwyrm', 'tidematron', 'aerielord', 'geoavatar'].every((id) => !!s.dex?.[id])
  },
  {
    id: 'a_starmother',
    name: '接住光的地方',
    desc: '培育出星海之主。',
    gold: 15000,
    exp: 3000,
    items: [{ id: 'star_core', n: 8 }],
    hidden: true,
    check: (s) => !!s.dex?.['starmother']
  },
  // 劇情
  { id: 'a_ending', name: '星海之聲', desc: '見證真正的結局。', gold: 5000, exp: 1000, hidden: true, check: (s) => !!s.flags['true_ended'] },
  {
    id: 'a_star_ended',
    name: '星海的願望',
    desc: '完成星海之願的旅程。',
    gold: 20000,
    exp: 5000,
    items: [{ id: 'star_core', n: 10 }],
    hidden: true,
    check: (s) => !!s.flags['star_ended']
  }
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
