import './admin.css';
import {
  clearStoredConfig,
  defaultConfig,
  loadConfig,
  loadStoredConfig,
  normalizeConfig,
  saveConfig,
  type GameConfig
} from '../game/config';
import { DEFAULT_RULES, type Rules } from '../game/rules';
import { AILMENT_NAME, ELEMENT_NAME, FUSIONS, type ItemDef } from '../game/data';
import { ACHIEVEMENTS } from '../game/achievements';
import { MAPS } from '../game/maps';
import type { Ailment, Element, EvolutionDef, Shape, SkillDef, SpeciesDef, Stats } from '../game/types';
import type { BattleBg, ScriptedBattle } from '../game/story';
import { renderSaveTab } from './save';
import {
  badge,
  button,
  checkBox,
  clear,
  colorBox,
  empty,
  field,
  h,
  numberBox,
  section,
  selectBox,
  textArea,
  textBox,
  toast
} from './dom';

// ─────────────────────────────────────────────────────────────
// 選項
// ─────────────────────────────────────────────────────────────
const ELEMENT_OPTIONS = (Object.keys(ELEMENT_NAME) as Element[]).map((value) => ({
  value,
  label: ELEMENT_NAME[value]
}));

const SHAPE_LABEL: Record<Shape, string> = {
  beast: '獸',
  bird: '鳥',
  blob: '軟體',
  bug: '蟲',
  fish: '魚',
  human: '人型',
  dragon: '龍'
};
const SHAPE_OPTIONS = (Object.keys(SHAPE_LABEL) as Shape[]).map((value) => ({
  value,
  label: `${SHAPE_LABEL[value]}（${value}）`
}));

const SKILL_KIND_OPTIONS: { value: SkillDef['kind']; label: string }[] = [
  { value: 'attack', label: '攻擊 attack' },
  { value: 'heal', label: '治療 heal' },
  { value: 'buff', label: '增益 buff' },
  { value: 'debuff', label: '減益 debuff' },
  { value: 'revive', label: '復活 revive' },
  { value: 'status', label: '狀態 status' }
];

const TARGET_OPTIONS: { value: SkillDef['target']; label: string }[] = [
  { value: 'enemy', label: '單體敵人 enemy' },
  { value: 'allEnemy', label: '全體敵人 allEnemy' },
  { value: 'ally', label: '單體我方 ally' },
  { value: 'allAlly', label: '全體我方 allAlly' },
  { value: 'self', label: '自身 self' }
];

const AILMENT_OPTIONS: { value: Ailment | ''; label: string }[] = [
  { value: '', label: '無' },
  { value: 'poison', label: AILMENT_NAME.poison },
  { value: 'paralysis', label: AILMENT_NAME.paralysis },
  { value: 'sleep', label: AILMENT_NAME.sleep }
];

const ITEM_USE_OPTIONS: { value: ItemDef['use']; label: string }[] = [
  { value: 'both', label: '場上 / 戰鬥中皆可' },
  { value: 'battle', label: '僅戰鬥中' },
  { value: 'field', label: '僅場上' },
  { value: 'none', label: '不可使用（可販售）' }
];

const EFFECT_OPTIONS: { value: ItemDef['effect']['type']; label: string }[] = [
  { value: 'heal', label: '回復 HP（heal）' },
  { value: 'mp', label: '回復 MP（mp）' },
  { value: 'revive', label: '復活（revive）' },
  { value: 'healAll', label: '全體回復（healAll）' },
  { value: 'cure', label: '解除異常（cure）' },
  { value: 'damage', label: '固定傷害（damage）' },
  { value: 'capture', label: '封印 / 捕獲（capture）' },
  { value: 'escape', label: '必定逃脫（escape）' },
  { value: 'warp', label: '傳送回城（warp）' },
  { value: 'teach', label: '傳授技能（teach）' },
  { value: 'equip', label: '裝備（equip）' },
  { value: 'gem', label: '鑲嵌寶石（gem）' },
  { value: 'none', label: '無效果（none）' }
];

const BATTLE_BG_OPTIONS: { value: BattleBg; label: string }[] = [
  { value: 'field', label: '草原 field' },
  { value: 'cave', label: '洞窟 cave' },
  { value: 'road', label: '古道 road' },
  { value: 'harbor', label: '港口 harbor' },
  { value: 'snow', label: '雪原 snow' },
  { value: 'volcano', label: '火山 volcano' },
  { value: 'sky', label: '天空 sky' },
  { value: 'abyss', label: '深淵 abyss' },
  { value: 'star', label: '星海 star' },
  { value: 'forge', label: '爐火 forge' }
];

const STAT_META: { key: keyof Stats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'mp', label: 'MP' },
  { key: 'atk', label: '攻擊 ATK' },
  { key: 'def', label: '防禦 DEF' },
  { key: 'mag', label: '魔力 MAG' },
  { key: 'spd', label: '速度 SPD' }
];

// ─────────────────────────────────────────────────────────────
// 狀態
// ─────────────────────────────────────────────────────────────
type Tab =
  | 'dashboard'
  | 'species'
  | 'skills'
  | 'items'
  | 'shop'
  | 'encounters'
  | 'battles'
  | 'rules'
  | 'save'
  | 'io';

const TABS: { id: Tab; icon: string; label: string; hint: string }[] = [
  { id: 'dashboard', icon: '◈', label: '總覽', hint: 'Dashboard' },
  { id: 'species', icon: '❖', label: '幻獸 / 人物', hint: 'Species' },
  { id: 'skills', icon: '✦', label: '技能', hint: 'Skills' },
  { id: 'items', icon: '◆', label: '道具', hint: 'Items' },
  { id: 'shop', icon: '⌂', label: '商店', hint: 'Shop' },
  { id: 'encounters', icon: '⌖', label: '遇敵', hint: 'Encounters' },
  { id: 'battles', icon: '⚔', label: '劇情戰鬥', hint: 'Battles' },
  { id: 'rules', icon: '⚙', label: '公式規則', hint: 'Rules' },
  { id: 'save', icon: '☰', label: '存檔 / 角色', hint: 'SAVE' },
  { id: 'io', icon: '⇅', label: '匯出 / 匯入', hint: 'JSON' }
];

interface AdminState {
  config: GameConfig;
  tab: Tab;
  selected: Record<string, string | undefined>;
  dirty: boolean;
}

const state: AdminState = {
  config: loadConfig(),
  tab: 'dashboard',
  selected: {},
  dirty: false
};

const appEl = document.getElementById('admin');
if (!appEl) throw new Error('找不到 #admin');
const app: HTMLElement = appEl;
app.className = 'app';

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function markDirty() {
  state.dirty = true;
  updateStatus();
}

function updateStatus() {
  const status = document.getElementById('save-status');
  if (!status) return;
  const stored = loadStoredConfig();
  if (state.dirty) {
    status.textContent = '有未儲存的變更';
    status.className = 'badge warn';
  } else if (stored) {
    status.textContent = '已啟用後台覆寫';
    status.className = 'badge ok';
  } else {
    status.textContent = '使用內建預設資料';
    status.className = 'badge muted';
  }
}

