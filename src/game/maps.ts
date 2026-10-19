// 地圖定義（以字元網格描述，易讀易改）
export interface TileDef {
  ch: string;
  name: string;
  walk: boolean;
  top: string;
  side: string;
  h: number;
  water?: boolean;
  deco?: 'flower' | 'grass';
}

export const TILES: TileDef[] = [
  { ch: ' ', name: '深淵', walk: false, top: '#0a0d16', side: '#0a0d16', h: 0 },
  { ch: '.', name: '草地', walk: true, top: '#4f8f4a', side: '#3a6b37', h: 0 },
  { ch: ',', name: '泥地', walk: true, top: '#b39468', side: '#8c7048', h: 0 },
  { ch: '~', name: '水面', walk: false, top: '#2f6bb0', side: '#1f4b80', h: 0, water: true },
  { ch: 'T', name: '樹木', walk: false, top: '#3f7d3a', side: '#6b4a2a', h: 1.3 },
  { ch: 'R', name: '岩石', walk: false, top: '#81848d', side: '#4e5158', h: 0.85 },
  { ch: '#', name: '牆壁', walk: false, top: '#a08a6a', side: '#6d5a42', h: 1.5 },
  { ch: '_', name: '地板', walk: true, top: '#c8b08a', side: '#9a8266', h: 0 },
  { ch: 's', name: '沙地', walk: true, top: '#d8c489', side: '#b8a26a', h: 0 },
  { ch: '=', name: '木橋', walk: true, top: '#a9763f', side: '#7a5228', h: 0 },
  { ch: '*', name: '花叢', walk: true, top: '#4f8f4a', side: '#3a6b37', h: 0, deco: 'flower' },
  { ch: 'v', name: '雜草', walk: true, top: '#4a8745', side: '#38672f', h: 0, deco: 'grass' },
  { ch: 'W', name: '木板', walk: true, top: '#8a6237', side: '#5f4324', h: 0 },
  { ch: 'C', name: '洞窟地', walk: true, top: '#4a4450', side: '#332f39', h: 0 },
  { ch: 'X', name: '岩壁', walk: false, top: '#5d5666', side: '#3a3542', h: 1.5 },
  { ch: 'r', name: '屋頂', walk: false, top: '#b04f4f', side: '#8a3a3a', h: 1.9 },
  { ch: 'w', name: '窗牆', walk: false, top: '#c8b48e', side: '#7d6a4c', h: 1.6 }
];

export const TILE_BY_CH: Record<string, TileDef> = {};
for (const t of TILES) TILE_BY_CH[t.ch] = t;

export function tileAt(grid: string[][], x: number, y: number): TileDef {
  if (y < 0 || y >= grid.length) return TILE_BY_CH[' '];
  const row = grid[y];
  if (x < 0 || x >= row.length) return TILE_BY_CH[' '];
  return TILE_BY_CH[row[x]] ?? TILE_BY_CH[' '];
}

export interface EncounterEntry {
  species: string;
  min: number;
  max: number;
  weight: number;
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  name: string;
  dir?: number;
  color?: { skin: string; hair: string; cloth: string; cloth2: string };
  /** 站著不動的裝飾小人（不給對話） */
  silent?: boolean;
}

export interface PortalDef {
  x: number;
  y: number;
  to: string;
  tx: number;
  ty: number;
  dir?: number;
  /** 需要完成的 flag（例如結局後才開放） */
  requires?: string;
}

export interface PropDef {
  x: number;
  y: number;
  kind: 'sign' | 'well' | 'crystal' | 'chest' | 'torch' | 'boat' | 'board';
  text?: string;
}

export interface TriggerDef {
  x: number;
  y: number;
  flag: string;
  action: string;
}

export interface MapDef {
  id: string;
  name: string;
  w: number;
  h: number;
  border: string;
  floorChar: string;
  rows: string[];
  openings: { x: number; y: number }[];
  encounters?: { rate: number; table: EncounterEntry[] };
  npcs: NpcDef[];
  portals: PortalDef[];
  props: PropDef[];
  triggers: TriggerDef[];
  indoor?: boolean;
  /** 城鎮（傳送羽的目的地判斷用） */
  town?: boolean;
  /** 城鎮的預設落點（傳送羽用） */
  spawn?: { x: number; y: number };
  /** 畫面環境色調覆蓋 */
  tint?: string;
}

function buildGrid(def: MapDef): string[][] {
  const { w, h, rows, border, floorChar, openings } = def;
  const grid: string[][] = [];
  for (let y = 0; y < h; y++) {
    const raw = rows[y] ?? '';
    const padded = raw.padEnd(w, floorChar).slice(0, w);
    grid.push(padded.split(''));
  }
  for (let x = 0; x < w; x++) {
    grid[0][x] = border;
    grid[h - 1][x] = border;
  }
  for (let y = 0; y < h; y++) {
    grid[y][0] = border;
    grid[y][w - 1] = border;
  }
  for (const o of openings) {
    if (o.y >= 0 && o.y < h && o.x >= 0 && o.x < w) grid[o.y][o.x] = floorChar;
  }
  return grid;
}

