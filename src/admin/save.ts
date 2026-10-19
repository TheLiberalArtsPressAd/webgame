import { ELEMENT_NAME } from '../game/data';
import { ACHIEVEMENTS } from '../game/achievements';
import { MAPS } from '../game/maps';
import { MAX_PARTY, SAVE_KEY, SAVE_SLOTS, slotKey, type GameState } from '../game/state';
import type { GameConfig } from '../game/config';
import type { EquipSlot, SpeciesDef, Stats, Unit } from '../game/types';
import {
  badge,
  button,
  checkBox,
  clear,
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

function calcStats(sp: SpeciesDef, level: number): Stats {
  const l = Math.max(0, level - 1);
  return {
    hp: Math.floor(sp.base.hp + sp.growth.hp * l),
    mp: Math.floor(sp.base.mp + sp.growth.mp * l),
    atk: Math.floor(sp.base.atk + sp.growth.atk * l),
    def: Math.floor(sp.base.def + sp.growth.def * l),
    mag: Math.floor(sp.base.mag + sp.growth.mag * l),
    spd: Math.floor(sp.base.spd + sp.growth.spd * l)
  };
}

function skillsFor(sp: SpeciesDef, level: number): string[] {
  return sp.skills.filter((entry) => entry.level <= level).map((entry) => entry.id);
}

function spriteOf(sp: SpeciesDef): Unit['sprite'] {
  return { shape: sp.shape, c1: sp.c1, c2: sp.c2, size: sp.size, horns: sp.horns, wings: sp.wings };
}

function readSave(config: GameConfig, slot = 1): GameState | null {
  try {
    // 新格式：每個欄位一個 key；舊格式（單一存檔）讀不到時退回
    const raw = localStorage.getItem(slotKey(slot)) ?? (slot === 1 ? localStorage.getItem(SAVE_KEY) : null);
    if (!raw) return null;
    const parsed = normalizeSave(JSON.parse(raw) as GameState, config);
    if (parsed) parsed.slot = slot;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeSave(parsed: GameState, config: GameConfig): GameState | null {
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.party)) return null;
  parsed.storage = Array.isArray(parsed.storage) ? parsed.storage : [];
  parsed.inventory = parsed.inventory ?? {};
  parsed.flags = parsed.flags ?? {};
  parsed.dex = parsed.dex ?? {};
  parsed.dexRewards = Array.isArray(parsed.dexRewards) ? parsed.dexRewards : [];
  parsed.bounties = Array.isArray(parsed.bounties) ? parsed.bounties : [];
  parsed.bountyRound = Number(parsed.bountyRound) || 0;
  parsed.bountySeed = Number(parsed.bountySeed) || Math.floor(Math.random() * 0x7fffffff);
  parsed.questTaken = Array.isArray(parsed.questTaken) ? parsed.questTaken : [];
  parsed.questProgress = parsed.questProgress ?? {};
  parsed.questClaimed = parsed.questClaimed ?? {};
  parsed.questClears = parsed.questClears ?? {};
  parsed.lastTown = parsed.lastTown ?? 'village';
  // 第四輪新增欄位
  parsed.slot = Math.max(1, Math.min(SAVE_SLOTS, Number(parsed.slot) || 1));
  parsed.goldEarned = Number(parsed.goldEarned) || 0;
  parsed.questsDone = Number(parsed.questsDone) || 0;
  parsed.bountiesDone = Number(parsed.bountiesDone) || 0;
  parsed.dailies = Array.isArray(parsed.dailies) ? parsed.dailies : [];
  parsed.dailyKey = parsed.dailyKey ?? '';
  parsed.dailyDone = Number(parsed.dailyDone) || 0;
  parsed.dailyStreak = Number(parsed.dailyStreak) || 0;
  parsed.dailyLastDoneKey = parsed.dailyLastDoneKey ?? '';
  parsed.fusions = Number(parsed.fusions) || 0;
  parsed.upgrades = Number(parsed.upgrades) || 0;
  parsed.gemsSocketed = Number(parsed.gemsSocketed) || 0;
  parsed.evolutions = Number(parsed.evolutions) || 0;
  parsed.achievements = parsed.achievements ?? {};
  for (const unit of [...parsed.party, ...parsed.storage]) {
    unit.buffs = Array.isArray(unit.buffs) ? unit.buffs : [];
    unit.skills = Array.isArray(unit.skills) ? unit.skills : [];
    unit.equip = unit.equip ?? {};
    unit.potential = Math.max(0, Math.min(50, Number(unit.potential) || 0));
    unit.generation = Math.max(0, Number(unit.generation) || 0);
    unit.level = Math.max(1, Number(unit.level) || 1);
    unit.exp = Math.max(0, Number(unit.exp) || 0);
    const species = config.species[unit.speciesId];
    if (!unit.max && species) unit.max = calcStats(species, unit.level);
    unit.max = unit.max ?? { hp: 1, mp: 0, atk: 1, def: 1, mag: 1, spd: 1 };
    unit.hp = Math.max(0, Math.min(unit.max.hp, Number(unit.hp) || 0));
    unit.mp = Math.max(0, Math.min(unit.max.mp, Number(unit.mp) || 0));
    if (species && unit.sprite == null) unit.sprite = spriteOf(species);
  }
  return parsed;
}

function nextUid(save: GameState): number {
  let max = 0;
  for (const unit of [...save.party, ...save.storage]) max = Math.max(max, Number(unit.uid) || 0);
  return max + 1;
}

export function renderSaveTab(config: GameConfig): HTMLElement {
  let slot = 1;
  let save = readSave(config, slot);
  let dirty = false;
  const root = h('div', { class: 'save-tab' });

  const status = h('span', { class: 'badge' }, '');

  function setDirty(value: boolean) {
    dirty = value;
    status.textContent = dirty ? '有未儲存的變更' : save ? `已同步（欄位 ${slot}）` : `欄位 ${slot}：沒有存檔`;
    status.className = `badge ${dirty ? 'warn' : save ? 'ok' : 'muted'}`;
  }

  function persist() {
    if (!save) return;
    try {
      const n = Math.max(1, Math.min(SAVE_SLOTS, Math.floor(save.slot ?? slot) || 1));
      save.slot = n;
      save.savedAt = Date.now();
      localStorage.setItem(slotKey(n), JSON.stringify(save));
      setDirty(false);
      toast(`存檔已寫入欄位 ${n}。請重新整理遊戲分頁以載入變更。`);
    } catch {
      toast('存檔寫入失敗（可能超出瀏覽器容量）', 'error');
    }
  }

  function recalcUnit(unit: Unit, preserveRatio = true) {
    const sp = config.species[unit.speciesId];
    if (!sp) return;
    const next = calcStats(sp, unit.level);
    const hpRatio = unit.max?.hp > 0 ? unit.hp / unit.max.hp : 1;
    const mpRatio = unit.max?.mp > 0 ? unit.mp / unit.max.mp : 1;
    unit.max = next;
    unit.hp = Math.max(0, Math.min(next.hp, Math.round(preserveRatio ? next.hp * hpRatio : next.hp)));
    unit.mp = Math.max(0, Math.min(next.mp, Math.round(preserveRatio ? next.mp * mpRatio : next.mp)));
    unit.skills = skillsFor(sp, unit.level);
    unit.element = sp.element;
    unit.sprite = spriteOf(sp);
  }

  function createSave() {
    const ids = Object.keys(config.species);
    if (ids.length === 0) {
      toast('目前沒有任何幻獸種族，請先到「幻獸」頁新增。', 'error');
      return;
    }
    const heroId = config.species['hero_asa'] ? 'hero_asa' : ids[0];
    const starterId = config.species['dusthare'] ? 'dusthare' : ids[1] ?? ids[0];
    const mk = (speciesId: string, level: number, kind: Unit['kind']): Unit => {
      const sp = config.species[speciesId];
      const max = calcStats(sp, level);
      return {
        uid: 0,
        kind,
        speciesId,
        name: sp.name,
        level,
        exp: 0,
        hp: max.hp,
        mp: max.mp,
        max,
        skills: skillsFor(sp, level),
        element: sp.element,
        sprite: spriteOf(sp),
        buffs: []
      };
    };
    const hero = mk(heroId, 1, 'hero');
    const starter = mk(starterId, 2, 'pet');
    const stock = config.shops.stock.slice(0, 3);
    save = {
      version: 1,
      slot,
      playerName: hero.name,
      mapId: 'village',
      px: 9,
      py: 11,
      facing: 2,
      party: [hero, starter],
      storage: [],
      inventory: Object.fromEntries(stock.map((id) => [id, 1])),
      gold: 250,
      goldEarned: 250,
      flags: {},
      stage: 0,
      steps: 0,
      playTime: 0,
      battlesWon: 0,
      captured: 0,
      dex: { [heroId]: true, [starterId]: true },
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
    save.party.forEach((unit, i) => (unit.uid = i + 1));
    setDirty(true);
    build();
  }

  function moveUnit(unit: Unit, toParty: boolean) {
    if (!save) return;
    if (toParty && save.party.length >= MAX_PARTY) {
      toast(`出戰隊伍最多 ${MAX_PARTY} 隻，請先移出一隻。`, 'error');
      return;
    }
    const from = save.party.includes(unit) ? save.party : save.storage;
    const index = from.indexOf(unit);
    if (index >= 0) from.splice(index, 1);
    (toParty ? save.party : save.storage).push(unit);
    setDirty(true);
    build();
  }

  function removeUnit(unit: Unit) {
    if (!save) return;
    if (save.party.includes(unit) && save.party.length <= 1) {
      toast('隊伍至少需要一名成員。', 'error');
      return;
    }
    if (!confirm(`確定刪除「${unit.name}」？此動作無法復原。`)) return;
    for (const list of [save.party, save.storage]) {
      const index = list.indexOf(unit);
      if (index >= 0) list.splice(index, 1);
    }
    setDirty(true);
    build();
  }

  function unitCard(unit: Unit, index: number, inParty: boolean): HTMLElement {
    const sp = config.species[unit.speciesId];
    const speciesOptions = Object.entries(config.species).map(([id, species]) => ({
      value: id,
      label: `${species.name}（${id}）`
    }));

    const hpInput = numberBox(unit.hp, (value) => {
      unit.hp = Math.max(0, Math.min(unit.max.hp, Math.floor(value)));
      setDirty(true);
    });
    const mpInput = numberBox(unit.mp, (value) => {
      unit.mp = Math.max(0, Math.min(unit.max.mp, Math.floor(value)));
      setDirty(true);
    });

    const statInputs = (['hp', 'mp', 'atk', 'def', 'mag', 'spd'] as (keyof Stats)[]).map((key) => {
      const labels: Record<keyof Stats, string> = {
        hp: 'HP 上限',
        mp: 'MP 上限',
        atk: '攻擊',
        def: '防禦',
        mag: '魔力',
        spd: '速度'
      };
      return field(
        labels[key],
        numberBox(unit.max[key], (value) => {
          unit.max[key] = Math.max(1, Math.floor(value));
          setDirty(true);
        })
      );
    });

    const skillChecks = Object.entries(config.skills).map(([id, skill]) => {
      const checked = unit.skills.includes(id);
      return h(
        'label',
        { class: 'check compact' },
        checkBox(checked, (on) => {
          if (on && !unit.skills.includes(id)) unit.skills.push(id);
          if (!on) unit.skills = unit.skills.filter((skillId) => skillId !== id);
          setDirty(true);
        }),
        h('span', null, `${skill.name}（${id}）`)
      );
    });

    return h(
      'div',
      { class: `unit-card${inParty ? '' : ' storage'}` },
      h(
        'div',
        { class: 'unit-head' },
        h(
          'div',
          null,
          h('strong', null, `${inParty ? '出戰' : '待命'} ${index + 1}・${unit.name}`),
          h('span', { class: 'muted' }, ` Lv${unit.level}　${sp?.name ?? unit.speciesId}　${unit.kind}`)
        ),
        badge(unit.hp <= 0 ? '戰鬥不能' : `HP ${unit.hp}/${unit.max.hp}`, unit.hp <= 0 ? 'danger' : 'ok'),
        h('div', { class: 'row-actions' },
          button('依等級重算', () => {
            recalcUnit(unit, true);
            setDirty(true);
            build();
          }, 'ghost small'),
          button(inParty ? '移到待命' : '加入出戰', () => moveUnit(unit, !inParty), 'ghost small'),
          button('刪除', () => removeUnit(unit), 'danger small')
        )
      ),
      h('div', { class: 'grid grid-3' },
        field('名稱', textBox(unit.name, (value) => {
          unit.name = value;
          setDirty(true);
        })),
        field('種族', selectBox(speciesOptions, unit.speciesId, (value) => {
          unit.speciesId = value;
          const next = config.species[value];
          if (next) {
            unit.name = unit.name === sp?.name ? next.name : unit.name;
            recalcUnit(unit, true);
          }
          setDirty(true);
          build();
        })),
        field('種類', selectBox([
          { value: 'hero', label: '劇情角色 hero' },
          { value: 'pet', label: '幻獸 pet' }
        ], unit.kind === 'enemy' ? 'pet' : unit.kind, (value) => {
          unit.kind = value as Unit['kind'];
          setDirty(true);
        }))
      ),
      h('div', { class: 'grid grid-3' },
        field('等級', numberBox(unit.level, (value) => {
          unit.level = Math.max(1, Math.min(99, Math.floor(value)));
          setDirty(true);
        }, { min: 1, max: 99 })),
        field('經驗值', numberBox(unit.exp, (value) => {
          unit.exp = Math.max(0, Math.floor(value));
          setDirty(true);
        }, { min: 0 })),
        field('屬性', selectBox(
          (['none', 'fire', 'water', 'wind', 'earth'] as const).map((value) => ({
            value,
            label: ELEMENT_NAME[value]
          })),
          unit.element,
          (value) => {
            unit.element = value;
            setDirty(true);
          }
        ))
      ),
      h('div', { class: 'grid grid-3' },
        field('目前 HP', hpInput),
        field('目前 MP', mpInput),
        h('div', { class: 'field' },
          h('span', { class: 'field-label' }, '快速操作'),
          h('div', { class: 'row-actions' },
            button('補滿', () => {
              unit.hp = unit.max.hp;
              unit.mp = unit.max.mp;
              unit.buffs = [];
              unit.ailment = undefined;
              setDirty(true);
              build();
            }, 'ghost small'),
            button('復活', () => {
              unit.hp = unit.max.hp;
              setDirty(true);
              build();
            }, 'ghost small')
          )
        )
      ),
      h('div', { class: 'grid grid-3' },
        field('潛能（0~50）', numberBox(unit.potential ?? 0, (value) => {
          unit.potential = Math.max(0, Math.min(50, Math.floor(value)));
          setDirty(true);
        }, { min: 0, max: 50 })),
        field('合成世代', numberBox(unit.generation ?? 0, (value) => {
          unit.generation = Math.max(0, Math.floor(value));
          setDirty(true);
        }, { min: 0 })),
        h('div', { class: 'field' },
          h('span', { class: 'field-label' }, '裝備 / 強化 / 寶石'),
          h('div', { class: 'muted' },
            (Object.entries(unit.equip ?? {}) as [EquipSlot, string][])
              .map(([slot, id]) => {
                const up = unit.equipUp?.[slot] ?? 0;
                const gems = (unit.gems?.[slot] ?? []).map((g) => config.items[g]?.name ?? g);
                return `${slot}: ${config.items[id]?.name ?? id}${up > 0 ? ` +${up}` : ''}${
                  gems.length ? ` [${gems.join('、')}]` : ''
                }`;
              })
              .join('　') || '未裝備'
          )
        )
      ),
      h('details', { class: 'details' },
        h('summary', null, '能力上限（可直接修改）'),
        h('div', { class: 'grid grid-3' }, ...statInputs)
      ),
      h('details', { class: 'details' },
        h('summary', null, `技能（${unit.skills.length}）— 點擊展開／收合`),
        h('div', { class: 'skill-checks' }, ...(skillChecks.length ? skillChecks : [empty('尚未建立技能')]))
      )
    );
  }

  function build() {
    clear(root);
    setDirty(dirty);

    root.append(
      h(
        'div',
        { class: 'page-head' },
        h('div', null,
          h('h2', null, '存檔與角色修改'),
          h('p', { class: 'muted' },
            '直接編輯遊戲在 localStorage 中的存檔（同一瀏覽器／同一網址）。遊戲共有 4 個存檔欄位，先用右上角選單選擇欄位；修改後按「儲存存檔」，再重新整理遊戲分頁。')
        ),
        h('div', { class: 'row-actions' },
          selectBox(
            Array.from({ length: SAVE_SLOTS }, (_, i) => {
              const n = i + 1;
              const exists = !!readSave(config, n);
              return { value: n, label: `欄位 ${n}${exists ? '' : '（空）'}` };
            }),
            slot,
            (value) => {
              if (dirty && !confirm('目前有未儲存的變更，確定要切換欄位嗎？')) return;
              slot = Number(value) || 1;
              save = readSave(config, slot);
              dirty = false;
              build();
            }
          ),
          status,
          button('重新讀取', () => {
            save = readSave(config, slot);
            dirty = false;
            build();
            toast(`已重新讀取欄位 ${slot} 的存檔。`, 'info');
          }, 'ghost'),
          button('儲存存檔', persist, 'primary')
        )
      )
    );

    if (!save) {
      root.append(
        h('div', { class: 'panel empty-panel' },
          h('h3', null, `欄位 ${slot} 沒有存檔`),
          h('p', { class: 'muted' }, '這個瀏覽器在這個欄位還沒有遊戲存檔。你可以先開遊戲建立存檔，或在這裡直接建立一份新存檔。'),
          button('建立新存檔', createSave, 'primary')
        )
      );
      return;
    }

    if (config.rules.recalcOnLoad) {
      root.append(
        h('div', { class: 'notice' },
          h('strong', null, '提醒：'),
          ' 「公式規則 → 載入存檔時重算能力」目前是開啟的。你手動修改的 HP/MP/攻擊等上限，會在遊戲載入存檔時依種族與等級重新計算；若要保留手動數值，請先關閉該選項。'
        )
      );
    }

    const s = save;
    const partyCount = s.party.length;
    const unitCount = s.party.length + s.storage.length;

    root.append(
      h('div', { class: 'stats-row' },
        h('div', { class: 'stat' }, h('span', null, '玩家'), h('strong', null, s.playerName)),
        h('div', { class: 'stat' }, h('span', null, '金幣'), h('strong', null, `${s.gold} G`)),
        h('div', { class: 'stat' }, h('span', null, '出戰 / 待命'), h('strong', null, `${partyCount} / ${s.storage.length}`)),
        h('div', { class: 'stat' }, h('span', null, '地圖'), h('strong', null, `${MAPS[s.mapId]?.name ?? s.mapId} (${s.px},${s.py})`)),
        h('div', { class: 'stat' }, h('span', null, '進度'), h('strong', null, `stage ${s.stage}`)),
        h('div', { class: 'stat' }, h('span', null, '成就'), h('strong', null, `${Object.keys(s.achievements ?? {}).length} / ${ACHIEVEMENTS.length}`)),
        h('div', { class: 'stat' }, h('span', null, '合成 / 強化'), h('strong', null, `${s.fusions ?? 0} / ${s.upgrades ?? 0}`))
      )
    );

    // 基本資料
    const flagsArea = textArea(
      JSON.stringify(s.flags ?? {}, null, 2),
      (value) => {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            s.flags = parsed as Record<string, boolean>;
            flagsArea.classList.remove('invalid');
            setDirty(true);
          } else {
            flagsArea.classList.add('invalid');
          }
        } catch {
          flagsArea.classList.add('invalid');
        }
      },
      8
    );

    root.append(
      section(
        '基本資料',
        h('div', { class: 'grid grid-4' },
          field('玩家名稱', textBox(s.playerName, (value) => {
            s.playerName = value;
            setDirty(true);
          })),
          field('金幣', numberBox(s.gold, (value) => {
            s.gold = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('地圖', selectBox(
            Object.entries(MAPS).map(([id, map]) => ({ value: id, label: `${map.name}（${id}）` })),
            s.mapId,
            (value) => {
              s.mapId = value;
              const map = MAPS[value];
              if (map) {
                s.px = Math.floor(map.w / 2);
                s.py = Math.floor(map.h / 2);
              }
              setDirty(true);
              build();
            }
          )),
          field('最後城鎮', selectBox(
            Object.entries(MAPS).filter(([, map]) => map.town).map(([id, map]) => ({
              value: id,
              label: `${map.name}（${id}）`
            })),
            s.lastTown,
            (value) => {
              s.lastTown = value;
              setDirty(true);
            }
          ))
        ),
        h('div', { class: 'grid grid-4' },
          field('X 座標', numberBox(s.px, (value) => {
            s.px = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('Y 座標', numberBox(s.py, (value) => {
            s.py = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('章節進度 stage', numberBox(s.stage, (value) => {
            s.stage = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('遊玩秒數', numberBox(s.playTime, (value) => {
            s.playTime = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 }))
        ),
        h('div', { class: 'grid grid-4' },
          field('步數', numberBox(s.steps, (value) => {
            s.steps = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('戰鬥勝利', numberBox(s.battlesWon, (value) => {
            s.battlesWon = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('捕獲數', numberBox(s.captured, (value) => {
            s.captured = Math.max(0, Math.floor(value));
            setDirty(true);
          }, { min: 0 })),
          field('version', h('input', { class: 'input', value: String(s.version), disabled: true }))
        ),
        field('劇情旗標 flags（JSON）', flagsArea, '格式：{ "quest_started": true }，可用來跳過或重設劇情。')
      )
    );

    // 快捷工具
    const fileInput = h('input', {
      type: 'file',
      accept: '.json,application/json',
      style: { display: 'none' }
    });
    root.append(
      section(
        '快捷工具',
        h('div', { class: 'row-actions wrap' },
          button('全隊治療', () => {
            for (const unit of s.party) {
              unit.hp = unit.max.hp;
              unit.mp = unit.max.mp;
              unit.buffs = [];
              unit.ailment = undefined;
              unit.guarding = false;
            }
            setDirty(true);
            build();
            toast('出戰隊伍已完全恢復。');
          }, 'ghost'),
          button('全體依等級重算', () => {
            for (const unit of [...s.party, ...s.storage]) recalcUnit(unit, true);
            setDirty(true);
            build();
            toast('已依目前種族數值重算所有角色。');
          }, 'ghost'),
          button('解鎖全部圖鑑', () => {
            for (const id of Object.keys(config.species)) s.dex[id] = true;
            setDirty(true);
            build();
            toast('圖鑑已全部解鎖。');
          }, 'ghost'),
          button('下載存檔', () => {
            const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = h('a', { href: url, download: 'stardust-beasts-save.json' });
            document.body.append(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }, 'ghost'),
          button('匯入存檔', () => fileInput.click(), 'ghost'),
          button('刪除存檔', () => {
            if (!confirm(`確定刪除欄位 ${slot} 的遊戲存檔？`)) return;
            localStorage.removeItem(slotKey(slot));
            if (slot === 1) localStorage.removeItem(SAVE_KEY);
            save = null;
            dirty = false;
            build();
            toast(`欄位 ${slot} 的存檔已刪除。`, 'info');
          }, 'danger')
        )
      )
    );

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = normalizeSave(JSON.parse(String(reader.result)) as GameState, config);
          if (!parsed) throw new Error('invalid save');
          parsed.slot = slot;
          save = parsed;
          setDirty(true);
          build();
          toast('存檔已匯入，記得按「儲存存檔」。');
        } catch {
          toast('匯入失敗：不是有效的存檔 JSON。', 'error');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });
    root.append(fileInput);

    // 隊伍
    root.append(
      section(
        `出戰隊伍（${s.party.length}/${MAX_PARTY}）`,
        ...(s.party.length
          ? s.party.map((unit, index) => unitCard(unit, index, true))
          : [empty('隊伍是空的，請從待命加入或新增幻獸。')])
      )
    );

    // 待命
    root.append(
      section(
        `待命幻獸（${s.storage.length}）`,
        ...(s.storage.length
          ? s.storage.map((unit, index) => unitCard(unit, index, false))
          : [empty('目前沒有待命幻獸。')])
      )
    );

    // 新增幻獸
    let newSpecies = Object.keys(config.species)[0] ?? '';
    let newLevel = 5;
    const addPanel = h('div', { class: 'add-unit panel' });
    const speciesSelect = selectBox(
      Object.entries(config.species).map(([id, species]) => ({
        value: id,
        label: `${species.name}（${id}）`
      })),
      newSpecies,
      (value) => (newSpecies = value)
    );
    const levelInput = numberBox(newLevel, (value) => (newLevel = Math.max(1, Math.floor(value))), { min: 1, max: 99 });
    const whereSelect = selectBox(
      [{ value: 'party', label: '出戰隊伍' }, { value: 'storage', label: '待命區' }],
      'storage',
      () => undefined
    );
    addPanel.append(
      h('h3', { class: 'section-title' }, '新增幻獸到存檔'),
      h('div', { class: 'grid grid-3' },
        field('種族', speciesSelect),
        field('等級', levelInput),
        field('放置位置', whereSelect)
      ),
      button('新增', () => {
        if (!newSpecies) return;
        const sp = config.species[newSpecies];
        const max = calcStats(sp, newLevel);
        const unit: Unit = {
          uid: nextUid(s),
          kind: sp.id.startsWith('hero') ? 'hero' : 'pet',
          speciesId: sp.id,
          name: sp.name,
          level: newLevel,
          exp: 0,
          hp: max.hp,
          mp: max.mp,
          max,
          skills: skillsFor(sp, newLevel),
          element: sp.element,
          sprite: spriteOf(sp),
          buffs: []
        };
        s.dex[sp.id] = true;
        if (whereSelect.value === 'party' && s.party.length < MAX_PARTY) s.party.push(unit);
        else s.storage.push(unit);
        setDirty(true);
        build();
        toast(`已新增 ${sp.name} Lv${newLevel}。`);
      }, 'primary')
    );
    root.append(section('新增', addPanel));

    // 道具
    const inventoryRows = Object.keys(config.items).map((id) => {
      const item = config.items[id];
      const count = Number(s.inventory[id] ?? 0);
      return h('div', { class: 'inv-row' },
        h('div', null, h('strong', null, item.name), h('span', { class: 'muted' }, `　${id}　售價 ${Math.floor(item.price * (config.rules?.sellRatio ?? 0.5))} G`)),
        numberBox(count, (value) => {
          const next = Math.max(0, Math.floor(value));
          if (next > 0) s.inventory[id] = next;
          else delete s.inventory[id];
          setDirty(true);
        }, { min: 0 })
      );
    });
    // 存檔裡可能有已刪除的道具，也顯示出來避免遺失
    for (const id of Object.keys(s.inventory)) {
      if (config.items[id]) continue;
      inventoryRows.push(h('div', { class: 'inv-row warning' },
        h('div', null, h('strong', null, id), h('span', { class: 'muted' }, '　（設定中已不存在）')),
        numberBox(s.inventory[id], (value) => {
          const next = Math.max(0, Math.floor(value));
          if (next > 0) s.inventory[id] = next;
          else delete s.inventory[id];
          setDirty(true);
        }, { min: 0 })
      ));
    }
    root.append(section('道具欄', ...(inventoryRows.length ? inventoryRows : [empty('尚未建立任何道具')])));

    // 圖鑑
    const dexChecks = Object.entries(config.species).map(([id, species]) =>
      h('label', { class: 'check compact' },
        checkBox(Boolean(s.dex[id]), (on) => {
          if (on) s.dex[id] = true;
          else delete s.dex[id];
          setDirty(true);
        }),
        h('span', null, `${species.name}（${id}）`)
      )
    );
    root.append(
      section(
        `圖鑑（${Object.keys(s.dex).length}/${Object.keys(config.species).length}）`,
        h('details', { class: 'details' },
          h('summary', null, '展開／收合圖鑑勾選'),
          h('div', { class: 'skill-checks' }, ...dexChecks)
        )
      )
    );

    if (dirty) {
      root.append(h('div', { class: 'floating-save' }, button('儲存存檔', persist, 'primary')));
    }
  }

  build();
  return root;
}