function persist() {
  normalizeConfig(state.config);
  if (saveConfig(state.config)) {
    state.dirty = false;
    updateStatus();
    toast('設定已儲存。重新整理遊戲分頁後生效。');
  } else {
    toast('儲存失敗：瀏覽器可能已停用 localStorage 或容量不足。', 'error');
  }
}

function reloadStored() {
  state.config = loadConfig();
  state.dirty = false;
  state.selected = {};
  render();
  toast(loadStoredConfig() ? '已重新載入後台設定。' : '目前沒有覆寫設定，已載入內建預設值。', 'info');
}

function uniqueId(prefix: string, record: Record<string, unknown>): string {
  let index = 1;
  while (record[`${prefix}_${index}`]) index++;
  return `${prefix}_${index}`;
}

function askId(prefix: string, record: Record<string, unknown>): string | null {
  const suggestion = uniqueId(prefix, record);
  const value = prompt(
    `請輸入新的 ID（英文字母、數字、底線；建立後不建議再改）`,
    suggestion
  );
  if (value === null) return null;
  const id = value.trim();
  if (!/^[A-Za-z0-9_]+$/.test(id)) {
    toast('ID 只能包含英文字母、數字與底線。', 'error');
    return null;
  }
  if (record[id]) {
    toast(`ID「${id}」已經存在。`, 'error');
    return null;
  }
  return id;
}

function ensureSelected(key: string, ids: string[]): string | undefined {
  const current = state.selected[key];
  if (current && ids.includes(current)) return current;
  state.selected[key] = ids[0];
  return ids[0];
}

function elementDot(element: Element): HTMLElement {
  const colors: Record<Element, string> = {
    none: '#c8ced9',
    fire: '#ff7a45',
    water: '#4fb0ff',
    wind: '#79e08d',
    earth: '#d1a05a'
  };
  return h('span', { class: 'dot', style: { background: colors[element] } });
}

// ─────────────────────────────────────────────────────────────
// 共用版面
// ─────────────────────────────────────────────────────────────
function entitySplit(options: {
  ids: string[];
  selected?: string;
  title: string;
  addLabel: string;
  searchPlaceholder: string;
  labelOf: (id: string) => string;
  subOf: (id: string) => string;
  dotOf?: (id: string) => HTMLElement;
  onSelect: (id: string) => void;
  onAdd: () => void;
}): { pane: HTMLElement; form: HTMLElement } {
  const list = h('div', { class: 'list' });
  const search = h('input', { class: 'input', type: 'text', placeholder: options.searchPlaceholder });
  const count = h('span', { class: 'badge muted' }, `${options.ids.length}`);

  const draw = () => {
    const query = search.value.trim().toLowerCase();
    clear(list);
    const ids = options.ids.filter((id) => {
      if (!query) return true;
      return `${id} ${options.labelOf(id)} ${options.subOf(id)}`.toLowerCase().includes(query);
    });
    if (ids.length === 0) {
      list.append(empty('沒有符合的資料'));
      return;
    }
    for (const id of ids) {
      const active = id === options.selected;
      const item = h(
        'button',
        {
          class: `list-item${active ? ' active' : ''}`,
          type: 'button',
          onclick: () => options.onSelect(id)
        },
        h('div', { class: 'list-item-main' },
          options.dotOf ? options.dotOf(id) : null,
          h('strong', null, options.labelOf(id))
        ),
        h('span', { class: 'list-item-sub' }, options.subOf(id))
      );
      list.append(item);
    }
  };

  search.addEventListener('input', draw);
  draw();

  const pane = h(
    'div',
    { class: 'list-pane panel' },
    h('div', { class: 'pane-head' }, h('h3', null, options.title), count),
    h('div', { class: 'pane-tools' }, search, button(options.addLabel, options.onAdd, 'primary small')),
    list
  );
  const form = h('div', { class: 'form-pane panel' });
  return { pane, form };
}

function formHead(
  title: string,
  id: string,
  actions: HTMLElement[] = [],
  subtitle?: string
): HTMLElement {
  return h(
    'div',
    { class: 'form-head' },
    h('div', null,
      h('h2', null, title),
      h('div', { class: 'form-sub' }, h('code', null, id), subtitle ? h('span', { class: 'muted' }, `　${subtitle}`) : null)
    ),
    h('div', { class: 'row-actions' }, ...actions)
  );
}

function statsEditor(
  title: string,
  stats: Stats,
  onChange: (key: keyof Stats, value: number) => void,
  step = 1
): HTMLElement {
  const rows = STAT_META.map((meta) =>
    h(
      'div',
      { class: 'stat-row' },
      h('span', { class: 'stat-name' }, meta.label),
      numberBox(stats[meta.key], (value) => onChange(meta.key, value), { step })
    )
  );
  return section(title, h('div', { class: 'stat-table' }, ...rows));
}

// ─────────────────────────────────────────────────────────────
// 總覽
// ─────────────────────────────────────────────────────────────
function renderDashboard(): HTMLElement {
  const config = state.config;
  const stored = loadStoredConfig();
  const encounterCount = Object.values(config.encounters).filter(
    (entry) => entry.rate > 0 || entry.table.length > 0
  ).length;
  const heroCount = Object.values(config.species).filter((sp) => sp.id.startsWith('hero')).length;

  const stat = (label: string, value: string | number, hint?: string) =>
    h('div', { class: 'stat' },
      h('span', null, label),
      h('strong', null, String(value)),
      hint ? h('small', { class: 'muted' }, hint) : null
    );

  return h(
    'div',
    { class: 'tab-page' },
    h('div', { class: 'page-head' },
      h('div', null,
        h('h1', null, '星塵幻獸・管理後台'),
        h('p', { class: 'muted' }, '所有變更會存進這個瀏覽器的 localStorage；重新整理遊戲分頁後套用。')
      ),
      h('div', { class: 'row-actions' },
        button('儲存設定', persist, 'primary'),
        h('a', { class: 'btn ghost', href: './index.html', target: '_blank', rel: 'noreferrer' }, '開啟遊戲 ↗')
      )
    ),

    h('div', { class: 'stats-row' },
      stat('幻獸 / 人物', Object.keys(config.species).length, `其中 ${heroCount} 個劇情角色`),
      stat('技能', Object.keys(config.skills).length),
      stat('道具', Object.keys(config.items).length, `商店 ${config.shops.stock.length} 項`),
      stat('遇敵地圖', `${encounterCount} / ${Object.keys(MAPS).length}`),
      stat('劇情戰鬥', Object.keys(config.battles).length),
      stat('合成配方', FUSIONS.length, '不含依屬性的育種結果'),
      stat('成就', ACHIEVEMENTS.length),
      stat('設定狀態', stored ? '已覆寫' : '預設', stored ? new Date(stored.updatedAt).toLocaleString() : '尚未儲存')
    ),

    section(
      '快速操作',
      h('div', { class: 'quick-grid' },
        quickCard('❖', '調整幻獸數值', '基礎能力、成長值、捕獲率、技能表、進化分支', () => switchTab('species')),
        quickCard('◆', '道具價格與效果', '售價、商店收購價、回復量、寶石與裝備效果', () => switchTab('items')),
        quickCard('⌂', '商店上架', '決定商人賣哪些道具、以什麼價格收购', () => switchTab('shop')),
        quickCard('⌖', '野外遇敵', '每張地圖的遇敵率、出現種族、等級與權重', () => switchTab('encounters')),
        quickCard('☰', '修改角色存檔', '等級、能力、技能、道具、金幣、裝備強化、劇情旗標', () => switchTab('save')),
        quickCard('⚙', '戰鬥公式', '傷害、爆擊、捕獲、經驗、金幣、中毒等係數', () => switchTab('rules'))
      )
    ),

    section(
      '使用流程',
      h('ol', { class: 'steps' },
        h('li', null, '在左側選擇要修改的項目，變更會立即標記為「未儲存」。'),
        h('li', null, '按右上角「儲存設定」寫入瀏覽器。'),
        h('li', null, '回到遊戲分頁按 F5，或重新開啟遊戲，設定就會套用。'),
        h('li', null, '「存檔 / 角色」頁可直接改目前存檔；修改後也要按「儲存存檔」再重新整理遊戲。')
      ),
      h('div', { class: 'notice' },
        h('strong', null, '注意：'),
        ' 設定只存在同一個網址（origin）的瀏覽器。換瀏覽器、換 port 或無痕模式都不會共用；可用「匯出 / 匯入」搬移。'
      )
    ),

    section(
      '危險操作',
      h('div', { class: 'row-actions wrap' },
        button('重新載入已儲存設定', reloadStored, 'ghost'),
        button('匯出 / 匯入 JSON', () => switchTab('io'), 'ghost'),
        button('清除覆寫並回到預設', () => {
          if (!confirm('確定清除後台覆寫？遊戲會回到程式內建的原始數值。')) return;
          clearStoredConfig();
          state.config = defaultConfig();
          state.dirty = false;
          state.selected = {};
          render();
          toast('已清除覆寫，回到內建預設值。', 'info');
        }, 'danger')
      )
    )
  );
}