// ─────────────────────────────────────────────────────────────
export const MAPS: Record<string, MapDef> = {
  village: {
    id: 'village',
    name: '晨曦村',
    w: 22,
    h: 15,
    border: 'T',
    floorChar: '.',
    town: true,
    spawn: { x: 9, y: 11 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'T....................T',
      'T..rrr.......rrr.....T',
      'T..ww#.......ww#.....T',
      'T..###.......###.....T',
      'T....................T',
      'T....................T',
      'T......*......*......T',
      'T....................T',
      'T...TT.........TT....T',
      'T...TT.........TT....T',
      'T....................T',
      'T....................T',
      'T....................T',
      'TTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [{ x: 9, y: 14 }],
    npcs: [
      {
        id: 'elder',
        x: 4,
        y: 6,
        name: '星見長老',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#d8d8e0', cloth: '#5a4a8a', cloth2: '#3a2f5e' }
      },
      {
        id: 'shop',
        x: 15,
        y: 6,
        name: '商人 莉亞',
        dir: 0,
        color: { skin: '#f0c8a0', hair: '#a8503a', cloth: '#c88a3a', cloth2: '#8a5c22' }
      },
      {
        id: 'kid',
        x: 8,
        y: 10,
        name: '孩童 小虎',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#3a2f28', cloth: '#4a9fd8', cloth2: '#2f6f9c' }
      },
      {
        id: 'guard',
        x: 9,
        y: 12,
        name: '衛兵 卡爾',
        dir: 0,
        color: { skin: '#e0b890', hair: '#4a3a2a', cloth: '#7a8a9a', cloth2: '#4a5866' }
      }
    ],
    portals: [{ x: 9, y: 14, to: 'field', tx: 11, ty: 17, dir: 2 }],
    props: [
      { x: 6, y: 8, kind: 'well' },
      { x: 12, y: 13, kind: 'sign', text: '↓ 南：微風草原' },
      { x: 15, y: 8, kind: 'board' }
    ],
    triggers: []
  },

  field: {
    id: 'field',
    name: '微風草原',
    w: 24,
    h: 18,
    border: 'T',
    floorChar: '.',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T....*.................T',
      'T..TT..................T',
      'T..TT........~~~~......T',
      'T............~~~~......T',
      'T............~~~~......T',
      'T............~~~~......T',
      'T............====......T',
      'T............~~~~......T',
      'T............~~~~......T',
      'T...v........~~~~......T',
      'T...v........~~~~......T',
      'T......................T',
      'T..RR..................T',
      'T..RR..................T',
      'T......................T',
      'T................*.....T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 11, y: 17 },
      { x: 5, y: 0 }
    ],
    encounters: {
      rate: 0.11,
      table: [
        { species: 'dusthare', min: 1, max: 3, weight: 30 },
        { species: 'glimmermouse', min: 1, max: 3, weight: 25 },
        { species: 'galehawk', min: 2, max: 4, weight: 20 },
        { species: 'dewfrog', min: 2, max: 4, weight: 15 },
        { species: 'mossbear', min: 3, max: 5, weight: 10 },
        { species: 'shadowwolf', min: 3, max: 6, weight: 12 }
      ]
    },
    npcs: [
      {
        id: 'rin_meet',
        x: 6,
        y: 4,
        name: '遊俠少女',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#6ad8b8', cloth: '#3aa88c', cloth2: '#25705e' }
      },
      {
        id: 'merchant_field',
        x: 19,
        y: 13,
        name: '流浪商人',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#8a7a5a', cloth: '#a8703a', cloth2: '#6e4820' }
      }
    ],
    portals: [
      { x: 11, y: 17, to: 'village', tx: 9, ty: 14, dir: 2 },
      { x: 5, y: 0, to: 'cave', tx: 10, ty: 0, dir: 0 }
    ],
    props: [
      { x: 7, y: 2, kind: 'sign', text: '↑ 北：星塵洞窟入口' },
      { x: 10, y: 15, kind: 'sign', text: '↓ 南：晨曦村' }
    ],
    triggers: [
      { x: 11, y: 10, flag: 'ch1_battle', action: 'battle:hound' },
      { x: 9, y: 4, flag: 'ch1_battle2', action: 'battle:hound2' }
    ]
  },

  cave: {
    id: 'cave',
    name: '星塵洞窟',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(20,10,45,0.42)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCRRCCCCCCX',
      'XCCRRCCCCCCCCCRRCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCRRRRCCCCCCCCCCCCX',
      'XCCCCCRRRRCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCRRRRCCCX',
      'XCCCCCCCCCCCCCCRRRRCCCX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCCX',
      'XXXXXXXXXXXXXXXXXXXXXX'
    ],
    openings: [
      { x: 10, y: 0 },
      { x: 10, y: 15 }
    ],
    encounters: {
      rate: 0.13,
      table: [
        { species: 'rockturtle', min: 4, max: 7, weight: 30 },
        { species: 'magmaboar', min: 4, max: 7, weight: 25 },
        { species: 'thunderbird', min: 4, max: 7, weight: 25 },
        { species: 'frostdeer', min: 5, max: 8, weight: 12 },
        { species: 'flamefox', min: 5, max: 8, weight: 8 },
        { species: 'pebblet', min: 4, max: 7, weight: 14 }
      ]
    },
    npcs: [
      {
        id: 'cave_explorer',
        x: 5,
        y: 3,
        name: '探險家 布格',
        dir: 0,
        color: { skin: '#d8b088', hair: '#c8c0a8', cloth: '#6a7a4a', cloth2: '#4a5632' }
      }
    ],
    portals: [
      { x: 10, y: 0, to: 'field', tx: 5, ty: 0, dir: 0 },
      { x: 10, y: 15, to: 'road', tx: 11, ty: 0, dir: 0 }
    ],
    props: [
      { x: 8, y: 10, kind: 'crystal' },
      { x: 15, y: 4, kind: 'crystal' },
      { x: 4, y: 9, kind: 'torch' },
      { x: 17, y: 12, kind: 'torch' }
    ],
    triggers: [{ x: 10, y: 12, flag: 'ch3_warden', action: 'battle:warden' }]
  },

  road: {
    id: 'road',
    name: '暮色古道',
    w: 24,
    h: 16,
    border: 'T',
    floorChar: ',',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,TT,,,,,,,,,,,,,,,,,,T',
      'T,,TT,,,,,RR,,,,,,,,,,,T',
      'T,,,,,,,,,RR,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,RRRR,,,,,,,,,,,,,T',
      'T,,,,,RRRR,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,TT,,,,,,,,,,T',
      'T,,,,,,,,,,TT,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'T,,,,,,,,,,,,,,,,,,,,,,T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 11, y: 0 },
      { x: 12, y: 15 }
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'frostdeer', min: 7, max: 10, weight: 26 },
        { species: 'galehawk', min: 7, max: 10, weight: 24 },
        { species: 'magmaboar', min: 8, max: 11, weight: 20 },
        { species: 'mossbear', min: 8, max: 11, weight: 18 },
        { species: 'flamefox', min: 9, max: 12, weight: 12 },
        { species: 'zephyrling', min: 7, max: 11, weight: 14 },
        { species: 'shadowwolf', min: 9, max: 12, weight: 10 }
      ]
    },
    npcs: [
      {
        id: 'road_scholar',
        x: 18,
        y: 8,
        name: '旅人 米娜',
        dir: 0,
        color: { skin: '#f0d0b0', hair: '#8a5ad8', cloth: '#d8d0e8', cloth2: '#9a8fb8' }
      },
      {
        id: 'road_guard',
        x: 12,
        y: 13,
        name: '護路隊 漢斯',
        dir: 2,
        color: { skin: '#d8a878', hair: '#3a2a1a', cloth: '#8a3a3a', cloth2: '#5c2424' }
      }
    ],
    portals: [
      { x: 11, y: 0, to: 'cave', tx: 10, ty: 15, dir: 0 },
      { x: 12, y: 15, to: 'harbor', tx: 10, ty: 0, dir: 0 }
    ],
    props: [{ x: 14, y: 13, kind: 'sign', text: '↓ 南：暮色港' }],
    triggers: [{ x: 11, y: 6, flag: 'ch4_sect', action: 'battle:sect' }]
  },

  harbor: {
    id: 'harbor',
    name: '暮色港',
    w: 22,
    h: 15,
    border: 'T',
    floorChar: ',',
    town: true,
    spawn: { x: 8, y: 2 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'T,,,,,,,,,,,,,,,,,,,,T',
      'T,,rrr,,,,,,,,,rrr,,,T',
      'T,,w##,,,,,,,,,w##,,,T',
      'T,,###,,,,,,,,,###,,,T',
      'T,,,,,,,,WWWWWW,,,,,,T',
      'T,,,,,,,,WWWWWW,,,,,,T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [{ x: 10, y: 0 }],
    npcs: [
      {
        id: 'harbor_luna',
        x: 6,
        y: 4,
        name: '船醫 露娜',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#e8c86a', cloth: '#e8e4f0', cloth2: '#8fa8c8' }
      },
      {
        id: 'harbor_shop',
        x: 13,
        y: 4,
        name: '道具商 阿財',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#5a4a3a', cloth: '#a8c88a', cloth2: '#6a8a4a' }
      },
      {
        id: 'harbor_captain',
        x: 10,
        y: 5,
        name: '船長 老莫',
        dir: 0,
        color: { skin: '#c89868', hair: '#e0e0e8', cloth: '#2f4a7a', cloth2: '#1e3050' }
      },
      {
        id: 'tieshan',
        x: 17,
        y: 5,
        name: '礦工老大 鐵山',
        dir: 0,
        color: { skin: '#d8a878', hair: '#3a2a1a', cloth: '#8a6634', cloth2: '#5c4420' }
      }
    ],
    portals: [{ x: 10, y: 0, to: 'road', tx: 12, ty: 15, dir: 0 }],
    props: [
      { x: 8, y: 5, kind: 'boat' },
      { x: 12, y: 1, kind: 'sign', text: '↑ 北：暮色古道' },
      { x: 16, y: 1, kind: 'board' }
    ],
    triggers: [{ x: 10, y: 6, flag: 'ch5_final', action: 'battle:final' }]
  },

  // ═══════════════════════════════════════════════════════════
  // 第二章：霜之國
  // ═══════════════════════════════════════════════════════════
  frostport: {
    id: 'frostport',
    name: '霜華港',
    w: 22,
    h: 15,
    border: 'T',
    floorChar: 's',
    town: true,
    spawn: { x: 10, y: 2 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'TssssssssssssssssssssT',
      'TssrrrsssssssssrrrsssT',
      'Tssw##sssssssssw##sssT',
      'Tss###sssssssss###sssT',
      'TssssssssWWWWWWssssssT',
      'TssssssssWWWWWWssssssT',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'T~~~~~~~~~~~~~~~~~~~~T',
      'TTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [{ x: 10, y: 0 }],
    npcs: [
      {
        id: 'frost_elder',
        x: 8,
        y: 2,
        name: '霜華長老 伊莎',
        dir: 0,
        color: { skin: '#f0d8c0', hair: '#dfe8f0', cloth: '#4a6a9a', cloth2: '#2f4a70' }
      },
      {
        id: 'frost_shop',
        x: 13,
        y: 2,
        name: '道具商 裘恩',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#8a5a3a', cloth: '#4a8a7a', cloth2: '#2f5f52' }
      },
      {
        id: 'frost_captain',
        x: 6,
        y: 4,
        name: '船長 鄂倫',
        dir: 0,
        color: { skin: '#c89868', hair: '#d0d0d8', cloth: '#2f4a7a', cloth2: '#1e3050' }
      },
      {
        id: 'frost_medic',
        x: 17,
        y: 5,
        name: '醫者 瑟拉',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#a8d8e8', cloth: '#e8e4f0', cloth2: '#8fa8c8' }
      }
    ],
    portals: [{ x: 10, y: 0, to: 'snowfield', tx: 11, ty: 17, dir: 0 }],
    props: [
      { x: 9, y: 5, kind: 'boat' },
      { x: 12, y: 1, kind: 'sign', text: '↑ 北：霜牙雪原' },
      { x: 16, y: 1, kind: 'board' }
    ],
    triggers: []
  },

  snowfield: {
    id: 'snowfield',
    name: '霜牙雪原',
    w: 24,
    h: 18,
    border: 'T',
    floorChar: 's',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TssssssssssssssssssssssT',
      'TssTTssssssssssssssssssT',
      'TssTTssssssssssssssssssT',
      'TssssssssssssssssssssssT',
      'Tssssssssss~~~~ssssssssT',
      'Tssssssssss~~~~ssssssssT',
      'Tsssssssss====sssssssssT',
      'Tssssssssss~~~~ssssssssT',
      'Tssssssssss~~~~ssssssssT',
      'TssRRssssssssssssssssssT',
      'TssRRssssssssssssssssssT',
      'TssssssssssssssssssssssT',
      'TssssssssssssssssssRRssT',
      'TssssssssssssssssssRRssT',
      'TssssssssssssssssssssssT',
      'TssssssssssssssssssssssT',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 11, y: 17 },
      { x: 3, y: 0 },
      { x: 23, y: 8 }
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'snowpup', min: 10, max: 13, weight: 30 },
        { species: 'frostfang', min: 10, max: 13, weight: 26 },
        { species: 'frostdeer', min: 11, max: 14, weight: 18 },
        { species: 'glimmermouse', min: 10, max: 12, weight: 12 },
        { species: 'frostbear', min: 13, max: 16, weight: 14 }
      ]
    },
    npcs: [
      {
        id: 'snow_hunter',
        x: 7,
        y: 12,
        name: '獵人 芬',
        dir: 0,
        color: { skin: '#e0b890', hair: '#6a5a4a', cloth: '#7a6a5a', cloth2: '#4a3f34' }
      },
      {
        id: 'snow_shop',
        x: 18,
        y: 4,
        name: '雪原商人',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#a8703a', cloth: '#a8703a', cloth2: '#6e4820' }
      }
    ],
    portals: [
      { x: 11, y: 17, to: 'frostport', tx: 10, ty: 0, dir: 0 },
      { x: 3, y: 0, to: 'icecave', tx: 11, ty: 15, dir: 0 },
      { x: 23, y: 8, to: 'desert', tx: 1, ty: 8, dir: 3 }
    ],
    props: [{ x: 10, y: 4, kind: 'sign', text: '↑ 北：冰晶洞窟　→ 東：流金沙原' }],
    triggers: [{ x: 11, y: 10, flag: 'ch2_mid', action: 'battle:snowpack' }]
  },

  icecave: {
    id: 'icecave',
    name: '冰晶洞窟',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(30,60,110,0.42)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCRRCCCCX',
      'XCCRRCCCCCCCCCCRRCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCRRRRCCCCCCCCCCCX',
      'XCCCCCRRRRCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XXXXXXXXXXXXXXXXXXXXXX'
    ],
    openings: [{ x: 11, y: 15 }],
    encounters: {
      rate: 0.13,
      table: [
        { species: 'tidecaller', min: 12, max: 15, weight: 26 },
        { species: 'frostfang', min: 12, max: 15, weight: 24 },
        { species: 'frostdeer', min: 13, max: 16, weight: 20 },
        { species: 'snowpup', min: 12, max: 14, weight: 16 },
        { species: 'frostwyrm', min: 16, max: 18, weight: 4 },
        { species: 'bubbletad', min: 12, max: 15, weight: 14 },
        { species: 'leviathan', min: 17, max: 19, weight: 3 }
      ]
    },
    npcs: [
      {
        id: 'ice_scholar',
        x: 5,
        y: 3,
        name: '學者 伊蓮',
        dir: 0,
        color: { skin: '#f0d8c0', hair: '#b8c8e8', cloth: '#6a7ab0', cloth2: '#4a5680' }
      }
    ],
    portals: [{ x: 11, y: 15, to: 'snowfield', tx: 3, ty: 0, dir: 0 }],
    props: [
      { x: 8, y: 9, kind: 'crystal' },
      { x: 15, y: 5, kind: 'crystal' },
      { x: 4, y: 9, kind: 'torch' },
      { x: 17, y: 12, kind: 'torch' }
    ],
    triggers: [{ x: 10, y: 6, flag: 'ch2_boss', action: 'battle:icegolem' }]
  },

  // ═══════════════════════════════════════════════════════════
  // 第三章：流沙與火
  // ═══════════════════════════════════════════════════════════
  desert: {
    id: 'desert',
    name: '流金沙原',
    w: 24,
    h: 18,
    border: 'R',
    floorChar: 's',
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssRRssssssssssssssssssR',
      'RssRRssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssRRRRssssssssssR',
      'RssssssssRRRRssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RssssssssssssssssssssssR',
      'RRRRRRRRRRRRRRRRRRRRRRRR'
    ],
    openings: [
      { x: 1, y: 8 },
      { x: 23, y: 10 },
      { x: 11, y: 0 }
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'dunejackal', min: 15, max: 18, weight: 26 },
        { species: 'miragecat', min: 16, max: 19, weight: 20 },
        { species: 'sandworm', min: 16, max: 19, weight: 18 },
        { species: 'cinderimp', min: 15, max: 18, weight: 20 },
        { species: 'crystalspine', min: 17, max: 20, weight: 16 },
        { species: 'stormroc', min: 16, max: 19, weight: 12 },
        { species: 'titanrock', min: 17, max: 20, weight: 10 }
      ]
    },
    npcs: [
      {
        id: 'dune_guide',
        x: 7,
        y: 5,
        name: '嚮導 阿薩',
        dir: 0,
        color: { skin: '#c89868', hair: '#3a2a1a', cloth: '#d8b878', cloth2: '#a88448' }
      }
    ],
    portals: [
      { x: 1, y: 8, to: 'snowfield', tx: 23, ty: 8, dir: 1 },
      { x: 23, y: 10, to: 'volcano', tx: 1, ty: 10, dir: 3 },
      { x: 11, y: 0, to: 'skyport', tx: 11, ty: 14, dir: 2 }
    ],
    props: [{ x: 12, y: 1, kind: 'sign', text: '↑ 北：風空港　→ 東：焰心地脈　← 西：霜牙雪原' }],
    triggers: [{ x: 11, y: 5, flag: 'ch3_mid', action: 'battle:duneambush' }]
  },

  volcano: {
    id: 'volcano',
    name: '焰心地脈',
    w: 22,
    h: 16,
    border: 'R',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(90,25,10,0.45)',
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCRRCCCCCCCCCCCCRRCCR',
      'RCCRRCCCCCCCCCCCCRRCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCCCCRRRRRRCCCCCCCCCR',
      'RCCCCCRRRRRRCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCRRCCCCCCCCCCCCCCCCR',
      'RCCRRCCCCCCCCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RCCCCCCCCCCCCCCCCCCCCR',
      'RRRRRRRRRRRRRRRRRRRRRR'
    ],
    openings: [{ x: 1, y: 10 }],
    encounters: {
      rate: 0.14,
      table: [
        { species: 'cinderimp', min: 18, max: 21, weight: 24 },
        { species: 'magmaboar', min: 18, max: 21, weight: 22 },
        { species: 'flamefox', min: 19, max: 22, weight: 20 },
        { species: 'lavadrake', min: 20, max: 23, weight: 20 },
        { species: 'crystalspine', min: 19, max: 22, weight: 14 },
        { species: 'emberpup', min: 18, max: 21, weight: 16 },
        { species: 'phoenixbird', min: 20, max: 23, weight: 5 }
      ]
    },
    npcs: [],
    portals: [{ x: 1, y: 10, to: 'desert', tx: 23, ty: 10, dir: 1 }],
    props: [
      { x: 6, y: 4, kind: 'torch' },
      { x: 15, y: 11, kind: 'torch' },
      { x: 10, y: 12, kind: 'crystal' }
    ],
    triggers: [{ x: 10, y: 6, flag: 'ch3_boss', action: 'battle:magmalord' }]
  },

  // ═══════════════════════════════════════════════════════════
  // 第四章：星之盡頭
  // ═══════════════════════════════════════════════════════════
  skyport: {
    id: 'skyport',
    name: '風空港',
    w: 22,
    h: 15,
    border: 'T',
    floorChar: '_',
    town: true,
    spawn: { x: 8, y: 2 },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'T____________________T',
      'T__rrr________rrr____T',
      'T__w##________w##____T',
      'T__###________###____T',
      'T____________________T',
      'T____________________T',
      'T____________________T',
      'T____####____________T',
      'T____________________T',
      'T____________________T',
      'T____________________T',
      'T____________________T',
      'T____________________T',
      'TTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 11, y: 14 },
      { x: 11, y: 0 },
      { x: 0, y: 7 },
      { x: 21, y: 7 }
    ],
    npcs: [
      {
        id: 'sky_engineer',
        x: 6,
        y: 5,
        name: '技師 高登',
        dir: 0,
        color: { skin: '#e8c49c', hair: '#8a7a5a', cloth: '#6a8ab0', cloth2: '#4a5f80' }
      },
      {
        id: 'sky_shop',
        x: 15,
        y: 5,
        name: '道具商 露卡',
        dir: 0,
        color: { skin: '#f0c8a0', hair: '#c8603a', cloth: '#c88a3a', cloth2: '#8a5c22' }
      },
      {
        id: 'sky_medic',
        x: 4,
        y: 12,
        name: '醫者 芙蕾',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#e8c86a', cloth: '#e8e4f0', cloth2: '#8fa8c8' }
      },
      {
        id: 'sky_gate',
        x: 2,
        y: 7,
        name: '守望者 卡蘭',
        dir: 3,
        color: { skin: '#d8b090', hair: '#3a3a48', cloth: '#4a4a62', cloth2: '#2a2a3a' }
      }
    ],
    portals: [
      { x: 11, y: 14, to: 'desert', tx: 11, ty: 0, dir: 2 },
      { x: 11, y: 0, to: 'skytemple', tx: 11, ty: 15, dir: 0 },
      { x: 0, y: 7, to: 'abyssgate', tx: 11, ty: 13, dir: 3, requires: 'ended' },
      { x: 21, y: 7, to: 'starhaven', tx: 1, ty: 7, dir: 1, requires: 'true_ended' }
    ],
    props: [
      { x: 12, y: 1, kind: 'sign', text: '↑ 北：星穹神殿　↓ 南：流金沙原' },
      { x: 1, y: 6, kind: 'sign', text: '← 西：深淵迴廊（需先讓星塵回歸）' },
      { x: 20, y: 6, kind: 'sign', text: '→ 東：星海渡口（需先完成真正的結局）' },
      { x: 6, y: 9, kind: 'board' }
    ],
    triggers: []
  },

  skytemple: {
    id: 'skytemple',
    name: '星穹神殿',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: '_',
    indoor: true,
    tint: 'rgba(45,30,90,0.42)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'X____________________X',
      'X__RR____________RR__X',
      'X__RR____________RR__X',
      'X____________________X',
      'X____________________X',
      'X____________________X',
      'X______RRRRRR________X',
      'X______RRRRRR________X',
      'X____________________X',
      'X____________________X',
      'X__RR____________RR__X',
      'X__RR____________RR__X',
      'X____________________X',
      'X____________________X',
      'XXXXXXXXXXXXXXXXXXXXXX'
    ],
    openings: [{ x: 11, y: 15 }],
    encounters: {
      rate: 0.1,
      table: [
        { species: 'starling', min: 22, max: 26, weight: 24 },
        { species: 'luminox', min: 23, max: 27, weight: 18 },
        { species: 'stormroc', min: 22, max: 26, weight: 18 },
        { species: 'cloudserpent', min: 24, max: 28, weight: 16 },
        { species: 'voidmoth', min: 23, max: 27, weight: 14 },
        { species: 'skywhale', min: 25, max: 29, weight: 8 }
      ]
    },
    npcs: [],
    portals: [{ x: 11, y: 15, to: 'skyport', tx: 11, ty: 0, dir: 0 }],
    props: [
      { x: 7, y: 4, kind: 'crystal' },
      { x: 14, y: 11, kind: 'crystal' },
      { x: 4, y: 13, kind: 'torch' },
      { x: 17, y: 4, kind: 'torch' }
    ],
    triggers: [{ x: 10, y: 6, flag: 'ch4_final', action: 'battle:starsovereign' }]
  },

  // ───────────── 終盤：深淵迴廊 ─────────────
  abyssgate: {
    id: 'abyssgate',
    name: '深淵迴廊・入口',
    w: 22,
    h: 15,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(30,10,50,0.5)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRCCCCCCCCCCCCCCRCCX',
      'XCCRCCCCCCCCCCCCCCRCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCRRCCCCCCRRCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCRCCCCCCCCCCCCRCCCX',
      'XCCCRCCCCCCCCCCCCRCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XXXXXXXXXXXXCXXXXXXXXX'
    ],
    openings: [
      { x: 11, y: 14 },
      { x: 11, y: 0 }
    ],
    npcs: [],
    portals: [
      { x: 11, y: 14, to: 'skyport', tx: 1, ty: 7, dir: 3 },
      { x: 11, y: 0, to: 'abysshall', tx: 11, ty: 14, dir: 1 }
    ],
    props: [
      { x: 4, y: 3, kind: 'crystal' },
      { x: 17, y: 3, kind: 'crystal' },
      { x: 4, y: 9, kind: 'torch' },
      { x: 17, y: 9, kind: 'torch' },
      { x: 13, y: 2, kind: 'sign', text: '迴廊深處沒有光。這裡的記號，是回來的人留下的。' }
    ],
    triggers: [{ x: 11, y: 6, flag: 'abyss_f1', action: 'battle:abyssknight' }],
    encounters: {
      rate: 0.06,
      table: [
        { species: 'shadehound', min: 31, max: 35, weight: 4 },
        { species: 'gloomweaver', min: 31, max: 35, weight: 3 }
      ]
    }
  },

  abysshall: {
    id: 'abysshall',
    name: '深淵迴廊・中樞',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(36,8,58,0.56)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCRRCCCCCCCCRRCCCCX',
      'XCCCCRRCCCCCCCCRRCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCRRRRRRCCCCCCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCRRCCCCRRCCCCCCX',
      'XCCCCCCRRCCCCRRCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XXXXXXXXXXXXCXXXXXXXXX'
    ],
    openings: [
      { x: 11, y: 15 },
      { x: 11, y: 0 }
    ],
    npcs: [],
    portals: [
      { x: 11, y: 15, to: 'abyssgate', tx: 11, ty: 1, dir: 2 },
      { x: 11, y: 0, to: 'abyssdeep', tx: 11, ty: 14, dir: 1 }
    ],
    props: [
      { x: 3, y: 6, kind: 'crystal' },
      { x: 18, y: 6, kind: 'crystal' },
      { x: 3, y: 12, kind: 'torch' },
      { x: 18, y: 12, kind: 'torch' }
    ],
    triggers: [{ x: 11, y: 12, flag: 'abyss_f2', action: 'battle:nullbeast' }],
    encounters: {
      rate: 0.07,
      table: [
        { species: 'gloomweaver', min: 36, max: 40, weight: 3 },
        { species: 'frostlich', min: 36, max: 40, weight: 3 },
        { species: 'abyssknight', min: 37, max: 41, weight: 2 },
        { species: 'starwisp', min: 36, max: 40, weight: 2 }
      ]
    }
  },

  abyssdeep: {
    id: 'abyssdeep',
    name: '深淵迴廊・最深處',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(20,4,40,0.66)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCRRCCCCCCCCCCRRCCCX',
      'XCCCRRCCCCCCCCCCRRCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCRRRRRRCCCCCCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCRRCCCCCCCCCCRRCCCX',
      'XCCCRRCCCCCCCCCCRRCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XXXXXXXXXXXXCXXXXXXXXX'
    ],
    openings: [{ x: 11, y: 15 }],
    npcs: [],
    portals: [{ x: 11, y: 15, to: 'abysshall', tx: 11, ty: 1, dir: 2 }],
    props: [
      { x: 3, y: 8, kind: 'torch' },
      { x: 18, y: 8, kind: 'torch' },
      { x: 8, y: 12, kind: 'crystal' },
      { x: 13, y: 12, kind: 'crystal' },
      { x: 11, y: 12, kind: 'sign', text: '「你們帶來的光，剛好夠暖。」' }
    ],
    triggers: [{ x: 11, y: 9, flag: 'abyss_f3', action: 'battle:abysssovereign' }],
    encounters: {
      rate: 0.08,
      table: [
        { species: 'frostlich', min: 40, max: 44, weight: 3 },
        { species: 'abyssknight', min: 41, max: 45, weight: 3 },
        { species: 'voiddragon', min: 42, max: 46, weight: 1 },
        { species: 'starwisp', min: 40, max: 44, weight: 2 }
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 第五章：星海之願（真結局後開放）
  // ═══════════════════════════════════════════════════════════
  starhaven: {
    id: 'starhaven',
    name: '星海渡口',
    w: 22,
    h: 15,
    border: 'T',
    floorChar: '_',
    town: true,
    spawn: { x: 10, y: 2 },
    tint: 'rgba(30,40,90,0.28)',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTT',
      'T____________________T',
      'T__rrr________rrr____T',
      'T__w##________w##____T',
      'T__###________###____T',
      'T____________________T',
      'T____________________T',
      'T____________________T',
      'T_____####___________T',
      'T____________________T',
      'T__RR____________RR__T',
      'T__RR____________RR__T',
      'T____________________T',
      'T____________________T',
      'TTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 0, y: 7 },
      { x: 10, y: 14 }
    ],
    npcs: [
      {
        id: 'star_ferry',
        x: 5,
        y: 5,
        name: '渡守 星河',
        dir: 0,
        color: { skin: '#e8d0b8', hair: '#cfe0ff', cloth: '#4a5f9a', cloth2: '#2f3f70' }
      },
      {
        id: 'star_shop',
        x: 15,
        y: 5,
        name: '道具商 曜',
        dir: 0,
        color: { skin: '#f0c8a0', hair: '#e8b84a', cloth: '#8a6ad8', cloth2: '#5a4498' }
      },
      {
        id: 'star_medic',
        x: 10,
        y: 9,
        name: '醫者 昀',
        dir: 0,
        color: { skin: '#f6d2b0', hair: '#a8e0e8', cloth: '#e8e4f0', cloth2: '#8fa8c8' }
      }
    ],
    portals: [
      { x: 0, y: 7, to: 'skyport', tx: 20, ty: 7, dir: 3 },
      { x: 10, y: 14, to: 'nebulawood', tx: 11, ty: 1, dir: 2 }
    ],
    props: [
      { x: 12, y: 1, kind: 'sign', text: '星海渡口　↓ 南：星霧林' },
      { x: 4, y: 6, kind: 'sign', text: '← 西：風空港' },
      { x: 6, y: 9, kind: 'board' }
    ],
    triggers: []
  },

  nebulawood: {
    id: 'nebulawood',
    name: '星霧林',
    w: 24,
    h: 18,
    border: 'T',
    floorChar: '.',
    tint: 'rgba(40,30,80,0.3)',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......................T',
      'T..TT..............TT..T',
      'T..TT......*.......TT..T',
      'T......................T',
      'T.....~~~~....~~~~.....T',
      'T.....~~~~....~~~~.....T',
      'T......................T',
      'T......................T',
      'T..RR...............TT.T',
      'T..RR...............TT.T',
      'T......................T',
      'T.......TT....TT.......T',
      'T.......TT....TT.......T',
      'T......................T',
      'T......................T',
      'T......................T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    openings: [
      { x: 11, y: 0 },
      { x: 23, y: 8 }
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'nebularat', min: 44, max: 47, weight: 26 },
        { species: 'quasarbat', min: 44, max: 47, weight: 22 },
        { species: 'prismspider', min: 45, max: 48, weight: 20 },
        { species: 'astralowl', min: 45, max: 48, weight: 18 },
        { species: 'cometlisk', min: 46, max: 49, weight: 14 },
        { species: 'starhermit', min: 45, max: 48, weight: 12 }
      ]
    },
    npcs: [
      {
        id: 'nebula_guide',
        x: 7,
        y: 4,
        name: '星海嚮導 澪',
        dir: 0,
        color: { skin: '#e8c8a8', hair: '#8ad8c8', cloth: '#3a6a8a', cloth2: '#254a62' }
      }
    ],
    portals: [
      { x: 11, y: 0, to: 'starhaven', tx: 10, ty: 13, dir: 0 },
      { x: 23, y: 8, to: 'cometridge', tx: 1, ty: 8, dir: 3 }
    ],
    props: [{ x: 10, y: 1, kind: 'sign', text: '↑ 北：星海渡口　→ 東：彗星迴橋' }],
    triggers: [{ x: 11, y: 12, flag: 'ch5_mid', action: 'battle:nebulaswarm' }]
  },

  cometridge: {
    id: 'cometridge',
    name: '彗星迴橋',
    w: 24,
    h: 18,
    border: 'R',
    floorChar: '_',
    tint: 'rgba(24,30,70,0.36)',
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRR',
      'R______________________R',
      'R_____RR________RR_____R',
      'R_____RR________RR_____R',
      'R______________________R',
      'R______________________R',
      'R__RR______________RR__R',
      'R__RR______________RR__R',
      'R______________________R',
      'R______________________R',
      'R_____RRRRRRRRRRRR_____R',
      'R______________________R',
      'R______________________R',
      'R__RR______________RR__R',
      'R__RR______________RR__R',
      'R______________________R',
      'R______________________R',
      'RRRRRRRRRRRRRRRRRRRRRRRR'
    ],
    openings: [
      { x: 0, y: 8 },
      { x: 23, y: 8 }
    ],
    encounters: {
      rate: 0.12,
      table: [
        { species: 'cometlisk', min: 47, max: 50, weight: 22 },
        { species: 'meteorfang', min: 47, max: 50, weight: 20 },
        { species: 'astralowl', min: 48, max: 51, weight: 20 },
        { species: 'quasarbat', min: 48, max: 51, weight: 16 },
        { species: 'czarwyrm', min: 50, max: 53, weight: 3 },
        { species: 'gravitoad', min: 48, max: 51, weight: 12 }
      ]
    },
    npcs: [
      {
        id: 'comet_watcher',
        x: 12,
        y: 5,
        name: '觀星者 穹',
        dir: 2,
        color: { skin: '#d8c0a8', hair: '#b0a8e8', cloth: '#2f3f70', cloth2: '#1e2a50' }
      }
    ],
    portals: [
      { x: 0, y: 8, to: 'nebulawood', tx: 22, ty: 8, dir: 1 },
      { x: 23, y: 8, to: 'starforge', tx: 1, ty: 10, dir: 3 }
    ],
    props: [{ x: 11, y: 1, kind: 'sign', text: '← 西：星霧林　→ 東：碎星鍛坊' }],
    triggers: [{ x: 11, y: 8, flag: 'ch6_mid', action: 'battle:cometguardian' }]
  },

  starforge: {
    id: 'starforge',
    name: '碎星鍛坊',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: 'C',
    indoor: true,
    tint: 'rgba(90,45,20,0.42)',
    rows: [
      'XXXXXXXXXXXXCXXXXXXXXX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCRRCCCCCCCCCCCCRRCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCCCRRCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCX',
      'XCCRRCCCCCCCCCCCCCCCCX',
      'XCCCCCCCCCCCCCCCCCCCCX',
      'CCCCCCCCCCCCCCCCCCCCCC',
      'XCCCCCCRRRRCCCCCCCCCCX',
      'XCCCCCCRRRRCCCCCCCCCCX',
      'XCCRCCCCCCCCCCCCCCRCCX',
      'XCCRCCCCCCCCCCCCCCRCCX',
      'XXXXXXXXXXXXXXXXXXXXXX'
    ],
    openings: [
      { x: 0, y: 10 },
      { x: 11, y: 0 }
    ],
    encounters: {
      rate: 0.13,
      table: [
        { species: 'forgehog', min: 50, max: 53, weight: 24 },
        { species: 'gravitoad', min: 50, max: 53, weight: 20 },
        { species: 'meteorfang', min: 51, max: 54, weight: 20 },
        { species: 'cinderimp', min: 50, max: 53, weight: 14 },
        { species: 'czarwyrm', min: 52, max: 55, weight: 3 },
        { species: 'prismspider', min: 51, max: 54, weight: 12 }
      ]
    },
    npcs: [
      {
        id: 'forge_smith',
        x: 6,
        y: 4,
        name: '鍛師 熔',
        dir: 0,
        color: { skin: '#d8a878', hair: '#8a3a1a', cloth: '#a85a2a', cloth2: '#6e3616' }
      }
    ],
    portals: [
      { x: 0, y: 10, to: 'cometridge', tx: 22, ty: 8, dir: 1 },
      { x: 11, y: 0, to: 'starcradle', tx: 11, ty: 14, dir: 0 }
    ],
    props: [
      { x: 15, y: 4, kind: 'crystal' },
      { x: 4, y: 12, kind: 'torch' },
      { x: 17, y: 12, kind: 'torch' },
      { x: 13, y: 8, kind: 'sign', text: '↑ 北：星之搖籃　← 西：彗星迴橋' }
    ],
    triggers: [{ x: 11, y: 11, flag: 'ch6_forge', action: 'battle:forgegolem' }]
  },

  starcradle: {
    id: 'starcradle',
    name: '星之搖籃',
    w: 22,
    h: 16,
    border: 'X',
    floorChar: '_',
    indoor: true,
    tint: 'rgba(20,16,60,0.5)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXX',
      'X____________________X',
      'X__RR____________RR__X',
      'X__RR____________RR__X',
      'X____________________X',
      'X____________________X',
      'X______RRRRRR________X',
      'X______RRRRRR________X',
      'X____________________X',
      'X____________________X',
      'X__RR____________RR__X',
      'X__RR____________RR__X',
      'X____________________X',
      'X____________________X',
      'X____________________X',
      'XXXXXXXXXXXXXXXXXXXXXX'
    ],
    openings: [{ x: 11, y: 15 }],
    encounters: {
      rate: 0.1,
      table: [
        { species: 'novadrake', min: 54, max: 57, weight: 2 },
        { species: 'cometlord', min: 54, max: 57, weight: 2 },
        { species: 'astralwhale', min: 54, max: 57, weight: 2 },
        { species: 'prismwyrm', min: 54, max: 57, weight: 2 },
        { species: 'czarwyrm', min: 53, max: 56, weight: 6 },
        { species: 'nebulaqueen', min: 53, max: 56, weight: 3 }
      ]
    },
    npcs: [],
    portals: [{ x: 11, y: 15, to: 'starforge', tx: 11, ty: 1, dir: 2 }],
    props: [
      { x: 7, y: 4, kind: 'crystal' },
      { x: 14, y: 11, kind: 'crystal' },
      { x: 4, y: 13, kind: 'torch' },
      { x: 17, y: 4, kind: 'torch' },
      { x: 11, y: 12, kind: 'sign', text: '「所有迷路的星塵，最後都會回到這裡。」' }
    ],
    triggers: [{ x: 11, y: 8, flag: 'star_final', action: 'battle:starmother' }]
  }
};