function quickCard(icon: string, title: string, desc: string, onClick: () => void): HTMLElement {
  return h(
    'button',
    { class: 'quick-card', type: 'button', onclick: onClick },
    h('span', { class: 'quick-icon' }, icon),
    h('strong', null, title),
    h('span', { class: 'muted' }, desc)
  );
}

// ─────────────────────────────────────────────────────────────
// 幻獸 / 人物
// ─────────────────────────────────────────────────────────────
function renderSpeciesTab(): HTMLElement {
  const config = state.config;
  const ids = Object.keys(config.species);
  const selected = ensureSelected('species', ids);
  const split = entitySplit({
    ids,
    selected,
    title: '幻獸 / 人物',
    addLabel: '新增',
    searchPlaceholder: '搜尋名稱或 ID…',
    labelOf: (id) => config.species[id]?.name ?? id,
    subOf: (id) => `${id}　Lv1 HP ${config.species[id]?.base.hp ?? 0}`,
    dotOf: (id) => elementDot(config.species[id]?.element ?? 'none'),
    onSelect: (id) => {
      state.selected.species = id;
      render();
    },
    onAdd: () => {
      const id = askId('species', config.species);
      if (!id) return;
      config.species[id] = newSpecies(id);
      state.selected.species = id;
      markDirty();
      render();
    }
  });

  if (selected && config.species[selected]) {
    split.form.append(renderSpeciesForm(config.species[selected]));
  } else {
    split.form.append(empty('尚未建立任何幻獸種族'));
  }

  return h('div', { class: 'tab-page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, '幻獸 / 人物'),
      h('p', { class: 'muted' }, '修改種族基礎能力、成長、屬性、捕獲率、外觀、技能學習表與進化。劇情角色也在這裡。')
    )),
    h('div', { class: 'split' }, split.pane, split.form)
  );
}

function newSpecies(id: string): SpeciesDef {
  return {
    id,
    name: '新幻獸',
    element: 'none',
    shape: 'beast',
    base: { hp: 50, mp: 20, atk: 10, def: 10, mag: 10, spd: 10 },
    growth: { hp: 8, mp: 3, atk: 1.5, def: 1.5, mag: 1.5, spd: 1.2 },
    catchRate: 0.3,
    size: 1,
    c1: '#8fd0ff',
    c2: '#4f7ad8',
    desc: '',
    skills: []
  };
}

function renderSpeciesForm(sp: SpeciesDef): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'entity-form' });

  wrapper.append(
    formHead(sp.name, sp.id, [
      button('複製', () => {
        const id = askId('species', config.species);
        if (!id) return;
        const cloned = copy(sp);
        cloned.id = id;
        cloned.name = `${sp.name} 複製`;
        config.species[id] = cloned;
        state.selected.species = id;
        markDirty();
        render();
      }, 'ghost small'),
      button('刪除', () => deleteSpecies(sp.id), 'danger small')
    ], `${sp.element}／${sp.shape}`)
  );

  wrapper.append(
    section(
      '基本資料',
      h('div', { class: 'grid grid-3' },
        field('名稱', textBox(sp.name, (value) => {
          sp.name = value;
          markDirty();
        })),
        field('屬性', selectBox(ELEMENT_OPTIONS, sp.element, (value) => {
          sp.element = value;
          markDirty();
        })),
        field('外觀類型', selectBox(SHAPE_OPTIONS, sp.shape, (value) => {
          sp.shape = value;
          markDirty();
        }))
      ),
      h('div', { class: 'grid grid-4' },
        field('捕獲率 0~1', numberBox(sp.catchRate, (value) => {
          sp.catchRate = Math.max(0, Math.min(1, value));
          markDirty();
        }, { step: 0.01, min: 0, max: 1 }), '0 = 無法捕捉（BOSS）'),
        field('體型 size', numberBox(sp.size, (value) => {
          sp.size = Math.max(0.2, value);
          markDirty();
        }, { step: 0.05 })),
        field('主要顏色 c1', colorBox(sp.c1, (value) => {
          sp.c1 = value;
          markDirty();
        })),
        field('次要顏色 c2', colorBox(sp.c2, (value) => {
          sp.c2 = value;
          markDirty();
        }))
      ),
      h('div', { class: 'row-actions' },
        checkBox(!!sp.horns, (value) => {
          sp.horns = value;
          markDirty();
        }, '有角'),
        checkBox(!!sp.wings, (value) => {
          sp.wings = value;
          markDirty();
        }, '有翅膀')
      ),
      field('圖鑑說明', textArea(sp.desc, (value) => {
        sp.desc = value;
        markDirty();
      }, 3))
    )
  );

  wrapper.append(
    statsEditor('Lv1 基礎能力', sp.base, (key, value) => {
      sp.base[key] = value;
      markDirty();
    }),
    statsEditor('每級成長值', sp.growth, (key, value) => {
      sp.growth[key] = value;
      markDirty();
    }, 0.1)
  );

  // 技能學習表
  const learnRows = sp.skills.map((entry, index) =>
    h('div', { class: 'learn-row' },
      h('span', { class: 'muted' }, 'Lv'),
      numberBox(entry.level, (value) => {
        entry.level = Math.max(1, Math.floor(value));
        markDirty();
      }, { min: 1, max: 99 }),
      selectBox(
        Object.entries(config.skills).map(([id, skill]) => ({ value: id, label: `${skill.name}（${id}）` })),
        entry.id,
        (value) => {
          entry.id = value;
          markDirty();
        }
      ),
      button('移除', () => {
        sp.skills.splice(index, 1);
        markDirty();
        render();
      }, 'danger small')
    )
  );

  wrapper.append(
    section(
      '技能學習表',
      ...(learnRows.length ? learnRows : [empty('這隻幻獸還沒有技能')]),
      h('div', { class: 'row-actions' },
        button('新增學習技能', () => {
          const first = Object.keys(config.skills)[0];
          if (!first) {
            toast('請先建立技能。', 'error');
            return;
          }
          sp.skills.push({ level: 1, id: first });
          markDirty();
          render();
        }, 'ghost small')
      )
    )
  );

  // 進化
  const evoBox = h('div', { class: 'panel inset' });
  const evoList: EvolutionDef[] = sp.evolvesTo
    ? Array.isArray(sp.evolvesTo)
      ? sp.evolvesTo.slice()
      : [sp.evolvesTo]
    : [];
  const evo = evoList[0];
  const setEvo = (patch: Partial<EvolutionDef>) => {
    const base: EvolutionDef =
      evo ?? { species: Object.keys(config.species).find((id) => id !== sp.id) ?? sp.id, level: 16 };
    // 保留其他分支設定，只改第一條
    sp.evolvesTo = [{ ...base, ...patch }, ...evoList.slice(1)];
    markDirty();
  };
  evoBox.append(
    h('div', { class: 'row-actions' },
      checkBox(!!evo, (value) => {
        sp.evolvesTo = value
          ? [{ species: Object.keys(config.species).find((id) => id !== sp.id) ?? sp.id, level: 16 }]
          : undefined;
        markDirty();
        render();
      }, '可進化')
    )
  );
  if (evo) {
    if (evoList.length > 1) {
      evoBox.append(h('div', { class: 'hint' }, `（此種族另有 ${evoList.length - 1} 條進化分支，僅在此編輯第一條）`));
    }
    evoBox.append(
      h('div', { class: 'grid grid-2' },
        field('進化成', selectBox(
          Object.entries(config.species)
            .filter(([id]) => id !== sp.id)
            .map(([id, species]) => ({ value: id, label: `${species.name}（${id}）` })),
          evo.species,
          (value) => {
            setEvo({ species: value });
          }
        )),
        field('等級門檻', numberBox(evo.level, (value) => {
          setEvo({ level: Math.max(1, Math.floor(value)) });
        }, { min: 1, max: 99 }))
      )
    );
    evoBox.append(
      h('div', { class: 'grid grid-2' },
        field('最低潛能（0 = 不限）', numberBox(evo.minPotential ?? 0, (value) => {
          setEvo({ minPotential: Math.max(0, Math.floor(value)) || undefined });
        }, { min: 0, max: 50 })),
        field('需要旗標（空 = 不限）', textBox(evo.flag ?? '', (value) => {
          setEvo({ flag: value.trim() || undefined });
        }))
      )
    );
  }
  wrapper.append(section('進化', evoBox));

  return wrapper;
}

function deleteSpecies(id: string) {
  const config = state.config;
  const sp = config.species[id];
  if (!sp) return;
  if (!confirm(`確定刪除「${sp.name}」（${id}）？\n相關的遇敵、劇情戰鬥與進化設定也會一併清除。`)) return;

  delete config.species[id];
  for (const other of Object.values(config.species)) {
    if (Array.isArray(other.evolvesTo)) {
      const kept = other.evolvesTo.filter((e) => e.species !== id);
      other.evolvesTo = kept.length === 0 ? undefined : kept.length === 1 ? kept[0] : kept;
    } else if (other.evolvesTo?.species === id) {
      other.evolvesTo = undefined;
    }
    other.skills = other.skills.filter((entry) => entry.id !== id);
  }
  for (const encounter of Object.values(config.encounters)) {
    encounter.table = encounter.table.filter((entry) => entry.species !== id);
  }
  for (const battle of Object.values(config.battles)) {
    battle.enemies = battle.enemies.filter((entry) => entry.species !== id);
  }
  delete state.selected.species;
  markDirty();
  render();
  toast('已刪除種族。', 'info');
}

// ─────────────────────────────────────────────────────────────
// 技能
// ─────────────────────────────────────────────────────────────
function renderSkillsTab(): HTMLElement {
  const config = state.config;
  const ids = Object.keys(config.skills);
  const selected = ensureSelected('skills', ids);
  const split = entitySplit({
    ids,
    selected,
    title: '技能',
    addLabel: '新增',
    searchPlaceholder: '搜尋技能名稱或 ID…',
    labelOf: (id) => config.skills[id]?.name ?? id,
    subOf: (id) => {
      const skill = config.skills[id];
      return `${id}　${ELEMENT_NAME[skill?.element ?? 'none']}　MP ${skill?.mp ?? 0}`;
    },
    onSelect: (id) => {
      state.selected.skills = id;
      render();
    },
    onAdd: () => {
      const id = askId('skill', config.skills);
      if (!id) return;
      config.skills[id] = newSkill(id);
      state.selected.skills = id;
      markDirty();
      render();
    }
  });

  if (selected && config.skills[selected]) {
    split.form.append(renderSkillForm(config.skills[selected]));
  } else {
    split.form.append(empty('尚未建立任何技能'));
  }

  return h('div', { class: 'tab-page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, '技能'),
      h('p', { class: 'muted' }, '調整技能威力、消耗、屬性、目標、異常狀態與增益效果。')
    )),
    h('div', { class: 'split' }, split.pane, split.form)
  );
}

function newSkill(id: string): SkillDef {
  return {
    id,
    name: '新技能',
    desc: '',
    element: 'none',
    mp: 5,
    power: 20,
    kind: 'attack',
    target: 'enemy'
  };
}