export const MAP_GRIDS: Record<string, string[][]> = {};
for (const id in MAPS) MAP_GRIDS[id] = buildGrid(MAPS[id]);

/** 開發時檢查：NPC / 傳送點 / 觸發點是否落在不該落的位置 */
if (import.meta.env?.DEV) {
  for (const id in MAPS) {
    const def = MAPS[id];
    const grid = MAP_GRIDS[id];
    const tile = (x: number, y: number) =>
      grid[y] && grid[y][x] ? grid[y][x] : ' ';
    const walk = (x: number, y: number) => TILE_BY_CH[tile(x, y)]?.walk ?? false;
    for (const n of def.npcs) {
      if (!walk(n.x, n.y)) console.warn(`[map:${id}] NPC ${n.id} 站在不可行走格 (${n.x},${n.y})`);
    }
    for (const p of def.portals) {
      if (!walk(p.x, p.y)) console.warn(`[map:${id}] 傳送點 (${p.x},${p.y}) 不可行走`);
    }
    for (const t of def.triggers) {
      if (!walk(t.x, t.y)) console.warn(`[map:${id}] 觸發點 ${t.flag} (${t.x},${t.y}) 不可行走`);
    }
    for (const p of def.props) {
      if (!walk(p.x, p.y)) console.warn(`[map:${id}] 道具 ${p.kind} (${p.x},${p.y}) 不可行走`);
    }
  }
}

/** 全部可遇敵的地圖 id */
export const ENCOUNTER_MAPS = Object.keys(MAPS).filter((id) => !!MAPS[id].encounters);