function renderSkillForm(skill: SkillDef): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'entity-form' });

  wrapper.append(
    formHead(skill.name, skill.id, [
      button('複製', () => {
        const id = askId('skill', config.skills);
        if (!id) return;
        const cloned = copy(skill);
        cloned.id = id;
        cloned.name = `${skill.name} 複製`;
        config.skills[id] = cloned;
        state.selected.skills = id;
        markDirty();
        render();
      }, 'ghost small'),
      button('刪除', () => {
        if (!confirm(`確定刪除技能「${skill.name}」？所有幻獸的學習表也會移除它。`)) return;
        delete config.skills[skill.id];
        for (const sp of Object.values(config.species)) {
          sp.skills = sp.skills.filter((entry) => entry.id !== skill.id);
        }
        delete state.selected.skills;
        markDirty();
        render();
        toast('已刪除技能。', 'info');
      }, 'danger small')
    ])
  );

  wrapper.append(
    section(
      '基本資料',
      h('div', { class: 'grid grid-3' },
        field('名稱', textBox(skill.name, (value) => {
          skill.name = value;
          markDirty();
        })),
        field('屬性', selectBox(ELEMENT_OPTIONS, skill.element, (value) => {
          skill.element = value;
          markDirty();
        })),
        field('類型', selectBox(SKILL_KIND_OPTIONS, skill.kind, (value) => {
          skill.kind = value;
          markDirty();
          render();
        }))
      ),
      h('div', { class: 'grid grid-4' },
        field('目標', selectBox(TARGET_OPTIONS, skill.target, (value) => {
          skill.target = value;
          markDirty();
        })),
        field('消耗 MP', numberBox(skill.mp, (value) => {
          skill.mp = Math.max(0, Math.floor(value));
          markDirty();
        }, { min: 0 })),
        field('威力 / 係數', numberBox(skill.power, (value) => {
          skill.power = value;
          markDirty();
        }, { step: 0.05 }), '治療、buff 也使用這個欄位'),
        field('物理攻擊', checkBox(!!skill.physical, (value) => {
          skill.physical = value;
          markDirty();
        }), '使用 ATK；否則使用 MAG')
      ),
      field('說明', textArea(skill.desc, (value) => {
        skill.desc = value;
        markDirty();
      }, 3))
    )
  );

  if (skill.kind === 'buff' || skill.kind === 'debuff') {
    wrapper.append(
      section(
        '增益 / 減益',
        h('div', { class: 'grid grid-2' },
          field('影響能力', selectBox(
            STAT_META.map((meta) => ({ value: meta.key, label: meta.label })),
            skill.stat ?? 'atk',
            (value) => {
              skill.stat = value;
              markDirty();
            }
          )),
          field('持續回合', numberBox(skill.turns ?? 3, (value) => {
            skill.turns = Math.max(1, Math.floor(value));
            markDirty();
          }, { min: 1 }))
        ),
        h('p', { class: 'muted' }, 'power 填 0.4 = +40%，填 -0.3 = -30%。')
      )
    );
  }

  wrapper.append(
    section(
      '異常狀態',
      h('div', { class: 'grid grid-3' },
        field('附加狀態', selectBox(AILMENT_OPTIONS, skill.ailment ?? '', (value) => {
          skill.ailment = value || undefined;
          markDirty();
          render();
        })),
        skill.ailment
          ? field('機率 0~1', numberBox(skill.ailmentChance ?? 1, (value) => {
              skill.ailmentChance = Math.max(0, Math.min(1, value));
              markDirty();
            }, { step: 0.05, min: 0, max: 1 }))
          : null,
        skill.ailment
          ? field('持續回合', numberBox(skill.ailmentTurns ?? 3, (value) => {
              skill.ailmentTurns = Math.max(1, Math.floor(value));
              markDirty();
            }, { min: 1 }))
          : null
      )
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 道具
// ─────────────────────────────────────────────────────────────
function renderItemsTab(): HTMLElement {
  const config = state.config;
  const ids = Object.keys(config.items);
  const selected = ensureSelected('items', ids);
  const split = entitySplit({
    ids,
    selected,
    title: '道具',
    addLabel: '新增',
    searchPlaceholder: '搜尋道具名稱或 ID…',
    labelOf: (id) => config.items[id]?.name ?? id,
    subOf: (id) => {
      const item = config.items[id];
      return `${id}　${item?.price ?? 0} G　收購 ${Math.floor((item?.price ?? 0) * config.rules.sellRatio)} G`;
    },
    onSelect: (id) => {
      state.selected.items = id;
      render();
    },
    onAdd: () => {
      const id = askId('item', config.items);
      if (!id) return;
      config.items[id] = newItem(id);
      state.selected.items = id;
      markDirty();
      render();
    }
  });

  if (selected && config.items[selected]) {
    split.form.append(renderItemForm(config.items[selected]));
  } else {
    split.form.append(empty('尚未建立任何道具'));
  }

  return h('div', { class: 'tab-page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, '道具'),
      h('p', { class: 'muted' }, '售價、商店收購價、使用場合與效果。收購價由「公式規則 → 商店收購價倍率」統一控制。')
    )),
    h('div', { class: 'split' }, split.pane, split.form)
  );
}

function newItem(id: string): ItemDef {
  return {
    id,
    name: '新道具',
    desc: '',
    price: 50,
    use: 'both',
    effect: { type: 'heal', power: 30 }
  };
}

function renderItemForm(item: ItemDef): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'entity-form' });

  wrapper.append(
    formHead(item.name, item.id, [
      button('複製', () => {
        const id = askId('item', config.items);
        if (!id) return;
        const cloned = copy(item);
        cloned.id = id;
        cloned.name = `${item.name} 複製`;
        config.items[id] = cloned;
        state.selected.items = id;
        markDirty();
        render();
      }, 'ghost small'),
      button('刪除', () => {
        if (!confirm(`確定刪除道具「${item.name}」？商店庫存也會移除它。`)) return;
        delete config.items[item.id];
        config.shops.stock = config.shops.stock.filter((id) => id !== item.id);
        delete state.selected.items;
        markDirty();
        render();
        toast('已刪除道具。', 'info');
      }, 'danger small')
    ])
  );

  wrapper.append(
    section(
      '基本資料',
      h('div', { class: 'grid grid-3' },
        field('名稱', textBox(item.name, (value) => {
          item.name = value;
          markDirty();
        })),
        field('售價（買價）', numberBox(item.price, (value) => {
          item.price = Math.max(0, Math.floor(value));
          markDirty();
        }, { min: 0 })),
        field('使用場合', selectBox(ITEM_USE_OPTIONS, item.use, (value) => {
          item.use = value;
          markDirty();
        }))
      ),
      h('div', { class: 'price-line' },
        h('span', null, '商店收購價：'),
        h('strong', null, `${Math.floor(item.price * config.rules.sellRatio)} G`),
        h('span', { class: 'muted' }, `（售價 × ${config.rules.sellRatio}）`)
      ),
      field('說明', textArea(item.desc, (value) => {
        item.desc = value;
        markDirty();
      }, 3))
    )
  );

  wrapper.append(
    section(
      '使用效果',
      h('div', { class: 'grid grid-2' },
        field('效果類型', selectBox(EFFECT_OPTIONS, item.effect.type, (value) => {
          item.effect = { type: value } as ItemDef['effect'];
          markDirty();
          render();
        })),
        ['heal', 'mp', 'revive', 'healAll', 'damage'].includes(item.effect.type)
          ? field(
              item.effect.type === 'revive' ? '復活 HP 比例 0~1' : '效果數值',
              numberBox('power' in item.effect ? item.effect.power : 0, (value) => {
                (item.effect as { power: number }).power = value;
                markDirty();
              }, { step: item.effect.type === 'revive' ? 0.05 : 1 })
            )
          : h('div', { class: 'muted effect-note' }, '這個效果類型不需要數值。')
      )
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 商店
// ─────────────────────────────────────────────────────────────
function renderShopTab(): HTMLElement {
  const config = state.config;
  const stock = new Set(config.shops.stock);
  const wrapper = h('div', { class: 'tab-page' });

  wrapper.append(
    h('div', { class: 'page-head' },
      h('div', null,
        h('h1', null, '商店'),
        h('p', { class: 'muted' }, '勾選商人要販售的道具。所有商店目前共用同一份庫存；收購價倍率在「公式規則」調整。')
      ),
      h('div', { class: 'row-actions' },
        button('全部上架', () => {
          config.shops.stock = Object.keys(config.items);
          markDirty();
          render();
        }, 'ghost'),
        button('全部下架', () => {
          config.shops.stock = [];
          markDirty();
          render();
        }, 'danger')
      )
    )
  );

  const rows = Object.entries(config.items).map(([id, item]) =>
    h('label', { class: 'shop-row' },
      checkBox(stock.has(id), (checked) => {
        if (checked) {
          if (!config.shops.stock.includes(id)) config.shops.stock.push(id);
        } else {
          config.shops.stock = config.shops.stock.filter((entry) => entry !== id);
        }
        markDirty();
      }),
      h('span', { class: 'shop-name' }, item.name, h('code', null, id)),
      h('span', { class: 'shop-price' }, `買 ${item.price} G`),
      h('span', { class: 'shop-price muted' }, `收購 ${Math.floor(item.price * config.rules.sellRatio)} G`),
      badge(ITEM_USE_OPTIONS.find((entry) => entry.value === item.use)?.label ?? item.use, 'muted')
    )
  );

  wrapper.append(
    section(
      `上架道具（${config.shops.stock.length} / ${Object.keys(config.items).length}）`,
      h('div', { class: 'shop-list' }, ...(rows.length ? rows : [empty('尚未建立任何道具')]))
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 遇敵
// ─────────────────────────────────────────────────────────────
function renderEncountersTab(): HTMLElement {
  const config = state.config;
  const mapIds = Object.keys(MAPS);
  const selected = state.selected.encounter && MAPS[state.selected.encounter]
    ? state.selected.encounter
    : mapIds[0];
  state.selected.encounter = selected;
  const map = MAPS[selected];
  const encounter = config.encounters[selected] ?? { rate: 0, table: [] };
  config.encounters[selected] = encounter;

  const totalWeight = encounter.table.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  const rows = encounter.table.map((entry, index) => {
    const chance = totalWeight > 0 ? (Math.max(0, entry.weight) / totalWeight) * 100 : 0;
    return h('div', { class: 'enc-row' },
      selectBox(
        Object.entries(config.species).map(([id, species]) => ({
          value: id,
          label: `${species.name}（${id}）`
        })),
        entry.species,
        (value) => {
          entry.species = value;
          markDirty();
        }
      ),
      numberBox(entry.min, (value) => {
        entry.min = Math.max(1, Math.floor(value));
        markDirty();
      }, { min: 1, max: 99 }),
      numberBox(entry.max, (value) => {
        entry.max = Math.max(1, Math.floor(value));
        markDirty();
      }, { min: 1, max: 99 }),
      numberBox(entry.weight, (value) => {
        entry.weight = Math.max(0, value);
        markDirty();
        render();
      }, { min: 0, step: 0.5 }),
      h('span', { class: 'chance' }, `${chance.toFixed(1)}%`),
      button('移除', () => {
        encounter.table.splice(index, 1);
        markDirty();
        render();
      }, 'danger small')
    );
  });

  const mapOptions = mapIds.map((id) => ({
    value: id,
    label: `${MAPS[id].name}（${id}）${config.encounters[id]?.rate > 0 ? '・有遇敵' : ''}`
  }));

  const pane = h(
    'div',
    { class: 'panel encounter-panel' },
    h('div', { class: 'grid grid-4' },
      field('地圖', selectBox(mapOptions, selected, (value) => {
        state.selected.encounter = value;
        render();
      })),
      field('遇敵率 0~1', numberBox(encounter.rate, (value) => {
        encounter.rate = Math.max(0, Math.min(1, value));
        markDirty();
      }, { step: 0.01, min: 0, max: 1 }), `每走一步約 ${(encounter.rate * 100).toFixed(1)}%`),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, '狀態'),
        badge(encounter.rate > 0 && encounter.table.length > 0 ? '啟用中' : '未啟用', encounter.rate > 0 && encounter.table.length > 0 ? 'ok' : 'muted')
      ),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, '操作'),
        h('div', { class: 'row-actions' },
          button('一鍵啟用', () => {
            if (encounter.rate <= 0) encounter.rate = 0.12;
            markDirty();
            render();
          }, 'ghost small'),
          button('停用此地圖', () => {
            if (!confirm(`確定停用「${map.name}」的野外遇敵？`)) return;
            encounter.rate = 0;
            encounter.table = [];
            markDirty();
            render();
          }, 'danger small')
        )
      )
    ),
    h('div', { class: 'table-head enc-head' },
      h('span', null, '出現幻獸'),
      h('span', null, '最低等級'),
      h('span', null, '最高等級'),
      h('span', null, '權重'),
      h('span', null, '出現機率'),
      h('span', null, '')
    ),
    ...(rows.length ? rows : [empty('這張地圖目前沒有遇敵資料。按下方「新增遇敵項目」開始設定。')]),
    h('div', { class: 'row-actions' },
      button('新增遇敵項目', () => {
        const first = Object.keys(config.species)[0];
        if (!first) {
          toast('請先建立幻獸種族。', 'error');
          return;
        }
        encounter.table.push({ species: first, min: 1, max: 3, weight: 10 });
        if (encounter.rate <= 0) encounter.rate = 0.1;
        markDirty();
        render();
      }, 'primary small'),
      h('span', { class: 'muted' }, `總權重 ${totalWeight}`)
    ),
    h('p', { class: 'muted' }, '遇敵率是「每移動一步」的觸發機率；權重決定出現哪一種幻獸，權重越高越常出現。')
  );

  return h('div', { class: 'tab-page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, '野外遇敵'),
      h('p', { class: 'muted' }, '修改每張地圖的遇敵率、出現種族、等級範圍與權重。')
    )),
    pane
  );
}

// ─────────────────────────────────────────────────────────────
// 劇情戰鬥
// ─────────────────────────────────────────────────────────────
function renderBattlesTab(): HTMLElement {
  const config = state.config;
  const ids = Object.keys(config.battles);
  const selected = ensureSelected('battles', ids);
  const split = entitySplit({
    ids,
    selected,
    title: '劇情戰鬥',
    addLabel: '新增',
    searchPlaceholder: '搜尋戰鬥 ID…',
    labelOf: (id) => id,
    subOf: (id) => {
      const battle = config.battles[id];
      return `${battle?.enemies.length ?? 0} 名敵人${battle?.boss ? '・BOSS' : ''}`;
    },
    onSelect: (id) => {
      state.selected.battles = id;
      render();
    },
    onAdd: () => {
      const id = askId('battle', config.battles);
      if (!id) return;
      config.battles[id] = {
        id,
        enemies: [],
        boss: false,
        canFlee: true,
        intro: '',
        onWin: '',
        bg: 'field'
      };
      state.selected.battles = id;
      markDirty();
      render();
    }
  });

  if (selected && config.battles[selected]) {
    split.form.append(renderBattleForm(config.battles[selected]));
  } else {
    split.form.append(empty('尚未建立任何劇情戰鬥'));
  }

  return h('div', { class: 'tab-page' },
    h('div', { class: 'page-head' }, h('div', null,
      h('h1', null, '劇情戰鬥'),
      h('p', { class: 'muted' }, '調整劇情戰的敵人組合、等級、BOSS 設定、背景與勝利後動作。')
    )),
    h('div', { class: 'split' }, split.pane, split.form)
  );
}

function renderBattleForm(battle: ScriptedBattle): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'entity-form' });

  wrapper.append(
    formHead(battle.id, battle.id, [
      button('複製', () => {
        const id = askId('battle', config.battles);
        if (!id) return;
        const cloned = copy(battle);
        cloned.id = id;
        config.battles[id] = cloned;
        state.selected.battles = id;
        markDirty();
        render();
      }, 'ghost small'),
      button('刪除', () => {
        if (!confirm(`確定刪除劇情戰鬥「${battle.id}」？`)) return;
        delete config.battles[battle.id];
        delete state.selected.battles;
        markDirty();
        render();
        toast('已刪除劇情戰鬥。', 'info');
      }, 'danger small')
    ])
  );

  wrapper.append(
    section(
      '戰鬥設定',
      h('div', { class: 'grid grid-3' },
        field('背景', selectBox(BATTLE_BG_OPTIONS, battle.bg, (value) => {
          battle.bg = value;
          markDirty();
        })),
        field('BOSS 戰', checkBox(battle.boss, (value) => {
          battle.boss = value;
          markDirty();
        }), '無法逃跑、結算時間較長'),
        field('可以逃跑', checkBox(battle.canFlee, (value) => {
          battle.canFlee = value;
          markDirty();
        }))
      ),
      field('戰鬥開場文字', textArea(battle.intro, (value) => {
        battle.intro = value;
        markDirty();
      }, 2)),
      field('勝利後動作 onWin', textBox(battle.onWin ?? '', (value) => {
        battle.onWin = value;
        markDirty();
      }), '例如：flag:ch1_battle;stage:2')
    )
  );

  const enemyRows = battle.enemies.map((entry, index) =>
    h('div', { class: 'enemy-row' },
      selectBox(
        Object.entries(config.species).map(([id, species]) => ({
          value: id,
          label: `${species.name}（${id}）`
        })),
        entry.species,
        (value) => {
          entry.species = value;
          markDirty();
        }
      ),
      numberBox(entry.level, (value) => {
        entry.level = Math.max(1, Math.min(99, Math.floor(value)));
        markDirty();
      }, { min: 1, max: 99 }),
      button('移除', () => {
        battle.enemies.splice(index, 1);
        markDirty();
        render();
      }, 'danger small')
    )
  );

  wrapper.append(
    section(
      `敵人（${battle.enemies.length}）`,
      ...(enemyRows.length ? enemyRows : [empty('這場戰鬥目前沒有敵人')]),
      button('新增敵人', () => {
        const first = Object.keys(config.species)[0];
        if (!first) {
          toast('請先建立幻獸種族。', 'error');
          return;
        }
        battle.enemies.push({ species: first, level: 5 });
        markDirty();
        render();
      }, 'primary small')
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 公式規則
// ─────────────────────────────────────────────────────────────
const RULE_GROUPS: {
  title: string;
  desc?: string;
  fields: { key: keyof Rules; label: string; hint?: string; step?: number }[];
}[] = [
  {
    title: '等級與經驗',
    fields: [
      { key: 'maxLevel', label: '等級上限', step: 1 },
      { key: 'expQuad', label: '升級門檻：Lv² 係數', hint: 'exp = a·Lv² + b·Lv + c', step: 1 },
      { key: 'expLinear', label: '升級門檻：Lv 係數', step: 1 },
      { key: 'expConstant', label: '升級門檻：常數', step: 1 },
      { key: 'expRewardQuad', label: '戰鬥經驗：Lv² 係數', step: 1 },
      { key: 'expRewardLinear', label: '戰鬥經驗：Lv 係數', step: 1 },
      { key: 'expRewardConstant', label: '戰鬥經驗：常數', step: 1 }
    ]
  },
  {
    title: '金幣',
    fields: [
      { key: 'goldLinear', label: '每等級金幣', step: 1 },
      { key: 'goldRandom', label: '隨機金幣係數', hint: 'random × 等級 × rand', step: 1 },
      { key: 'goldConstant', label: '固定金幣', step: 1 }
    ]
  },
  {
    title: '傷害與治療',
    fields: [
      { key: 'basicAttackPower', label: '普通攻擊威力', step: 1 },
      { key: 'damagePowerDivisor', label: '威力除數', hint: '攻擊 × (1 + 威力 / 除數)', step: 1 },
      { key: 'damageDefenseBase', label: '防禦公式基數', hint: '基數 / (基數 + 防禦 × 係數)', step: 1 },
      { key: 'damageDefenseScale', label: '防禦係數', step: 0.05 },
      { key: 'critChance', label: '爆擊率 0~1', step: 0.01 },
      { key: 'critMultiplier', label: '爆擊倍率', step: 0.05 },
      { key: 'damageVariance', label: '傷害浮動 0~1', hint: '0.16 = 92% ~ 108%', step: 0.01 },
      { key: 'guardMultiplier', label: '防禦時傷害倍率', step: 0.05 },
      { key: 'healDivisor', label: '治療威力除數', step: 1 },
      { key: 'poisonRatio', label: '中毒每回合傷害比例', step: 0.01 }
    ]
  },
  {
    title: '平衡與新手保護',
    desc: '我方／敵方整體傷害倍率，以及低等級時的新手保護；野外遇敵數量另受存活隊伍人數限制。',
    fields: [
      { key: 'allyDamageMult', label: '我方傷害倍率', step: 0.01 },
      { key: 'enemyDamageMult', label: '敵方傷害倍率', step: 0.01 },
      { key: 'earlyGameLevel', label: '新手保護：生效等級上限', hint: '等級低於此值時，越接近 1 級保護越強；0 = 關閉', step: 1 },
      { key: 'allyEarlyDamageBonus', label: '新手保護：我方傷害加成', step: 0.05 },
      { key: 'enemyEarlyDamageReduction', label: '新手保護：我方減傷', step: 0.05 },
      { key: 'allyEarlyHealBonus', label: '新手保護：我方治療加成', step: 0.05 },
      { key: 'maxEnemies', label: '野外遇敵數量上限', step: 1 }
    ]
  },
  {
    title: '捕獲',
    fields: [
      { key: 'captureBase', label: '基礎值', step: 0.01 },
      { key: 'captureHpScale', label: 'HP 越低加成', step: 0.01 },
      { key: 'captureSpeciesScale', label: '種族捕獲率倍率', step: 0.01 },
      { key: 'captureLevelPenaltyPerLevel', label: '每級懲罰', step: 0.005 },
      { key: 'captureLevelPenaltyMin', label: '懲罰下限', step: 0.01 },
      { key: 'captureMin', label: '最低成功率', step: 0.01 },
      { key: 'captureMax', label: '最高成功率', step: 0.01 }
    ]
  },
  {
    title: '逃跑與商店',
    fields: [
      { key: 'fleeBase', label: '逃跑基礎值', step: 0.01 },
      { key: 'fleePerSpeed', label: '每點速度差', step: 0.01 },
      { key: 'fleeMin', label: '逃跑最低值', step: 0.01 },
      { key: 'fleeMax', label: '逃跑最高值', step: 0.01 },
      { key: 'sellRatio', label: '商店收購價倍率', hint: '0.5 = 售價的 50%', step: 0.05 }
    ]
  }
];

function renderRulesTab(): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'tab-page' });

  wrapper.append(
    h('div', { class: 'page-head' },
      h('div', null,
        h('h1', null, '公式規則'),
        h('p', { class: 'muted' }, '集中調整戰鬥、經驗、捕獲、逃跑與經濟公式。修改後儲存並重新整理遊戲。')
      ),
      h('div', { class: 'row-actions' },
        button('恢復預設公式', () => {
          if (!confirm('確定把公式恢復成程式內建預設值？')) return;
          config.rules = copy(DEFAULT_RULES);
          markDirty();
          render();
        }, 'danger')
      )
    )
  );

  for (const group of RULE_GROUPS) {
    const fields = group.fields.map((entry) =>
      field(
        entry.label,
        numberBox(config.rules[entry.key] as number, (value) => {
          (config.rules[entry.key] as number) = value;
          markDirty();
        }, { step: entry.step ?? 1 }),
        entry.hint
      )
    );
    wrapper.append(section(group.title, h('div', { class: 'grid grid-4' }, ...fields)));
  }

  wrapper.append(
    section(
      '存檔套用',
      checkBox(config.rules.recalcOnLoad, (value) => {
        config.rules.recalcOnLoad = value;
        markDirty();
      }, '載入存檔時，依目前種族數值重新計算角色能力（保留 HP/MP 百分比）'),
      h('p', { class: 'muted' }, '關閉後，修改幻獸數值只會影響新建立的角色；舊存檔會保留原本的能力上限。')
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 匯出 / 匯入
// ─────────────────────────────────────────────────────────────
function renderIOTab(): HTMLElement {
  const config = state.config;
  const wrapper = h('div', { class: 'tab-page' });
  const area = textArea(JSON.stringify(config, null, 2), () => undefined, 24);
  area.classList.add('json-area');

  const fileInput = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importConfig(String(reader.result));
      } catch {
        toast('匯入失敗：檔案不是有效的 JSON。', 'error');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  function importConfig(text: string) {
    const parsed = JSON.parse(text) as GameConfig;
    if (!parsed || typeof parsed !== 'object' || !parsed.species || !parsed.skills || !parsed.items) {
      toast('匯入失敗：缺少 species / skills / items 等必要欄位。', 'error');
      return;
    }
    state.config = normalizeConfig(parsed);
    state.dirty = true;
    state.selected = {};
    render();
    toast('設定已匯入（尚未儲存）。請確認後按「儲存設定」。');
  }

  wrapper.append(
    h('div', { class: 'page-head' },
      h('div', null,
        h('h1', null, '匯出 / 匯入'),
        h('p', { class: 'muted' }, '把整份遊戲設定備份成 JSON，或從其他瀏覽器／電腦匯入。')
      ),
      h('div', { class: 'row-actions' },
        button('下載 JSON', () => {
          const blob = new Blob([JSON.stringify(state.config, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = h('a', { href: url, download: 'stardust-beasts-admin.json' });
          document.body.append(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, 'primary'),
        button('從檔案匯入', () => fileInput.click(), 'ghost')
      )
    ),
    fileInput,
    section(
      '目前設定 JSON',
      h('p', { class: 'muted' },
        '可以直接編輯下方內容再按「套用文字框內容」。欄位錯誤可能導致遊戲資料異常，建議先下載備份。'
      ),
      area,
      h('div', { class: 'row-actions' },
        button('套用文字框內容', () => {
          try {
            importConfig(area.value);
          } catch {
            toast('套用失敗：JSON 格式錯誤。', 'error');
          }
        }, 'primary'),
        button('複製 JSON', async () => {
          try {
            await navigator.clipboard.writeText(JSON.stringify(state.config, null, 2));
            toast('已複製到剪貼簿。');
          } catch {
            toast('複製失敗，請手動選取文字。', 'error');
          }
        }, 'ghost')
      )
    ),
    section(
      '儲存位置',
      h('p', { class: 'muted' }, '設定鍵：'),
      h('code', { class: 'code-block' }, 'stardust-beasts-admin-v1'),
      h('p', { class: 'muted' }, '遊戲存檔鍵：'),
      h('code', { class: 'code-block' }, 'stardust-beasts-save-v1'),
      h('p', { class: 'muted' }, '兩者都存在瀏覽器 localStorage，管理頁與遊戲必須使用同一個網址（含 port）。')
    )
  );

  return wrapper;
}

// ─────────────────────────────────────────────────────────────
// 版面
// ─────────────────────────────────────────────────────────────
function switchTab(tab: Tab) {
  state.tab = tab;
  render();
}

function renderTab(): HTMLElement {
  switch (state.tab) {
    case 'species':
      return renderSpeciesTab();
    case 'skills':
      return renderSkillsTab();
    case 'items':
      return renderItemsTab();
    case 'shop':
      return renderShopTab();
    case 'encounters':
      return renderEncountersTab();
    case 'battles':
      return renderBattlesTab();
    case 'rules':
      return renderRulesTab();
    case 'save':
      return renderSaveTab(state.config);
    case 'io':
      return renderIOTab();
    default:
      return renderDashboard();
  }
}

function render() {
  clear(app);
  document.title = '星塵幻獸・管理後台';

  const nav = h('nav', { class: 'nav' },
    ...TABS.map((tab) =>
      h(
        'button',
        {
          class: `nav-item${state.tab === tab.id ? ' active' : ''}`,
          type: 'button',
          onclick: () => switchTab(tab.id)
        },
        h('span', { class: 'nav-icon' }, tab.icon),
        h('span', { class: 'nav-text' }, tab.label),
        h('span', { class: 'nav-hint' }, tab.hint)
      )
    )
  );

  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('div', { class: 'brand-logo' }, '✦'),
      h('div', null,
        h('strong', null, '星塵幻獸'),
        h('span', null, 'STARDUST ADMIN')
      )
    ),
    nav,
    h('div', { class: 'sidebar-foot' },
      h('a', { href: './index.html', target: '_blank', rel: 'noreferrer' }, '開啟遊戲 ↗'),
      h('span', null, 'v1.0・純前端管理介面')
    )
  );

  const topbar = h('header', { class: 'topbar' },
    h('div', { class: 'crumb' },
      h('span', null, '管理後台'),
      h('span', { class: 'crumb-sep' }, '/'),
      h('strong', null, TABS.find((tab) => tab.id === state.tab)?.label ?? '')
    ),
    h('div', { class: 'top-actions' },
      h('span', { id: 'save-status', class: 'badge muted' }, ''),
      button('儲存設定', persist, 'primary'),
      button('重新載入', reloadStored, 'ghost')
    )
  );

  app.append(
    sidebar,
    h('div', { class: 'workspace' }, topbar, h('main', { class: 'main' }, renderTab()))
  );
  updateStatus();
}

window.addEventListener('beforeunload', (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    persist();
  }
});

render();
