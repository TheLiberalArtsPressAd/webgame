import { VIEW_H, VIEW_W, scenes, type Scene } from '../engine/scene';
import * as input from '../engine/input';
import { bar, drawBeast, drawHero, label, panel, shade, wrapText } from '../engine/draw';
import { AILMENT_COLOR, AILMENT_ICON, AILMENT_NAME, DEX_REWARDS, ELEMENT_COLOR, ELEMENT_NAME, EQUIP_SLOT_NAME, ITEMS, MAX_SOCKETS, MAX_UPGRADE, SKILLS, SPECIES, STAT_KEYS, STAT_NAME, dexNumber, dexTotal, equipDelta, itemName, passiveOfUnit, upgradeCost, upgradeScale } from '../game/data';
import { session } from '../game/session';
import { MAPS } from '../game/maps';
import {
  MAX_PARTY,
  SAVE_SLOTS,
  addGold,
  addItem,
  canFuse,
  canUpgrade,
  claimDexRewards,
  deleteSave,
  dexCollected,
  equipItem,
  evolveManual,
  evolveOptions,
  fusePets,
  fusionPreview,
  gemSlots,
  grantAchievements,
  inventoryList,
  listSaves,
  loadGame,
  newGame,
  removeGem,
  removeItem,
  saveGame,
  socketGem,
  unequipSlot,
  upgradeEquip,
  type SaveMeta
} from '../game/state';
import { ACHIEVEMENTS } from '../game/achievements';
import { SHOP_STOCK, questHint } from '../game/story';
import {
  abandonQuest,
  allQuests,
  canTake,
  claimQuest,
  dailyState,
  ensureBounties,
  ensureDailies,
  isComplete,
  isFinished,
  isTaken,
  questProgress,
  rerollBounties,
  takeQuest,
  type QuestDef
} from '../game/quests';
import { RULES } from '../game/rules';
import { audio } from '../engine/audio';
import type { EquipSlot, Stats, Unit } from '../game/types';

// ─────────────────────────────────────────────────────────────
// 共用：星空背景
// ─────────────────────────────────────────────────────────────
let stars: { x: number; y: number; r: number; p: number }[] | null = null;
export function resetStars() {
  stars = null;
}
function drawStarfield(ctx: CanvasRenderingContext2D, time: number) {
  if (!stars) {
    stars = [];
    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        r: Math.random() * 1.6 + 0.4,
        p: Math.random() * Math.PI * 2
      });
    }
  }
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#070b16');
  g.addColorStop(0.55, '#0d1428');
  g.addColorStop(1, '#141a34');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (const s of stars) {
    const a = 0.25 + (Math.sin(time * 1.4 + s.p) + 1) * 0.35;
    ctx.fillStyle = `rgba(190,220,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 極光
  for (let i = 0; i < 3; i++) {
    const y = 120 + i * 90 + Math.sin(time * 0.5 + i) * 20;
    const grad = ctx.createLinearGradient(0, y, VIEW_W, y + 60);
    grad.addColorStop(0, 'rgba(80,140,255,0)');
    grad.addColorStop(0.5, `rgba(${100 + i * 40},${140 + i * 30},255,0.07)`);
    grad.addColorStop(1, 'rgba(80,140,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, VIEW_W, 70);
  }
}

// ─────────────────────────────────────────────────────────────
// 標題畫面
// ─────────────────────────────────────────────────────────────
export class TitleScene implements Scene {
  idx = 0;
  time = 0;
  busy = false;
  help = false;
  confirmClear = false;
  msg = '';
  /** 存檔欄位選擇模式 */
  pick: null | 'new' | 'load' | 'clear' = null;
  pickIdx = 0;
  saves: SaveMeta[] = [];
  items = [
    { id: 'new', text: '新的旅程' },
    { id: 'continue', text: '繼續冒險' },
    { id: 'help', text: '操作說明' },
    { id: 'clear', text: '刪除存檔' }
  ];

  enter() {
    audio.setBgm('title');
    this.refreshSaves();
  }

  private refreshSaves() {
    this.saves = listSaves();
  }

  private anySave(): boolean {
    return this.saves.some((s) => s.exists);
  }

  private openPicker(kind: 'new' | 'load' | 'clear') {
    this.refreshSaves();
    if (kind === 'load' && !this.anySave()) {
      this.msg = '目前沒有存檔。';
      return;
    }
    if (kind === 'clear' && !this.anySave()) {
      this.msg = '目前沒有存檔。';
      return;
    }
    this.pick = kind;
    this.pickIdx = Math.max(0, this.saves.findIndex((s) => s.exists));
    if (this.pickIdx < 0) this.pickIdx = 0;
  }

  private closePicker() {
    this.pick = null;
    this.confirmClear = false;
    this.msg = '';
    this.refreshSaves();
  }

  update(dt: number) {
    this.time += dt;
    if (this.busy) return;

    if (this.pick) {
      if (input.nav('arrowup', dt) || input.nav('w', dt)) {
        this.pickIdx = (this.pickIdx - 1 + this.saves.length) % this.saves.length;
        audio.play('select');
      }
      if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
        this.pickIdx = (this.pickIdx + 1) % this.saves.length;
        audio.play('select');
      }
      if (input.consume('escape')) {
        audio.play('cancel');
        this.closePicker();
        return;
      }
      if (input.consume('space', 'enter')) {
        const meta = this.saves[this.pickIdx];
        if (!meta) return;
        if (this.pick === 'new') {
          audio.play('confirm');
          void this.startNew(meta.slot);
        } else if (this.pick === 'load') {
          if (!meta.exists) {
            this.msg = '這個欄位是空的。';
            return;
          }
          audio.play('confirm');
          void this.startLoad(meta.slot);
        } else if (this.pick === 'clear') {
          if (!meta.exists) {
            this.msg = '這個欄位是空的。';
            return;
          }
          if (!this.confirmClear) {
            this.confirmClear = true;
            this.msg = '再按一次空白鍵，確定刪除這個存檔。';
            return;
          }
          deleteSave(meta.slot);
          audio.play('cancel');
          this.confirmClear = false;
          this.msg = `欄位 ${meta.slot} 的存檔已刪除。`;
          this.refreshSaves();
          if (!this.anySave()) this.pick = null;
        }
      }
      return;
    }

    if (this.help) {
      if (input.consume('space', 'enter', 'escape')) this.help = false;
      return;
    }
    if (this.confirmClear) {
      if (input.consume('space', 'enter')) {
        this.confirmClear = false;
        this.msg = '';
      } else if (input.consume('escape')) {
        this.confirmClear = false;
        this.msg = '';
      }
      return;
    }
    if (input.nav('arrowup', dt) || input.nav('w', dt)) {
      this.idx = (this.idx - 1 + this.items.length) % this.items.length;
      audio.play('select');
    }
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
      this.idx = (this.idx + 1) % this.items.length;
      audio.play('select');
    }

    const has = this.anySave();
    if (!has && (this.items[this.idx].id === 'continue')) this.idx = (this.idx + 1) % this.items.length;

    if (input.consume('space', 'enter')) {
      audio.play('confirm');
      const id = this.items[this.idx].id;
      if (id === 'continue' && !has) return;
      if (id === 'new') this.openPicker('new');
      else if (id === 'continue') this.openPicker('load');
      else if (id === 'help') this.help = true;
      else if (id === 'clear') this.openPicker('clear');
    }
  }

  private async startNew(slot: number) {
    this.busy = true;
    const { FieldScene } = await import('./field');
    session.state = newGame('旭', slot);
    saveGame(session.state, slot);
    scenes.set(new FieldScene());
  }

  private async startLoad(slot: number) {
    const s = loadGame(slot);
    if (!s) {
      this.msg = '讀取失敗，存檔可能已損壞。';
      this.busy = false;
      return;
    }
    this.busy = true;
    const { FieldScene } = await import('./field');
    session.state = s;
    scenes.set(new FieldScene());
  }

  render(ctx: CanvasRenderingContext2D) {
    drawStarfield(ctx, this.time);

    // 標題
    const titleY = 158;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 58px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    const grad = ctx.createLinearGradient(0, titleY - 50, 0, titleY + 12);
    grad.addColorStop(0, '#fff6d8');
    grad.addColorStop(0.5, '#ffe08a');
    grad.addColorStop(1, '#c89a3a');
    ctx.shadowColor = 'rgba(255,200,90,0.55)';
    ctx.shadowBlur = 28;
    ctx.fillStyle = grad;
    ctx.fillText('星塵幻獸', VIEW_W / 2, titleY);
    ctx.restore();
    label(ctx, 'S T A R D U S T   B E A S T S', VIEW_W / 2, titleY + 30, {
      size: 14,
      align: 'center',
      color: 'rgba(170,200,255,0.85)'
    });
    label(ctx, '— 原創等角回合制幻獸 RPG —', VIEW_W / 2, titleY + 54, {
      size: 12,
      align: 'center',
      color: 'rgba(150,170,210,0.8)'
    });

    // 示範幻獸
    drawBeast(ctx, 250, 320, 1.5, 1, { shape: 'beast', c1: '#f2703a', c2: '#ffd06a', size: 1 }, this.time);
    drawBeast(ctx, 710, 318, 1.5, 1, { shape: 'bird', c1: '#8fd8f0', c2: '#4f8ad8', size: 1 }, this.time + 1);
    drawBeast(ctx, 480, 300, 1.1, 1, { shape: 'blob', c1: '#efe6f5', c2: '#c9b6e8', size: 1 }, this.time + 2);

    if (this.help) {
      panel(ctx, 200, 60, 560, 480, { fill: 'rgba(8,13,26,0.96)', border: 'rgba(150,190,255,0.6)', radius: 12 });
      label(ctx, '操作說明', 480, 100, { size: 22, align: 'center', color: '#ffe6a8', bold: true });
      const lines = [
        '【探索】',
        '　方向鍵 / WASD　在等角地圖上走動（四方向對應畫面斜向）',
        '　空白鍵 / Enter　與前方的人或告示交談',
        '　Esc　開啟選單（隊伍 / 道具 / 裝備 / 合成 / 圖鑑 / 成就 / 系統）',
        '',
        '【成長】',
        '　裝備頁籤可為幻獸穿戴武器、防具與飾品',
        '　裝備頁籤按 F 強化裝備、G 鑲嵌寶石（每欄位 3 格）',
        '　隊伍頁籤按 V 選擇進化分支（需符合等級 / 潛能條件）',
        '　合成頁籤可把兩隻幻獸合成，誕生隱藏種族',
        '　收集越多幻獸，可在圖鑑領取階段獎勵',
        '　委託板每天更新 3 件每日委託，按 R 可更換隨機委託',
        '　成就會在達成時自動發放獎勵',
        '',
        '【戰鬥】',
        '　↑↓ 選擇指令，空白鍵確定，Esc 返回上層',
        '　攻擊／技能／道具／封印／防禦／逃走',
        '　封印需要「封印石」，敵方 HP 越低成功率越高',
        '',
        '【屬性相剋】',
        '　火 → 風 → 地 → 水 → 火（效果絕佳 1.6 倍）',
        '',
        '　按 空白鍵 關閉'
      ];
      lines.forEach((l, i) =>
        label(ctx, l, 236, 130 + i * 20, {
          size: 13,
          color: l.startsWith('【') ? '#8ed0ff' : '#d8e4ff'
        })
      );
      return;
    }

    // 存檔欄位選擇
    if (this.pick) {
      const title =
        this.pick === 'new' ? '選擇要開始的存檔欄位' : this.pick === 'load' ? '選擇要讀取的存檔' : '選擇要刪除的存檔';
      panel(ctx, 180, 96, 600, 400, {
        fill: 'rgba(8,13,26,0.96)',
        border: 'rgba(150,190,255,0.6)',
        radius: 12
      });
      label(ctx, title, VIEW_W / 2, 136, { size: 20, align: 'center', color: '#ffe6a8', bold: true });
      this.saves.forEach((m, i) => {
        const y = 176 + i * 68;
        const sel = i === this.pickIdx;
        const empty = !m.exists;
        if (sel) {
          panel(ctx, 206, y - 22, 548, 56, {
            radius: 8,
            fill: 'rgba(70,120,220,0.4)',
            border: 'rgba(180,220,255,0.9)'
          });
        }
        label(ctx, `欄位 ${m.slot}`, 222, y, { size: 15, color: sel ? '#ffffff' : '#c8d4e8', bold: true });
        if (empty) {
          label(ctx, '— 空 —', 320, y, { size: 14, color: '#5a6478' });
        } else {
          label(ctx, `${m.name}　Lv${m.level ?? '?'}　${m.mapId ? (MAPS[m.mapId]?.name ?? m.mapId) : ''}`, 320, y, {
            size: 14,
            color: '#e8eefc'
          });
          const hh = Math.floor((m.playTime ?? 0) / 3600);
          const mm = Math.floor(((m.playTime ?? 0) % 3600) / 60);
          label(ctx, `圖鑑 ${m.dexCount ?? 0}　${m.gold ?? 0} G　遊戲時間 ${hh}:${String(mm).padStart(2, '0')}`, 320, y + 20, {
            size: 11,
            color: '#8a98b0'
          });
        }
      });
      label(ctx, '↑↓ 選擇　空白鍵 確定　Esc 返回', VIEW_W / 2, 462, {
        size: 12,
        align: 'center',
        color: 'rgba(160,180,215,0.85)'
      });
      if (this.msg) {
        label(ctx, this.msg, VIEW_W / 2, 480, {
          size: 13,
          align: 'center',
          color: this.confirmClear ? '#ffb0b0' : '#ffe6a8'
        });
      }
      return;
    }

    // 選單
    const my = 400;
    this.items.forEach((it, i) => {
      const sel = i === this.idx;
      const y = my + i * 34;
      const disabled = it.id === 'continue' && !this.anySave();
      if (sel) {
        panel(ctx, VIEW_W / 2 - 120, y - 20, 240, 30, {
          radius: 6,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.8)'
        });
      }
      label(ctx, it.text, VIEW_W / 2, y, {
        size: 17,
        align: 'center',
        color: disabled ? '#5a6478' : sel ? '#ffffff' : '#c8d4e8',
        bold: sel
      });
    });

    label(ctx, '↑↓ 選擇　空白鍵 確定', VIEW_W / 2, VIEW_H - 26, {
      size: 12,
      align: 'center',
      color: 'rgba(160,180,215,0.8)'
    });

    if (this.msg) {
      panel(ctx, VIEW_W / 2 - 200, VIEW_H - 76, 400, 30, { alpha: 0.94, radius: 6 });
      label(ctx, this.msg, VIEW_W / 2, VIEW_H - 55, {
        size: 13,
        align: 'center',
        color: this.confirmClear ? '#ffb0b0' : '#ffe6a8'
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 主選單（場上按 Esc）
// ─────────────────────────────────────────────────────────────
export class MenuScene implements Scene {
  tab = 0;
  time = 0;
  tabs = ['隊伍', '道具', '裝備', '合成', '圖鑑', '成就', '系統'];
  unitIdx = 0;
  itemIdx = 0;
  equipSlotIdx = 0;
  pickIdx = 0;
  dexIdx = 0;
  sysIdx = 0;
  sub: 'none' | 'itemTarget' | 'equipPick' | 'gemPick' | 'evolvePick' = 'none';
  targetIdx = 0;
  message = '';
  messageT = 0;
  dexList: string[] = [];
  /** 裝備頁：工房模式 */
  forge: 'none' | 'upgrade' | 'gem' = 'none';
  gemIdx = 0;
  /** 合成頁 */
  fuseA: number | null = null;
  fuseB: number | null = null;
  fuseCursor = 0;
  /** 成就頁 */
  achIdx = 0;

  constructor(private onClose?: () => void) {
    this.dexList = Object.keys(session.state.dex).filter((k) => SPECIES[k]);
    for (const a of grantAchievements(session.state)) {
      this.message = `🏆 成就達成：${a.name}`;
      this.messageT = 2.2;
    }
  }

  private units(): Unit[] {
    return [...session.state.party, ...session.state.storage];
  }

  /** 指定欄位可裝備的道具（背包內） */
  private equipCandidates(slot: 'weapon' | 'armor' | 'accessory'): string[] {
    return inventoryList(session.state)
      .map((e) => e.id)
      .filter((id) => {
        const def = ITEMS[id];
        return !!def && def.effect.type === 'equip' && def.effect.slot === slot;
      });
  }

  update(dt: number) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;

    if (this.sub === 'itemTarget') {
      const list = session.state.party;
      if (input.nav('arrowleft', dt) || input.nav('a', dt)) this.targetIdx = (this.targetIdx - 1 + list.length) % list.length;
      if (input.nav('arrowright', dt) || input.nav('d', dt)) this.targetIdx = (this.targetIdx + 1) % list.length;
      if (input.consume('escape')) {
        this.sub = 'none';
        return;
      }
      if (input.consume('space', 'enter')) {
        const ids = inventoryList(session.state).filter((e) => ITEMS[e.id]?.use !== 'none');
        const entry = ids[this.itemIdx];
        const target = list[this.targetIdx];
        if (entry && target) this.useItem(entry.id, target);
        this.sub = 'none';
      }
      return;
    }

    if (this.sub === 'equipPick') {
      this.updateEquipPick(dt);
      return;
    }

    if (this.sub === 'gemPick') {
      this.updateGemPick(dt);
      return;
    }

    if (this.sub === 'evolvePick') {
      this.updateEvolvePick(dt);
      return;
    }

    if (input.consume('escape')) {
      audio.play('cancel');
      this.close();
      return;
    }
    // 頁籤切換：只用 Q / E 與 Tab，避免與裝備頁的 ←→ 選欄位衝突
    const prevTab = this.tab;
    if (input.consume('q')) this.tab = (this.tab - 1 + this.tabs.length) % this.tabs.length;
    if (input.consume('e')) this.tab = (this.tab + 1) % this.tabs.length;
    if (input.consume('tab')) this.tab = (this.tab + 1) % this.tabs.length;
    if (this.tab !== prevTab) {
      audio.play('select');
      if (this.tab !== 2) this.forge = 'none';
    }

    if (this.tab === 0) this.updateParty(dt);
    else if (this.tab === 1) this.updateItems(dt);
    else if (this.tab === 2) this.updateEquip(dt);
    else if (this.tab === 3) this.updateFuse(dt);
    else if (this.tab === 4) this.updateDex(dt);
    else if (this.tab === 5) this.updateAchievements(dt);
    else this.updateSystem(dt);
  }

  private close() {
    this.onClose?.();
    scenes.pop();
  }

  private updateParty(dt: number) {
    const list = this.units();
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.unitIdx = (this.unitIdx - 1 + list.length) % list.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.unitIdx = (this.unitIdx + 1) % list.length;
    if (input.consume('space', 'enter')) {
      const u = list[this.unitIdx];
      const s = session.state;
      const pi = s.party.indexOf(u);
      if (pi >= 0) {
        if (s.party.length <= 1) {
          this.flash('至少要保留一隻幻獸在隊伍中。');
          return;
        }
        s.party.splice(pi, 1);
        s.storage.push(u);
        this.unitIdx = Math.min(this.unitIdx, list.length - 1);
        this.flash(`${u.name} 移到待命區。`);
      } else {
        if (s.party.length >= MAX_PARTY) {
          this.flash(`出戰隊伍已滿（上限 ${MAX_PARTY}）。`);
          return;
        }
        const si = s.storage.indexOf(u);
        s.storage.splice(si, 1);
        s.party.push(u);
        this.flash(`${u.name} 編入出戰隊伍。`);
      }
    }
    if (input.consume('v')) {
      const u = list[this.unitIdx];
      const opts = u ? evolveOptions(session.state, u) : [];
      if (opts.length > 0) {
        this.sub = 'evolvePick';
        this.pickIdx = 0;
        audio.play('select');
      } else {
        this.flash('目前沒有符合條件的進化分支。');
      }
    }
  }

  private updateItems(dt: number) {
    const list = inventoryList(session.state);
    if (list.length === 0) return;
    if (this.itemIdx >= list.length) this.itemIdx = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.itemIdx = (this.itemIdx - 1 + list.length) % list.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.itemIdx = (this.itemIdx + 1) % list.length;
    if (input.consume('space', 'enter')) {
      const entry = list[this.itemIdx];
      const def = entry ? ITEMS[entry.id] : undefined;
      if (!def || def.use === 'battle') {
        this.flash('這個道具只能在戰鬥中使用。');
        return;
      }
      if (def.effect.type === 'equip') {
        this.flash('裝備道具：請切換到「裝備」頁籤穿戴。');
        return;
      }
      if (def.use === 'none') {
        this.flash('這個道具沒有使用效果，可以賣給商人。');
        return;
      }
      this.sub = 'itemTarget';
      this.targetIdx = 0;
    }
  }

  // ── 裝備 ─────────────────────────────────────────────────
  private updateEquip(dt: number) {
    const list = this.units();
    if (list.length === 0) return;
    if (this.unitIdx >= list.length) this.unitIdx = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.unitIdx = (this.unitIdx - 1 + list.length) % list.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.unitIdx = (this.unitIdx + 1) % list.length;
    if (input.nav('arrowleft', dt)) this.equipSlotIdx = (this.equipSlotIdx + 2) % 3;
    if (input.nav('arrowright', dt)) this.equipSlotIdx = (this.equipSlotIdx + 1) % 3;
    const u = list[this.unitIdx];
    const slot = (['weapon', 'armor', 'accessory'] as const)[this.equipSlotIdx];

    if (input.consume('f')) {
      this.forge = this.forge === 'upgrade' ? 'none' : 'upgrade';
      audio.play('select');
      return;
    }
    if (input.consume('g')) {
      this.forge = this.forge === 'gem' ? 'none' : 'gem';
      this.gemIdx = 0;
      audio.play('select');
      return;
    }

    if (this.forge === 'upgrade') {
      if (input.consume('space', 'enter') && u) {
        if (upgradeEquip(session.state, u, slot)) {
          audio.play('forge');
          this.flash(`${ITEMS[u.equip?.[slot] ?? '']?.name ?? '裝備'} 強化至 +${(u.equipUp?.[slot] ?? 0)}！`);
        } else {
          audio.play('cancel');
          const c = canUpgrade(session.state, u, slot);
          this.flash(c.reason ?? '無法強化。');
        }
      }
      return;
    }

    if (this.forge === 'gem') {
      if (input.consume('space', 'enter')) {
        this.sub = 'gemPick';
        this.pickIdx = 0;
        this.gemIdx = 0;
      } else if (input.consume('x')) {
        const gems = u?.gems?.[slot] ?? [];
        if (u && gems.length > 0) {
          const last = gems[gems.length - 1];
          if (removeGem(session.state, u, slot, gems.length - 1)) {
            audio.play('cancel');
            this.flash(`取下了 ${ITEMS[last]?.name ?? last}。`);
          }
        } else {
          this.flash('這個欄位沒有鑲嵌寶石。');
        }
      }
      return;
    }

    if (input.consume('space', 'enter')) {
      this.sub = 'equipPick';
      this.pickIdx = 0;
    }
  }

  private updateGemPick(dt: number) {
    const u = this.units()[this.unitIdx];
    if (!u) {
      this.sub = 'none';
      return;
    }
    const slot = (['weapon', 'armor', 'accessory'] as const)[this.equipSlotIdx];
    const gems = inventoryList(session.state)
      .map((e) => e.id)
      .filter((id) => ITEMS[id]?.effect.type === 'gem');
    if (input.consume('escape')) {
      this.sub = 'none';
      return;
    }
    if (gems.length === 0) {
      this.sub = 'none';
      this.flash('背包裡沒有寶石。可在商店購買。');
      return;
    }
    if (this.pickIdx >= gems.length) this.pickIdx = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.pickIdx = (this.pickIdx - 1 + gems.length) % gems.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.pickIdx = (this.pickIdx + 1) % gems.length;
    if (input.consume('space', 'enter')) {
      const id = gems[this.pickIdx];
      if (socketGem(session.state, u, slot, id)) {
        audio.play('socket');
        this.flash(`${u.name} 鑲嵌了 ${ITEMS[id]?.name ?? id}。`);
      } else {
        audio.play('cancel');
        this.flash('無法鑲嵌（欄位已滿或道具不足）。');
      }
      this.sub = 'none';
    }
  }

  private updateEvolvePick(dt: number) {
    const u = this.units()[this.unitIdx];
    if (!u) {
      this.sub = 'none';
      return;
    }
    const opts = evolveOptions(session.state, u);
    if (opts.length === 0) {
      this.sub = 'none';
      return;
    }
    if (this.pickIdx >= opts.length) this.pickIdx = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.pickIdx = (this.pickIdx - 1 + opts.length) % opts.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.pickIdx = (this.pickIdx + 1) % opts.length;
    if (input.consume('escape')) {
      this.sub = 'none';
      return;
    }
    if (input.consume('space', 'enter')) {
      const branch = opts[this.pickIdx];
      if (branch) {
        const itemNameTxt = branch.item ? ITEMS[branch.item]?.name ?? branch.item : '';
        if (branch.item && (session.state.inventory[branch.item] ?? 0) <= 0) {
          this.flash(`需要 ${itemNameTxt}。`);
          return;
        }
        const name = evolveManual(session.state, u, branch.species);
        if (name) {
          audio.play('levelup');
          this.flash(`${u.name} 進化成 ${name}！`);
        } else {
          audio.play('cancel');
          this.flash('進化失敗。');
        }
      }
      this.sub = 'none';
    }
  }

  private updateEquipPick(dt: number) {
    const u = this.units()[this.unitIdx];
    if (!u) {
      this.sub = 'none';
      return;
    }
    const slot = (['weapon', 'armor', 'accessory'] as const)[this.equipSlotIdx];
    const cands = this.equipCandidates(slot);
    const cur = u.equip?.[slot];
    // 第 0 項為「卸下」（無裝備時不可選）
    const total = (cur ? 1 : 0) + cands.length;
    if (total === 0) {
      this.sub = 'none';
      this.flash('背包裡沒有這個欄位的裝備。');
      return;
    }
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.pickIdx = (this.pickIdx - 1 + total) % total;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.pickIdx = (this.pickIdx + 1) % total;
    if (input.consume('escape')) {
      this.sub = 'none';
      return;
    }
    if (input.consume('space', 'enter')) {
      if (cur && this.pickIdx === 0) {
        const removed = unequipSlot(session.state, u, slot);
        audio.play('cancel');
        this.flash(`${u.name} 卸下了 ${ITEMS[removed ?? '']?.name ?? '裝備'}。`);
      } else {
        const id = cands[this.pickIdx - (cur ? 1 : 0)];
        if (id && equipItem(session.state, u, id)) {
          audio.play('confirm');
          this.flash(`${u.name} 裝備了 ${ITEMS[id]?.name ?? id}。`);
        }
      }
      this.sub = 'none';
    }
  }

  private useItem(id: string, target: Unit) {
    const def = ITEMS[id];
    if (!def || !removeItem(session.state, id, 1)) return;
    switch (def.effect.type) {
      case 'heal': {
        const amount = Math.min(def.effect.power, target.max.hp - target.hp);
        target.hp += amount;
        this.flash(`${target.name} 回復了 ${amount} HP。`);
        break;
      }
      case 'mp': {
        const amount = Math.min(def.effect.power, target.max.mp - target.mp);
        target.mp += amount;
        this.flash(`${target.name} 回復了 ${amount} MP。`);
        break;
      }
      case 'revive': {
        if (target.hp > 0) {
          addItem(session.state, id, 1);
          this.flash(`${target.name} 尚未倒下。`);
          return;
        }
        target.hp = Math.max(1, Math.floor(target.max.hp * def.effect.power));
        this.flash(`${target.name} 復活了！`);
        break;
      }
      case 'cure': {
        if (!target.ailment) {
          addItem(session.state, id, 1);
          this.flash(`${target.name} 並沒有異常狀態。`);
          return;
        }
        const name = AILMENT_NAME[target.ailment];
        target.ailment = undefined;
        target.ailmentTurns = 0;
        this.flash(`${target.name} 的${name}被解除了。`);
        break;
      }
      case 'healAll': {
        let total = 0;
        for (const u of session.state.party) {
          const amount = Math.min(def.effect.power, u.max.hp - u.hp);
          u.hp += amount;
          total += amount;
        }
        this.flash(`全隊回復了共 ${total} HP。`);
        break;
      }
      case 'teach': {
        const skillId = def.effect.skill;
        const sk = SKILLS[skillId];
        if (!sk) {
          addItem(session.state, id, 1);
          this.flash('技能石的內容已損毀。');
          return;
        }
        if (target.skills.includes(skillId)) {
          addItem(session.state, id, 1);
          this.flash(`${target.name} 已經學會${sk.name}了。`);
          return;
        }
        target.skills.push(skillId);
        this.flash(`${target.name} 學會了「${sk.name}」！`);
        break;
      }
      case 'warp': {
        const town = session.state.lastTown ?? 'village';
        const sp = MAPS[town]?.spawn ?? { x: 9, y: 11 };
        session.state.mapId = town;
        session.state.px = sp.x;
        session.state.py = sp.y;
        session.state.facing = 2;
        this.flash(`傳送羽將你送回了 ${MAPS[town]?.name ?? '城鎮'}。`);
        this.close();
        break;
      }
      default:
        this.flash('這個道具現在沒有用。');
        addItem(session.state, id, 1);
    }
  }

  private updateDex(dt: number) {
    if (input.consume('space', 'enter')) {
      const got = claimDexRewards(session.state);
      audio.play(got.length ? 'levelup' : 'cancel');
      this.flash(got.length ? `領取了 ${got.length} 項圖鑑獎勵！` : '目前沒有可領取的圖鑑獎勵。');
      for (const a of grantAchievements(session.state)) {
        this.message = `🏆 成就達成：${a.name}`;
        this.messageT = 2.4;
      }
    }
    if (this.dexList.length === 0) return;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.dexIdx = (this.dexIdx - 1 + this.dexList.length) % this.dexList.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.dexIdx = (this.dexIdx + 1) % this.dexList.length;
  }

  // ── 合成 ─────────────────────────────────────────────────
  private updateFuse(dt: number) {
    const list = this.units().filter((u) => u.kind === 'pet');
    if (list.length === 0) return;
    if (this.fuseCursor >= list.length) this.fuseCursor = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) {
      this.fuseCursor = (this.fuseCursor - 1 + list.length) % list.length;
      audio.play('select');
    }
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
      this.fuseCursor = (this.fuseCursor + 1) % list.length;
      audio.play('select');
    }
    const cur = list[this.fuseCursor];
    if (input.consume('space')) {
      if (!cur) return;
      if (this.fuseA === null) {
        this.fuseA = cur.uid;
        audio.play('confirm');
      } else if (this.fuseB === null && cur.uid !== this.fuseA) {
        this.fuseB = cur.uid;
        audio.play('confirm');
      } else {
        this.fuseA = cur.uid;
        this.fuseB = null;
        audio.play('select');
      }
    }
    if (input.consume('x', 'escape')) {
      this.fuseA = null;
      this.fuseB = null;
      audio.play('cancel');
    }
    if (input.consume('enter')) {
      const a = [...session.state.party, ...session.state.storage].find((u) => u.uid === this.fuseA);
      const b = [...session.state.party, ...session.state.storage].find((u) => u.uid === this.fuseB);
      if (!a || !b) {
        this.flash('請先選兩隻幻獸（空白鍵選擇）。');
        return;
      }
      const err = canFuse(session.state, a, b);
      if (err) {
        this.flash(err);
        return;
      }
      const preview = fusionPreview(session.state, a, b);
      if (!preview) {
        this.flash('這個組合無法合成。');
        return;
      }
      if (!preview.canAfford) {
        this.flash(`金幣不足（需要 ${preview.cost} G）。`);
        return;
      }
      const res = fusePets(session.state, a, b);
      if (!res) {
        this.flash('合成失敗。');
        return;
      }
      audio.play('fuse');
      const sp = SPECIES[res.unit.speciesId];
      this.flash(`合成成功！誕生了 ${sp?.name ?? res.unit.speciesId}（潛能 ${res.unit.potential}）。`);
      this.fuseA = null;
      this.fuseB = null;
      this.fuseCursor = 0;
      for (const ac of grantAchievements(session.state)) {
        this.message = `🏆 成就達成：${ac.name}`;
        this.messageT = 2.6;
      }
    }
  }

  // ── 成就 ─────────────────────────────────────────────────
  private updateAchievements(dt: number) {
    if (input.nav('arrowup', dt) || input.nav('w', dt)) {
      this.achIdx = Math.max(0, this.achIdx - 1);
      audio.play('select');
    }
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
      this.achIdx = Math.min(ACHIEVEMENTS.length - 1, this.achIdx + 1);
      audio.play('select');
    }
  }

  private updateSystem(dt: number) {
    const items = this.systemItems();
    if (this.sysIdx >= items.length) this.sysIdx = 0;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) {
      this.sysIdx = (this.sysIdx - 1 + items.length) % items.length;
      audio.play('select');
    }
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
      this.sysIdx = (this.sysIdx + 1) % items.length;
      audio.play('select');
    }
    if (input.consume('space', 'enter')) {
      if (this.sysIdx === 0) {
        audio.play('confirm');
        const ok = saveGame(session.state, session.state.slot);
        this.flash(ok ? `已儲存至欄位 ${session.state.slot}。` : '儲存失敗（瀏覽器儲存空間可能被停用）。');
      } else if (this.sysIdx === 1) {
        audio.play('confirm');
        const s = loadGame(session.state.slot);
        if (s) {
          session.state = s;
          this.flash(`已從欄位 ${s.slot} 重新載入存檔。`);
          this.unitIdx = 0;
          this.itemIdx = 0;
        } else {
          this.flash('這個欄位沒有存檔。');
        }
      } else if (this.sysIdx === 2) {
        audio.play('select');
        const next = (session.state.slot % SAVE_SLOTS) + 1;
        session.state.slot = next;
        this.flash(`已切換至欄位 ${next}。儲存時會寫入這個欄位。`);
      } else if (this.sysIdx === 3) {
        const muted = audio.toggleMute();
        this.flash(muted ? '已關閉音效與音樂。' : '已開啟音效與音樂。');
      } else {
        audio.play('cancel');
        void this.toTitle();
      }
    }
  }

  private systemItems(): string[] {
    return [
      '儲存進度',
      '重新載入存檔',
      `存檔欄位：${session.state.slot}`,
      audio.muted ? '音效：關閉' : '音效：開啟',
      '回到標題畫面'
    ];
  }

  private async toTitle() {
    const m = await import('./menus');
    m.resetStars();
    scenes.set(new m.TitleScene());
  }

  private flash(msg: string) {
    this.message = msg;
    this.messageT = 2.2;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(4,7,14,0.92)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    const s = session.state;
    const bx = 24;
    const by = 20;
    const bw = VIEW_W - 48;
    const bh = VIEW_H - 40;

    panel(ctx, bx, by, bw, bh, { fill: 'rgba(10,16,30,0.96)', border: 'rgba(120,170,255,0.5)', radius: 12 });

    // 頁籤
    this.tabs.forEach((t, i) => {
      const tw = 96;
      const tx = bx + 20 + i * (tw + 6);
      const sel = i === this.tab;
      panel(ctx, tx, by + 16, tw, 34, {
        radius: 6,
        fill: sel ? 'rgba(70,120,220,0.55)' : 'rgba(20,30,52,0.8)',
        border: sel ? 'rgba(180,220,255,0.9)' : 'rgba(90,120,170,0.35)'
      });
      label(ctx, t, tx + tw / 2, by + 39, {
        size: 15,
        align: 'center',
        color: sel ? '#ffffff' : '#9fb0cc',
        bold: sel
      });
    });

    label(ctx, `${s.gold} G`, bx + bw - 24, by + 39, {
      size: 16,
      align: 'right',
      color: '#ffd76a',
      bold: true
    });

    const cy = by + 66;
    if (this.tab === 0) this.renderParty(ctx, bx + 20, cy, bw - 40, bh - 92);
    else if (this.tab === 1) this.renderItems(ctx, bx + 20, cy, bw - 40, bh - 92);
    else if (this.tab === 2) this.renderEquip(ctx, bx + 20, cy, bw - 40, bh - 92);
    else if (this.tab === 3) this.renderFuse(ctx, bx + 20, cy, bw - 40, bh - 92);
    else if (this.tab === 4) this.renderDex(ctx, bx + 20, cy, bw - 40, bh - 92);
    else if (this.tab === 5) this.renderAchievements(ctx, bx + 20, cy, bw - 40, bh - 92);
    else this.renderSystem(ctx, bx + 20, cy, bw - 40, bh - 92);

    if (this.messageT > 0) {
      panel(ctx, VIEW_W / 2 - 240, VIEW_H - 74, 480, 30, { alpha: 0.95, radius: 6 });
      label(ctx, this.message, VIEW_W / 2, VIEW_H - 53, {
        size: 14,
        align: 'center',
        color: '#ffe6a8'
      });
    }

    // 進化分支選擇（隊伍頁按 V）
    if (this.sub === 'evolvePick') {
      const u = this.units()[this.unitIdx];
      const opts = u ? evolveOptions(session.state, u) : [];
      const pw = 520;
      const ph = Math.min(VIEW_H - 120, 90 + Math.max(1, opts.length) * 40);
      const px = (VIEW_W - pw) / 2;
      const py = (VIEW_H - ph) / 2;
      panel(ctx, px, py, pw, ph, { fill: 'rgba(6,10,20,0.98)', border: 'rgba(180,220,255,0.85)', radius: 12 });
      label(ctx, `${u?.name ?? ''} － 選擇進化分支`, px + pw / 2, py + 30, {
        size: 16,
        align: 'center',
        color: '#ffe6a8',
        bold: true
      });
      opts.forEach((e, i) => {
        const sp = SPECIES[e.species];
        const sel = i === this.pickIdx;
        const ly = py + 56 + i * 40;
        if (sel) {
          panel(ctx, px + 14, ly - 4, pw - 28, 36, {
            radius: 6,
            fill: 'rgba(70,120,220,0.45)',
            border: 'rgba(180,220,255,0.85)'
          });
        }
        label(ctx, `→ ${sp?.name ?? e.species}`, px + 30, ly + 18, {
          size: 15,
          color: sp?.hidden ? '#ffd76a' : '#e8eefc',
          bold: true
        });
        const cond: string[] = [`Lv${e.level}`];
        if (e.item) cond.push(`需 ${ITEMS[e.item]?.name ?? e.item}×${session.state.inventory[e.item] ?? 0}`);
        if (e.minPotential) cond.push(`潛能≥${e.minPotential}`);
        label(ctx, cond.join('　'), px + 230, ly + 18, { size: 12, color: '#c8d4e8' });
        if (sp?.hidden) label(ctx, '★隱藏', px + pw - 30, ly + 18, { size: 11, align: 'right', color: '#ffd76a' });
      });
      label(ctx, '↑↓ 選擇　空白鍵 進化　Esc 取消', px + pw / 2, py + ph - 16, {
        size: 11,
        align: 'center',
        color: '#8a98b0'
      });
    }

    const foot =
      this.sub === 'evolvePick'
        ? '↑↓ 選擇進化分支　空白鍵 確定　Esc 取消'
        : this.sub === 'gemPick'
          ? '↑↓ 選擇寶石　空白鍵 鑲嵌　Esc 取消'
          : this.tab === 2
            ? '空白鍵 換裝　F 強化　G 鑲嵌　X 取下寶石　Q/E 頁籤　Esc 關閉'
            : this.tab === 3
              ? '空白鍵 選擇幻獸　Enter 合成　X 清除　Q/E 頁籤　Esc 關閉'
              : 'Q / E 切換頁籤　↑↓ 選擇　空白鍵 確定　Esc 關閉';
    label(ctx, foot, VIEW_W / 2, VIEW_H - 12, {
      size: 11,
      align: 'center',
      color: 'rgba(150,170,210,0.8)'
    });
  }

  private renderParty(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const list = this.units();
    const lw = 300;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, `出戰 / 待命（出戰上限 ${MAX_PARTY}）`, x + 14, y + 22, {
      size: 12,
      color: '#8ed0ff',
      bold: true
    });

    list.forEach((u, i) => {
      const ly = y + 36 + i * 30;
      if (ly > y + h - 10) return;
      const sel = i === this.unitIdx;
      const inParty = session.state.party.includes(u);
      if (sel) {
        panel(ctx, x + 8, ly - 2, lw - 16, 26, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.7)',
          borderWidth: 1
        });
      }
      ctx.fillStyle = ELEMENT_COLOR[u.element];
      ctx.beginPath();
      ctx.arc(x + 24, ly + 11, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, u.name, x + 38, ly + 16, { size: 14, color: '#e8eefc', bold: true });
      label(ctx, `Lv${u.level}`, x + 128, ly + 16, { size: 12, color: '#a8b6cc' });
      bar(ctx, x + 172, ly + 5, 70, 8, u.hp / u.max.hp, {
        color: u.hp / u.max.hp > 0.5 ? '#54d16a' : '#e05a5a',
        border: 'rgba(255,255,255,0.2)'
      });
      label(ctx, inParty ? '出戰' : '待命', x + lw - 20, ly + 16, {
        size: 11,
        align: 'right',
        color: inParty ? '#8ef0a8' : '#8a98b0'
      });
    });

    // 詳情
    const u = list[this.unitIdx];
    if (!u) return;
    const dx = x + lw + 16;
    const dw = w - lw - 16;
    panel(ctx, dx, y, dw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });

    const sp = SPECIES[u.speciesId];
    label(ctx, u.name, dx + 20, y + 30, { size: 20, color: '#ffe6a8', bold: true });
    label(ctx, `Lv ${u.level}　${ELEMENT_NAME[u.element]}屬性`, dx + 20, y + 54, {
      size: 13,
      color: ELEMENT_COLOR[u.element]
    });
    if ((u.potential ?? 0) > 0) {
      label(ctx, `潛能 ${u.potential}${u.generation ? `　第 ${u.generation} 代` : ''}`, dx + 180, y + 54, {
        size: 12,
        color: '#ffd76a'
      });
    }
    {
      const opts = evolveOptions(session.state, u);
      if (opts.length > 0) {
        label(ctx, `可進化（V）→ ${opts.map((e) => SPECIES[e.species]?.name ?? e.species).join('、')}`, dx + 20, y + 72, {
          size: 12,
          color: '#9fe0ff'
        });
      }
    }
    if (u.ailment) {
      label(ctx, `${AILMENT_ICON[u.ailment]} ${AILMENT_NAME[u.ailment]}`, dx + 20, y + 74, {
        size: 13,
        color: AILMENT_COLOR[u.ailment],
        bold: true
      });
    }
    drawBeast(ctx, dx + dw - 90, y + 100, 1.5, 1, u.sprite, this.time);

    if (sp) {
      const desc = wrapText(ctx, sp.desc, dw - 200, 12);
      desc.forEach((l, i) => label(ctx, l, dx + 20, y + 82 + i * 18, { size: 12, color: '#a8b6cc' }));
    }

    const stats: [string, number, number][] = [
      ['HP', u.hp, u.max.hp],
      ['MP', u.mp, u.max.mp],
      ['攻擊', u.max.atk, 0],
      ['防禦', u.max.def, 0],
      ['魔力', u.max.mag, 0],
      ['速度', u.max.spd, 0]
    ];
    const sy = y + 160;
    stats.forEach((st, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = dx + 20 + col * (dw / 2 - 20);
      const yy = sy + row * 26;
      label(ctx, st[0], sx, yy, { size: 13, color: '#8a98b0' });
      label(ctx, st[2] > 0 ? `${st[1]} / ${st[2]}` : `${st[1]}`, sx + 62, yy, {
        size: 14,
        color: '#e8eefc',
        bold: true
      });
    });

    label(ctx, '技能', dx + 20, sy + 96, { size: 13, color: '#8ed0ff', bold: true });
    u.skills.forEach((id, i) => {
      const sk = SKILLS[id];
      if (!sk) return;
      label(ctx, `${sk.name}`, dx + 30 + (i % 2) * (dw / 2 - 20), sy + 120 + Math.floor(i / 2) * 22, {
        size: 13,
        color: '#e8eefc'
      });
      label(ctx, `MP${sk.mp} ${sk.desc}`, dx + 30 + (i % 2) * (dw / 2 - 20) + 0, sy + 134 + Math.floor(i / 2) * 22, {
        size: 10,
        color: '#8a98b0'
      });
    });

    label(ctx, '空白鍵：在「出戰」與「待命」之間切換　V：進化', dx + 20, y + h - 16, {
      size: 11,
      color: '#8a98b0'
    });
  }

  private renderItems(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const list = inventoryList(session.state);
    const lw = 340;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, '持有道具', x + 14, y + 22, { size: 12, color: '#8ed0ff', bold: true });

    if (list.length === 0) {
      label(ctx, '（空）', x + 20, y + 54, { size: 13, color: '#8a98b0' });
    }
    list.forEach((e, i) => {
      const ly = y + 36 + i * 28;
      if (ly > y + h - 10) return;
      const sel = i === this.itemIdx && this.sub === 'none';
      if (sel) {
        panel(ctx, x + 8, ly - 2, lw - 16, 24, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.7)',
          borderWidth: 1
        });
      }
      const def = ITEMS[e.id];
      label(ctx, def?.name ?? e.id, x + 22, ly + 15, { size: 14, color: '#e8eefc', bold: sel });
      label(ctx, `×${e.n}`, x + lw - 20, ly + 15, { size: 13, align: 'right', color: '#ffd76a' });
    });

    const dx = x + lw + 16;
    const dw = w - lw - 16;
    panel(ctx, dx, y, dw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });

    if (this.sub === 'itemTarget') {
      const entry = list[this.itemIdx];
      label(ctx, `使用 ${entry ? itemName(entry.id) : ''} → 選擇對象`, dx + 20, y + 30, {
        size: 16,
        color: '#ffe6a8',
        bold: true
      });
      session.state.party.forEach((u, i) => {
        const sel = i === this.targetIdx;
        const ty = y + 70 + i * 44;
        if (sel) {
          panel(ctx, dx + 16, ty - 26, dw - 32, 40, {
            radius: 6,
            fill: 'rgba(70,120,220,0.4)',
            border: 'rgba(180,220,255,0.8)'
          });
        }
        label(ctx, u.name, dx + 32, ty, { size: 15, color: '#e8eefc', bold: true });
        bar(ctx, dx + 130, ty - 12, 180, 12, u.hp / u.max.hp, {
          color: '#54d16a',
          border: 'rgba(255,255,255,0.25)'
        });
        label(ctx, `${u.hp}/${u.max.hp}`, dx + 320, ty, { size: 12, color: '#c8d4e8' });
      });
      label(ctx, '← → 選擇對象　空白鍵 使用　Esc 取消', dx + 20, y + h - 16, {
        size: 11,
        color: '#8a98b0'
      });
      return;
    }

    const entry = list[this.itemIdx];
    const def = entry ? ITEMS[entry.id] : null;
    if (def) {
      label(ctx, def.name, dx + 20, y + 34, { size: 20, color: '#ffe6a8', bold: true });
      const lines = wrapText(ctx, def.desc, dw - 48, 13);
      lines.forEach((l, i) => label(ctx, l, dx + 20, y + 64 + i * 22, { size: 13, color: '#c8d4e8' }));
      const uy = y + 64 + lines.length * 22 + 8;
      if (def.effect.type === 'equip') {
        label(ctx, `裝備欄位：${EQUIP_SLOT_NAME[def.effect.slot]}`, dx + 20, uy, { size: 13, color: '#9fe0ff' });
        const bits: string[] = [];
        for (const k of STAT_KEYS) {
          const b = def.effect.bonus?.[k];
          if (b) bits.push(`${STAT_NAME[k]} +${b}`);
          const m = def.effect.mult?.[k];
          if (m) bits.push(`${STAT_NAME[k]} +${Math.round(m * 100)}%`);
        }
        if (bits.length) label(ctx, bits.join('　'), dx + 20, uy + 22, { size: 12, color: '#8ef0a8' });
        label(ctx, '在「裝備」頁籤選擇幻獸即可穿戴。', dx + 20, uy + 48, { size: 12, color: '#8a98b0' });
      } else {
        label(
          ctx,
          def.use === 'battle' ? '（僅戰鬥中可使用）' : def.use === 'none' ? '（無使用效果，可販售）' : '（場上 / 戰鬥中皆可使用）',
          dx + 20,
          uy + 6,
          { size: 12, color: '#8a98b0' }
        );
      }
      label(ctx, `售價 ${Math.floor(def.price * RULES.sellRatio)} G`, dx + 20, y + h - 40, {
        size: 13,
        color: '#ffd76a'
      });
    }
    label(ctx, '空白鍵 使用（戰鬥專用道具無法在場上使用）', dx + 20, y + h - 16, {
      size: 11,
      color: '#8a98b0'
    });
  }

  private renderEquip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const list = this.units();
    const lw = 280;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, '選擇幻獸', x + 14, y + 22, { size: 12, color: '#8ed0ff', bold: true });

    list.forEach((u, i) => {
      const ly = y + 36 + i * 30;
      if (ly > y + h - 10) return;
      const sel = i === this.unitIdx;
      if (sel) {
        panel(ctx, x + 8, ly - 2, lw - 16, 26, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.7)',
          borderWidth: 1
        });
      }
      ctx.fillStyle = ELEMENT_COLOR[u.element];
      ctx.beginPath();
      ctx.arc(x + 24, ly + 11, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, u.name, x + 38, ly + 16, { size: 14, color: '#e8eefc', bold: true });
      label(ctx, `Lv${u.level}`, x + lw - 20, ly + 16, { size: 12, align: 'right', color: '#a8b6cc' });
    });

    const u = list[this.unitIdx];
    if (!u) return;
    const dx = x + lw + 16;
    const dw = w - lw - 16;
    panel(ctx, dx, y, dw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });

    label(ctx, `${u.name} 的裝備`, dx + 20, y + 30, { size: 18, color: '#ffe6a8', bold: true });
    const p = passiveOfUnit(u);
    if (p) {
      label(ctx, `被動：${p.name}`, dx + 20, y + 52, { size: 12, color: '#9fe0ff' });
      label(ctx, wrapText(ctx, p.desc, dw - 60, 11)[0] ?? '', dx + 20, y + 68, { size: 11, color: '#8a98b0' });
    }

    const slots: EquipSlot[] = ['weapon', 'armor', 'accessory'];
    const sy = y + 100;
    slots.forEach((slot, i) => {
      const sel = this.sub === 'none' && i === this.equipSlotIdx;
      const yy = sy + i * 42;
      panel(ctx, dx + 16, yy - 6, dw - 32, 36, {
        radius: 6,
        fill: sel ? 'rgba(70,120,220,0.4)' : 'rgba(16,24,42,0.7)',
        border: sel ? 'rgba(180,220,255,0.8)' : 'rgba(90,120,170,0.3)'
      });
      label(ctx, EQUIP_SLOT_NAME[slot], dx + 30, yy + 16, { size: 13, color: '#8ed0ff', bold: true });
      const id = u.equip?.[slot];
      const def = id ? ITEMS[id] : null;
      const up = u.equipUp?.[slot] ?? 0;
      label(ctx, def ? `${def.name}${up > 0 ? ` +${up}` : ''}` : '－ 未裝備 －', dx + 110, yy + 16, {
        size: 14,
        color: def ? (up > 0 ? '#ffd76a' : '#e8eefc') : '#8a98b0'
      });
      // 鑲嵌槽
      const gems = gemSlots(u, slot);
      gems.forEach((g, gi) => {
        const gx = dx + 110 + 210 + gi * 18;
        ctx.beginPath();
        ctx.arc(gx, yy + 12, 6, 0, Math.PI * 2);
        ctx.fillStyle = g ? '#8fd8ff' : 'rgba(90,120,170,0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,230,255,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      if (def && def.effect.type === 'equip') {
        const bits: string[] = [];
        const scale = upgradeScale(up);
        for (const k of [...STAT_KEYS]) {
          const b = def.effect.bonus?.[k];
          if (b) bits.push(`${STAT_NAME[k]}+${Math.round(b * scale)}`);
        }
        for (const g of gems) {
          const ge = g ? ITEMS[g]?.effect : undefined;
          if (ge && ge.type === 'gem') {
            for (const k of [...STAT_KEYS]) {
              const b = ge.bonus?.[k];
              if (b) bits.push(`${STAT_NAME[k]}+${b}`);
            }
          }
        }
        if (bits.length) label(ctx, bits.join(' '), dx + dw - 24, yy + 16, { size: 10, align: 'right', color: '#8ef0a8' });
      }
    });

    // 能力總覽（含裝備加值）
    const dy = sy + slots.length * 42 + 16;
    const delta = equipDelta(u);
    label(ctx, '目前能力', dx + 20, dy, { size: 12, color: '#8ed0ff', bold: true });
    const rows: [string, number][] = [
      ['HP', u.max.hp],
      ['MP', u.max.mp],
      ['攻擊', u.max.atk],
      ['防禦', u.max.def],
      ['魔力', u.max.mag],
      ['速度', u.max.spd]
    ];
    rows.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = dx + 20 + col * (dw / 2 - 20);
      const yy = dy + 22 + row * 22;
      label(ctx, r[0], sx, yy, { size: 12, color: '#8a98b0' });
      label(ctx, `${r[1]}`, sx + 46, yy, { size: 13, color: '#e8eefc', bold: true });
    });

    const keyOf: Record<number, keyof Stats> = { 0: 'hp', 1: 'mp', 2: 'atk', 3: 'def', 4: 'mag', 5: 'spd' };
    rows.forEach((_r, i) => {
      const d = delta[keyOf[i]];
      if (!d) return;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = dx + 20 + col * (dw / 2 - 20);
      label(ctx, `+${d}`, sx + 96, dy + 22 + row * 22, { size: 12, color: '#8ef0a8' });
    });

    if (this.forge === 'upgrade') {
      const slot = slots[this.equipSlotIdx];
      const c = canUpgrade(session.state, u, slot);
      const lv = u.equipUp?.[slot] ?? 0;
      const fy = y + h - 74;
      panel(ctx, dx + 16, fy, dw - 32, 58, {
        radius: 6,
        fill: 'rgba(60,40,90,0.5)',
        border: 'rgba(200,150,255,0.7)'
      });
      label(ctx, `工房・強化（${EQUIP_SLOT_NAME[slot]} +${lv} / +${MAX_UPGRADE}）`, dx + 30, fy + 20, {
        size: 13,
        color: '#e0b0ff',
        bold: true
      });
      label(
        ctx,
        c.ok && c.cost
          ? `空白鍵強化 → +${lv + 1}　花費 ${c.cost.gold} G、${ITEMS[c.material ?? 'stardust_core']?.name} ×${c.cost.cores}`
          : c.reason ?? '無法強化',
        dx + 30,
        fy + 42,
        { size: 12, color: c.ok ? '#8ef0a8' : '#ffb0b0' }
      );
    } else if (this.forge === 'gem') {
      const slot = slots[this.equipSlotIdx];
      const fy = y + h - 74;
      panel(ctx, dx + 16, fy, dw - 32, 58, {
        radius: 6,
        fill: 'rgba(40,60,90,0.5)',
        border: 'rgba(150,200,255,0.7)'
      });
      label(ctx, `工房・鑲嵌（${EQUIP_SLOT_NAME[slot]}　槽位 ${(u.gems?.[slot] ?? []).length}/${MAX_SOCKETS}）`, dx + 30, fy + 20, {
        size: 13,
        color: '#9fd8ff',
        bold: true
      });
      const names = (u.gems?.[slot] ?? []).map((g) => ITEMS[g]?.name ?? g);
      label(
        ctx,
        names.length ? `已鑲嵌：${names.join('、')}　（空白鍵加裝 / X 取下）` : '空白鍵選擇寶石鑲嵌　X 取下最後一顆',
        dx + 30,
        fy + 42,
        { size: 12, color: '#c8d4e8' }
      );
    } else {
      label(ctx, '↑↓ 選幻獸　←→ 選欄位　空白鍵 換裝　F 強化　G 鑲嵌　Esc 關閉', dx + 20, y + h - 16, {
        size: 11,
        color: '#8a98b0'
      });
    }

    // 換裝選單
    if (this.sub === 'equipPick') {
      const slot = slots[this.equipSlotIdx];
      const cur = u.equip?.[slot];
      const cands = this.equipCandidates(slot);
      const total = (cur ? 1 : 0) + cands.length;
      const pw = 420;
      const ph = Math.min(h - 40, 70 + Math.max(1, total) * 34);
      const px = dx + (dw - pw) / 2;
      const py = y + 40;
      panel(ctx, px, py, pw, ph, { fill: 'rgba(6,10,20,0.98)', border: 'rgba(180,220,255,0.8)', radius: 10 });
      label(ctx, `${EQUIP_SLOT_NAME[slot]} － 選擇裝備`, px + pw / 2, py + 26, {
        size: 15,
        align: 'center',
        color: '#ffe6a8',
        bold: true
      });
      let row = 0;
      if (cur) {
        const sel = this.pickIdx === 0;
        if (sel) panel(ctx, px + 12, py + 42 + row * 34 - 2, pw - 24, 28, { radius: 5, fill: 'rgba(200,90,90,0.35)', border: 'rgba(255,180,180,0.7)' });
        label(ctx, '卸下裝備', px + 30, py + 42 + row * 34 + 16, { size: 14, color: '#ffb0b0', bold: sel });
        row++;
      }
      cands.forEach((id, i) => {
        const sel = this.pickIdx === (cur ? 1 : 0) + i;
        if (sel) panel(ctx, px + 12, py + 42 + row * 34 - 2, pw - 24, 28, { radius: 5, fill: 'rgba(70,120,220,0.5)', border: 'rgba(180,220,255,0.8)' });
        label(ctx, itemName(id), px + 30, py + 42 + row * 34 + 16, { size: 14, color: '#e8eefc', bold: sel });
        row++;
      });
      label(ctx, '空白鍵 確定　Esc 取消', px + pw / 2, py + ph - 14, { size: 11, align: 'center', color: '#8a98b0' });
    }

    // 寶石選擇
    if (this.sub === 'gemPick') {
      const slot = slots[this.equipSlotIdx];
      const gems = inventoryList(session.state)
        .map((e) => e.id)
        .filter((id) => ITEMS[id]?.effect.type === 'gem');
      const pw = 440;
      const ph = Math.min(h - 40, 70 + Math.max(1, gems.length) * 34);
      const px = dx + (dw - pw) / 2;
      const py = y + 40;
      panel(ctx, px, py, pw, ph, { fill: 'rgba(6,10,20,0.98)', border: 'rgba(180,220,255,0.8)', radius: 10 });
      label(ctx, `${EQUIP_SLOT_NAME[slot]} － 選擇要鑲嵌的寶石`, px + pw / 2, py + 26, {
        size: 15,
        align: 'center',
        color: '#9fd8ff',
        bold: true
      });
      gems.forEach((id, i) => {
        const sel = this.pickIdx === i;
        if (sel) panel(ctx, px + 12, py + 42 + i * 34 - 2, pw - 24, 28, { radius: 5, fill: 'rgba(70,120,220,0.5)', border: 'rgba(180,220,255,0.8)' });
        label(ctx, `${itemName(id)} ×${session.state.inventory[id] ?? 0}`, px + 30, py + 42 + i * 34 + 16, { size: 14, color: '#e8eefc', bold: sel });
        label(ctx, ITEMS[id]?.desc ?? '', px + 200, py + 42 + i * 34 + 16, { size: 10, color: '#8a98b0' });
      });
      label(ctx, '空白鍵 鑲嵌　Esc 取消', px + pw / 2, py + ph - 14, { size: 11, align: 'center', color: '#8a98b0' });
    }
  }

  private renderDex(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const lw = 340;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, `幻獸圖鑑　${dexCollected(session.state)} / ${dexTotal()}`, x + 14, y + 22, {
      size: 12,
      color: '#8ed0ff',
      bold: true
    });

    const perRow = 1;
    this.dexList.forEach((id, i) => {
      const ly = y + 36 + i * 26;
      if (ly > y + h - 10) return;
      const sp = SPECIES[id];
      const sel = i === this.dexIdx;
      if (sel) {
        panel(ctx, x + 8, ly - 2, lw - 16, 22, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.7)',
          borderWidth: 1
        });
      }
      ctx.fillStyle = ELEMENT_COLOR[sp.element];
      ctx.beginPath();
      ctx.arc(x + 24, ly + 10, 5, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, sp.name, x + 38, ly + 15, { size: 13, color: '#e8eefc', bold: sel });
      const rate = sp.catchRate > 0 ? `捕獲率 ${Math.round(sp.catchRate * 100)}%` : '無法捕獲';
      label(ctx, `${ELEMENT_NAME[sp.element]}　${rate}`, x + lw - 20, ly + 15, {
        size: 11,
        align: 'right',
        color: '#a8b6cc'
      });
    });

    // 收集獎勵進度
    const rewards = DEX_REWARDS;
    const claimed = rewards.filter((r) => (session.state.dexRewards ?? []).includes(r.id)).length;
    const collected = dexCollected(session.state);
    const next = rewards.find((r) => !(session.state.dexRewards ?? []).includes(r.id));
    panel(ctx, x + 8, y + h - 56, lw - 16, 46, { radius: 6, fill: 'rgba(20,30,52,0.7)', border: 'rgba(90,120,170,0.3)' });
    label(ctx, `收集獎勵　${claimed} / ${rewards.length}`, x + 18, y + h - 36, {
      size: 12,
      color: '#ffd76a',
      bold: true
    });
    if (next) {
      const ready = collected >= next.count;
      label(ctx, `${next.count} 種：${next.desc}`, x + 18, y + h - 20, { size: 11, color: '#c8d4e8' });
      label(ctx, ready ? '可領取（空白鍵）' : `${collected}/${next.count}`, x + lw - 18, y + h - 20, {
        size: 11,
        align: 'right',
        color: ready ? '#8ef0a8' : '#8a98b0',
        bold: ready
      });
    } else {
      label(ctx, '全部獎勵已領取！', x + 18, y + h - 20, { size: 11, color: '#8ef0a8' });
    }

    const dx = x + lw + 16;
    const dw = w - lw - 16;
    panel(ctx, dx, y, dw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    const id = this.dexList[this.dexIdx];
    if (!id) return;
    const sp = SPECIES[id];
    label(ctx, `No.${String(dexNumber(id)).padStart(3, '0')}　${sp.name}`, dx + 20, y + 34, {
      size: 20,
      color: '#ffe6a8',
      bold: true
    });
    label(ctx, `${ELEMENT_NAME[sp.element]}屬性`, dx + 20, y + 58, {
      size: 13,
      color: ELEMENT_COLOR[sp.element]
    });
    if (sp.evolvesTo) {
      const branches = Array.isArray(sp.evolvesTo) ? sp.evolvesTo : [sp.evolvesTo];
      const txt = branches
        .map((e) => {
          const evo = SPECIES[e.species];
          return `Lv${e.level}${e.minPotential ? `／潛能${e.minPotential}` : ''} → ${evo?.name ?? e.species}`;
        })
        .join('　');
      label(ctx, txt, dx + 130, y + 58, {
        size: 12,
        color: '#9fe0ff'
      });
    }
    drawBeast(ctx, dx + dw - 100, y + 130, 2.0, 1, {
      shape: sp.shape,
      c1: sp.c1,
      c2: sp.c2,
      size: sp.size,
      horns: sp.horns,
      wings: sp.wings
    }, this.time);

    const desc = wrapText(ctx, sp.desc, dw - 210, 13);
    desc.forEach((l, i) => label(ctx, l, dx + 20, y + 88 + i * 20, { size: 13, color: '#c8d4e8' }));

    const base = sp.base;
    const rows: [string, number][] = [
      ['HP', base.hp],
      ['MP', base.mp],
      ['攻擊', base.atk],
      ['防禦', base.def],
      ['魔力', base.mag],
      ['速度', base.spd]
    ];
    label(ctx, '初始能力（Lv1）', dx + 20, y + 210, { size: 12, color: '#8ed0ff', bold: true });
    rows.forEach((r, i) => {
      const sx = dx + 20 + (i % 2) * 100;
      const yy = y + 234 + Math.floor(i / 2) * 24;
      label(ctx, r[0], sx, yy, { size: 12, color: '#8a98b0' });
      label(ctx, `${r[1]}`, sx + 44, yy, { size: 13, color: '#e8eefc', bold: true });
    });

    label(ctx, '習得技能', dx + 20, y + 318, { size: 12, color: '#8ed0ff', bold: true });
    sp.skills.forEach((sk, i) => {
      const sdef = SKILLS[sk.id];
      label(ctx, `Lv${sk.level}　${sdef?.name ?? sk.id}`, dx + 24, y + 342 + i * 20, {
        size: 12,
        color: '#c8d4e8'
      });
    });
  }

  // ── 合成 ─────────────────────────────────────────────────
  private renderFuse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const list = this.units().filter((u) => u.kind === 'pet');
    const lw = 300;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, '選擇兩隻幻獸合成', x + 14, y + 22, { size: 12, color: '#8ed0ff', bold: true });
    if (list.length === 0) {
      label(ctx, '沒有可合成的幻獸。', x + 20, y + 56, { size: 13, color: '#8a98b0' });
      return;
    }
    list.forEach((u, i) => {
      const ly = y + 36 + i * 30;
      if (ly > y + h - 10) return;
      const sel = i === this.fuseCursor;
      const isA = u.uid === this.fuseA;
      const isB = u.uid === this.fuseB;
      if (sel) {
        panel(ctx, x + 8, ly - 2, lw - 16, 26, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.7)'
        });
      }
      ctx.fillStyle = ELEMENT_COLOR[u.element];
      ctx.beginPath();
      ctx.arc(x + 24, ly + 11, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, u.name, x + 38, ly + 16, { size: 14, color: '#e8eefc', bold: true });
      label(ctx, `Lv${u.level}${(u.potential ?? 0) > 0 ? ` 潛${u.potential}` : ''}`, x + lw - 60, ly + 16, {
        size: 12,
        color: '#a8b6cc'
      });
      if (isA || isB) {
        label(ctx, isA ? 'A' : 'B', x + lw - 22, ly + 16, {
          size: 14,
          align: 'right',
          color: isA ? '#8ef0a8' : '#ffd76a',
          bold: true
        });
      }
    });

    const dx = x + lw + 16;
    const dw = w - lw - 16;
    panel(ctx, dx, y, dw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, '合成結果預覽', dx + 20, y + 30, { size: 16, color: '#ffe6a8', bold: true });

    const state = session.state;
    const a = [...state.party, ...state.storage].find((u) => u.uid === this.fuseA);
    const b = [...state.party, ...state.storage].find((u) => u.uid === this.fuseB);

    label(ctx, `A：${a ? `${a.name} Lv${a.level}` : '（未選）'}　B：${b ? `${b.name} Lv${b.level}` : '（未選）'}`, dx + 20, y + 60, {
      size: 13,
      color: '#c8d4e8'
    });

    const preview = a && b ? fusionPreview(state, a, b) : null;
    if (preview) {
      const sp = SPECIES[preview.species];
      label(ctx, `→ ${sp?.name ?? preview.species}（${ELEMENT_NAME[sp?.element ?? 'none']}屬性）`, dx + 20, y + 92, {
        size: 18,
        color: '#9fe0ff',
        bold: true
      });
      if (sp) {
        const desc = wrapText(ctx, sp.desc, dw - 220, 12);
        desc.slice(0, 3).forEach((l, i) => label(ctx, l, dx + 20, y + 118 + i * 18, { size: 12, color: '#a8b6cc' }));
        drawBeast(ctx, dx + dw - 90, y + 130, 1.5, 1, {
          shape: sp.shape,
          c1: sp.c1,
          c2: sp.c2,
          size: sp.size,
          horns: sp.horns,
          wings: sp.wings
        }, this.time);
      }
      const infoRows = [
        `等級：Lv${preview.level}`,
        `潛能：${preview.potential} / 50`,
        `花費：${preview.cost} G`,
        preview.recipeDesc ? `配方：${preview.recipeDesc}` : '配方：（依屬性合成）'
      ];
      infoRows.forEach((t, i) =>
        label(ctx, t, dx + 20, y + 200 + i * 24, {
          size: 13,
          color: t.startsWith('花費') && !preview.canAfford ? '#ffb0b0' : '#e8eefc'
        })
      );
      if (!preview.canAfford) {
        label(ctx, '金幣不足，無法合成。', dx + 20, y + 302, { size: 13, color: '#ffb0b0', bold: true });
      } else {
        label(ctx, '按 Enter 進行合成（會消耗兩隻幻獸）', dx + 20, y + 302, { size: 13, color: '#8ef0a8', bold: true });
      }
      if (preview.hidden) {
        label(ctx, '★ 隱藏種族', dx + 20, y + 324, { size: 12, color: '#ffd76a', bold: true });
      }
      if (preview.hint) {
        wrapText(ctx, preview.hint, dw - 40, 12).forEach((l, i) =>
          label(ctx, l, dx + 20, y + 348 + i * 18, { size: 12, color: '#9fe0ff' })
        );
      }
    } else {
      label(ctx, '以空白鍵依序選擇 A 與 B 兩隻幻獸。', dx + 20, y + 100, { size: 13, color: '#8a98b0' });
      label(ctx, '合成會消耗兩隻幻獸，並產生新的一隻。', dx + 20, y + 124, { size: 13, color: '#8a98b0' });
      label(ctx, '特定組合會誕生隱藏種族；一般組合則依屬性決定。', dx + 20, y + 148, { size: 13, color: '#8a98b0' });
      wrapText(ctx, '育種：父母同屬性、且合成後潛能達 30，就能誕生該屬性的隱藏種族。', dw - 40, 12).forEach((l, i) =>
        label(ctx, l, dx + 20, y + 176 + i * 18, { size: 12, color: '#9fe0ff' })
      );
      const known = Object.values(SPECIES).filter((sp) => sp.hidden).length;
      label(ctx, `隱藏種族：${known} 種`, dx + 20, y + 226, { size: 13, color: '#ffd76a' });
      const unlocked = Object.keys(state.dex).filter((k) => SPECIES[k]?.hidden).length;
      label(ctx, `已登錄：${unlocked} 種`, dx + 20, y + 250, { size: 13, color: '#8ef0a8' });
    }
  }

  // ── 成就 ─────────────────────────────────────────────────
  private renderAchievements(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    panel(ctx, x, y, w, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    const unlocked = Object.keys(session.state.achievements ?? {}).length;
    label(ctx, `成就　${unlocked} / ${ACHIEVEMENTS.length}`, x + 20, y + 30, {
      size: 16,
      color: '#8ed0ff',
      bold: true
    });
    label(ctx, '成就會在達成條件時自動發放獎勵。', x + 240, y + 30, { size: 12, color: '#8a98b0' });

    const rowH = 34;
    const maxRows = Math.floor((h - 70) / rowH);
    const start = Math.max(0, Math.min(this.achIdx - Math.floor(maxRows / 2), ACHIEVEMENTS.length - maxRows));
    const shown = ACHIEVEMENTS.slice(Math.max(0, start), Math.max(0, start) + maxRows);
    shown.forEach((a, i) => {
      const gi = Math.max(0, start) + i;
      const sel = gi === this.achIdx;
      const ly = y + 56 + i * rowH;
      const got = !!session.state.achievements?.[a.id];
      if (sel) {
        panel(ctx, x + 12, ly - 4, w - 24, rowH - 4, {
          radius: 6,
          fill: 'rgba(70,120,220,0.35)',
          border: 'rgba(180,220,255,0.7)'
        });
      }
      label(ctx, got ? '★' : '☆', x + 26, ly + 16, {
        size: 15,
        color: got ? '#ffd76a' : '#5a6478',
        bold: true
      });
      const hiddenLocked = a.hidden && !got;
      label(ctx, hiddenLocked ? '？？？' : a.name, x + 52, ly + 16, {
        size: 14,
        color: got ? '#ffe6a8' : '#c8d4e8',
        bold: true
      });
      label(ctx, hiddenLocked ? '達成後揭曉' : a.desc, x + 200, ly + 16, { size: 12, color: '#a8b6cc' });
      const rw: string[] = [];
      if (a.gold) rw.push(`${a.gold}G`);
      for (const it of a.items ?? []) rw.push(`${ITEMS[it.id]?.name ?? it.id}×${it.n}`);
      if (a.exp) rw.push(`${a.exp}exp`);
      if (rw.length) {
        label(ctx, rw.join(' '), x + w - 24, ly + 16, { size: 11, align: 'right', color: got ? '#8ef0a8' : '#6a7488' });
      }
    });
    if (ACHIEVEMENTS.length > maxRows) {
      label(ctx, `（${this.achIdx + 1} / ${ACHIEVEMENTS.length}）　↑↓ 捲動`, x + 20, y + h - 14, {
        size: 11,
        color: '#8a98b0'
      });
    }
  }

  private renderSystem(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    panel(ctx, x, y, w, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    const items = this.systemItems();
    label(ctx, '系統', x + 20, y + 30, { size: 16, color: '#8ed0ff', bold: true });
    items.forEach((t, i) => {
      const sel = i === this.sysIdx;
      const ly = y + 60 + i * 34;
      if (sel) {
        panel(ctx, x + 16, ly - 20, 300, 30, {
          radius: 6,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.8)'
        });
      }
      label(ctx, t, x + 34, ly, { size: 15, color: sel ? '#ffffff' : '#c8d4e8', bold: sel });
    });

    const info = [
      `隊長：${session.state.playerName}`,
      `存檔欄位：${session.state.slot} / ${SAVE_SLOTS}`,
      `遊玩時間：${Math.floor(session.state.playTime / 60)} 分 ${Math.floor(session.state.playTime % 60)} 秒`,
      `總步數：${session.state.steps}`,
      `戰鬥勝利：${session.state.battlesWon} 場`,
      `封印幻獸：${session.state.captured} 隻`,
      `持有金幣：${session.state.gold} G`,
      `累計獲得：${session.state.goldEarned ?? 0} G`
    ];
    info.forEach((t, i) => label(ctx, t, x + 360, y + 60 + i * 24, { size: 13, color: '#c8d4e8' }));

    const d = dailyState(session.state);
    label(ctx, `每日委託：${d.done} / ${d.total}　連續全勤 ${d.streak} 天`, x + 360, y + 60 + info.length * 24 + 8, {
      size: 13,
      color: '#9fe0ff'
    });
    const ach = Object.keys(session.state.achievements ?? {}).length;
    label(ctx, `成就：${ach} / ${ACHIEVEMENTS.length}　合成次數：${session.state.fusions ?? 0}`, x + 360, y + 60 + info.length * 24 + 32, {
      size: 13,
      color: '#c8d4e8'
    });

    const hint = wrapText(ctx, `目前目標：${questHint(session.state)}`, w - 380, 13);
    hint.forEach((l, i) => label(ctx, l, x + 360, y + 300 + i * 20, { size: 13, color: '#ffe6a8' }));
  }
}

// ─────────────────────────────────────────────────────────────
// 商店
// ─────────────────────────────────────────────────────────────
export class ShopScene implements Scene {
  mode: 'buy' | 'sell' = 'buy';
  idx = 0;
  time = 0;
  message = '';
  messageT = 0;

  constructor(private onClose?: () => void) {}

  enter() {
    audio.setBgm('shop');
  }

  private close() {
    this.onClose?.();
    scenes.pop();
  }

  update(dt: number) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;

    const list = this.list();
    if (list.length === 0) {
      if (input.consume('escape', 'space', 'enter')) this.close();
      return;
    }
    this.idx = Math.min(this.idx, list.length - 1);

    if (input.consume('q', 'arrowleft', 'a')) {
      this.mode = this.mode === 'buy' ? 'sell' : 'buy';
      this.idx = 0;
    }
    if (input.consume('e', 'arrowright', 'd')) {
      this.mode = this.mode === 'buy' ? 'sell' : 'buy';
      this.idx = 0;
    }
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.idx = (this.idx - 1 + list.length) % list.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.idx = (this.idx + 1) % list.length;
    if (input.consume('escape')) {
      this.close();
      return;
    }
    if (input.consume('space', 'enter')) {
      const s = session.state;
      if (this.mode === 'buy') {
        const id = list[this.idx];
        const def = ITEMS[id];
        if (!def) return;
        if (s.gold < def.price) {
          this.flash('金幣不足。');
          return;
        }
        s.gold -= def.price;
        addItem(s, id, 1);
        audio.play('coin');
        this.flash(`購買了 ${def.name}。`);
      } else {
        const id = list[this.idx];
        const def = ITEMS[id];
        if (!def) return;
        const price = Math.floor(def.price * RULES.sellRatio);
        if (!removeItem(s, id, 1)) return;
        addGold(s, price);
        audio.play('coin');
        this.flash(`賣出了 ${def.name}，獲得 ${price} G。`);
        const nl = this.list();
        if (nl.length === 0) this.idx = 0;
      }
    }
  }

  private list(): string[] {
    if (this.mode === 'buy') return SHOP_STOCK;
    return inventoryList(session.state).map((e) => e.id);
  }

  private flash(m: string) {
    this.message = m;
    this.messageT = 1.8;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(4,7,14,0.9)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const bx = 60;
    const by = 40;
    const bw = VIEW_W - 120;
    const bh = VIEW_H - 80;
    panel(ctx, bx, by, bw, bh, { fill: 'rgba(10,16,30,0.97)', border: 'rgba(150,190,255,0.55)', radius: 12 });

    label(ctx, '道具商店', bx + 28, by + 44, { size: 22, color: '#ffe6a8', bold: true });
    label(ctx, `${session.state.gold} G`, bx + bw - 28, by + 44, {
      size: 20,
      align: 'right',
      color: '#ffd76a',
      bold: true
    });

    ['購買', '販售'].forEach((t, i) => {
      const sel = (i === 0) === (this.mode === 'buy');
      panel(ctx, bx + 28 + i * 110, by + 62, 100, 30, {
        radius: 6,
        fill: sel ? 'rgba(70,120,220,0.55)' : 'rgba(20,30,52,0.8)',
        border: sel ? 'rgba(180,220,255,0.9)' : 'rgba(90,120,170,0.35)'
      });
      label(ctx, t, bx + 78 + i * 110, by + 83, {
        size: 14,
        align: 'center',
        color: sel ? '#fff' : '#9fb0cc',
        bold: sel
      });
    });

    const list = this.list();
    const lw = 380;
    panel(ctx, bx + 28, by + 104, lw, bh - 160, { fill: 'rgba(8,13,26,0.85)', radius: 8 });

    if (list.length === 0) {
      label(ctx, '（沒有可販售的道具）', bx + 48, by + 140, { size: 13, color: '#8a98b0' });
    }
    list.forEach((id, i) => {
      const def = ITEMS[id];
      if (!def) return;
      const ly = by + 118 + i * 30;
      if (ly > by + bh - 70) return;
      const sel = i === this.idx;
      if (sel) {
        panel(ctx, bx + 36, ly - 4, lw - 16, 26, {
          radius: 5,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.75)',
          borderWidth: 1
        });
      }
      const price = this.mode === 'buy' ? def.price : Math.floor(def.price * RULES.sellRatio);
      label(ctx, def.name, bx + 52, ly + 14, { size: 14, color: '#e8eefc', bold: sel });
      if (this.mode === 'sell') {
        label(ctx, `×${session.state.inventory[id] ?? 0}`, bx + lw + 4, ly + 14, {
          size: 12,
          color: '#8a98b0',
          align: 'right'
        });
      }
      label(ctx, `${price} G`, bx + 28 + lw - 16, ly + 14, {
        size: 14,
        align: 'right',
        color: session.state.gold >= price || this.mode === 'sell' ? '#ffd76a' : '#7a5a3a',
        bold: true
      });
    });

    // 說明
    const dx = bx + 28 + lw + 20;
    const dw = bw - 56 - lw - 20;
    panel(ctx, dx, by + 104, dw, bh - 160, { fill: 'rgba(8,13,26,0.85)', radius: 8 });
    const cur = list[this.idx];
    const cdef = cur ? ITEMS[cur] : null;
    if (cdef) {
      label(ctx, cdef.name, dx + 20, by + 142, { size: 19, color: '#ffe6a8', bold: true });
      const lines = wrapText(ctx, cdef.desc, dw - 44, 13);
      lines.forEach((l, i) => label(ctx, l, dx + 20, by + 176 + i * 22, { size: 13, color: '#c8d4e8' }));
    }

    if (this.messageT > 0) {
      label(ctx, this.message, VIEW_W / 2, VIEW_H - 60, {
        size: 14,
        align: 'center',
        color: '#8ef0a8',
        bold: true
      });
    }

    label(ctx, 'Q / E 切換買賣　↑↓ 選擇　空白鍵 確定　Esc 離開', VIEW_W / 2, VIEW_H - 30, {
      size: 11,
      align: 'center',
      color: 'rgba(150,170,210,0.8)'
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 委託板
// ─────────────────────────────────────────────────────────────
export class QuestScene implements Scene {
  time = 0;
  idx = 0;
  message = '';
  messageT = 0;
  /** 目前捲動到清單的第幾項 */
  scroll = 0;
  static readonly VISIBLE = 7;

  constructor(private onClose?: () => void) {}

  private close() {
    this.onClose?.();
    scenes.pop();
  }

  /** 進行中優先，其次可接取（每日委託 + 固定委託 + 隨機委託） */
  private list(): QuestDef[] {
    const s = session.state;
    ensureDailies(s);
    ensureBounties(s);
    const all = allQuests(s);
    const taken = all.filter((q) => isTaken(s, q.id));
    const avail = all.filter((q) => canTake(s, q));
    return [...taken, ...avail];
  }

  update(dt: number) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;

    const list = this.list();
    if (list.length === 0) {
      if (input.consume('escape', 'space', 'enter')) this.close();
      return;
    }
    this.idx = Math.max(0, Math.min(this.idx, list.length - 1));

    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.idx = (this.idx - 1 + list.length) % list.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.idx = (this.idx + 1) % list.length;

    // 捲動視窗
    const v = QuestScene.VISIBLE;
    if (this.idx < this.scroll) this.scroll = this.idx;
    if (this.idx >= this.scroll + v) this.scroll = this.idx - v + 1;
    this.scroll = Math.max(0, Math.min(this.scroll, Math.max(0, list.length - v)));

    if (input.consume('escape')) {
      this.close();
      return;
    }

    const s = session.state;
    const q = list[this.idx];

    if (input.consume('r')) {
      const round = rerollBounties(s);
      this.flash(`換上新的一批隨機委託（第 ${round} 批）。`);
      this.idx = 0;
      this.scroll = 0;
      return;
    }

    if (input.consume('x')) {
      if (isTaken(s, q.id)) {
        abandonQuest(s, q.id);
        this.flash(`放棄了委託「${q.title}」。`);
        this.idx = 0;
      }
      return;
    }

    if (input.consume('space', 'enter')) {
      if (isTaken(s, q.id)) {
        if (isComplete(s, q)) {
          const reward = claimQuest(s, q);
          this.flash(reward ? `完成委託！獲得 ${reward}` : '無法回報。');
          this.idx = 0;
          for (const a of grantAchievements(s)) {
            this.flash(`🏆 成就達成：${a.name}`);
          }
        } else {
          this.flash(`進度 ${questProgress(s, q)}/${q.count}，尚未完成。`);
        }
      } else {
        takeQuest(s, q);
        this.flash(`接下了委託「${q.title}」。`);
        this.idx = 0;
      }
    }
  }

  private flash(m: string) {
    this.message = m;
    this.messageT = 2.4;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(4,7,14,0.9)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const bx = 56;
    const by = 28;
    const bw = VIEW_W - 112;
    const bh = VIEW_H - 56;
    panel(ctx, bx, by, bw, bh, {
      fill: 'rgba(10,16,30,0.97)',
      border: 'rgba(150,190,255,0.55)',
      radius: 12
    });

    const s = session.state;
    label(ctx, '委託板', bx + 26, by + 40, { size: 22, color: '#ffe6a8', bold: true });
    label(ctx, '↑↓ 選擇　空白鍵 接取／回報　X 放棄　R 換一批隨機委託　Esc 離開', bx + bw - 26, by + 40, {
      size: 11,
      align: 'right',
      color: 'rgba(150,170,210,0.85)'
    });
    label(ctx, `${s.gold} G`, bx + bw - 26, by + 64, { size: 16, align: 'right', color: '#ffd76a', bold: true });
    const dq = dailyState(s);
    label(ctx, `每日委託 ${dq.done}/${dq.total}　連續全勤 ${dq.streak} 天　｜　隨機委託第 ${s.bountyRound ?? 0} 批`, bx + 26, by + 64, {
      size: 12,
      color: '#9fb0cc'
    });

    const list = this.list();
    const rowY = by + 96;
    const lw = 470;

    panel(ctx, bx + 22, rowY - 22, lw, bh - 140, { fill: 'rgba(8,13,26,0.85)', radius: 8 });

    if (list.length === 0) {
      label(ctx, '（目前沒有可接取的委託）', bx + 44, rowY + 10, { size: 13, color: '#8a98b0' });
    }

    const shown = list.slice(this.scroll, this.scroll + QuestScene.VISIBLE);
    shown.forEach((q, i) => {
      const realIdx = this.scroll + i;
      const sel = realIdx === this.idx;
      const y = rowY + i * 34;
      const taken = isTaken(s, q.id);
      const done = taken && isComplete(s, q);
      const tag = !taken ? '可接取' : done ? '可回報' : '進行中';
      const tagColor = !taken ? '#8ef0a8' : done ? '#ffd76a' : '#8ed0ff';
      const isDailyQ = q.id.startsWith('day_');
      const isBounty = q.id.startsWith('rnd');

      if (sel) {
        panel(ctx, bx + 30, y - 18, lw - 16, 30, {
          radius: 6,
          fill: 'rgba(70,120,220,0.4)',
          border: 'rgba(180,220,255,0.75)',
          borderWidth: 1
        });
      }
      const prefix = isDailyQ ? `[每日·${tag}]` : isBounty ? `[隨機·${tag}]` : `[${tag}]`;
      label(ctx, prefix, bx + 42, y, {
        size: 12,
        color: isDailyQ ? '#9fe0ff' : tagColor,
        bold: true
      });
      label(ctx, q.title, bx + (isBounty || isDailyQ ? 168 : 106), y, { size: 15, color: sel ? '#ffffff' : '#dfe6f5', bold: sel });
      label(ctx, taken ? `${questProgress(s, q)}/${q.count}` : `${q.count} 次`, bx + 30 + lw - 26, y, {
        size: 13,
        align: 'right',
        color: isFinished(s, q) ? '#7a8496' : tagColor
      });
    });

    if (list.length > QuestScene.VISIBLE) {
      label(ctx, `${this.idx + 1} / ${list.length}`, bx + 30 + lw - 26, by + bh - 168, {
        size: 11,
        align: 'right',
        color: '#8a98b0'
      });
    }

    // 說明欄
    const dx = bx + 22 + lw + 18;
    const dw = bw - 44 - lw - 18;
    panel(ctx, dx, rowY - 22, dw, bh - 140, { fill: 'rgba(8,13,26,0.85)', radius: 8 });
    const cur = list[this.idx];
    if (cur) {
      label(ctx, cur.title, dx + 18, rowY + 6, { size: 18, color: '#ffe6a8', bold: true });
      const kindText =
        cur.kind === 'kill'
          ? '討伐'
          : cur.kind === 'catch'
            ? '封印'
            : cur.kind === 'deliver'
              ? '繳交'
              : '前往';
      label(ctx, `類型：${kindText}　目標：${cur.count}`, dx + 18, rowY + 32, { size: 12, color: '#9fb0cc' });
      const lines = wrapText(ctx, cur.desc, dw - 40, 13);
      lines.forEach((l, i) => label(ctx, l, dx + 18, rowY + 56 + i * 21, { size: 13, color: '#c8d4e8' }));

      const rewardParts: string[] = [];
      if (cur.reward.gold) rewardParts.push(`${cur.reward.gold} G`);
      for (const it of cur.reward.items ?? []) rewardParts.push(`${itemName(it.id)} ×${it.n}`);
      if (cur.reward.exp) rewardParts.push(`${cur.reward.exp} 經驗`);
      label(ctx, '報酬', dx + 18, rowY + 150, { size: 13, color: '#8ef0a8', bold: true });
      const rlines = wrapText(ctx, rewardParts.join('、') || '（無）', dw - 40, 13);
      rlines.forEach((l, i) => label(ctx, l, dx + 18, rowY + 172 + i * 21, { size: 13, color: '#e8eefc' }));

      if (isTaken(s, cur.id)) {
        label(ctx, `進度 ${questProgress(s, cur)} / ${cur.count}`, dx + 18, rowY + 240, {
          size: 14,
          color: isComplete(s, cur) ? '#ffd76a' : '#8ed0ff',
          bold: true
        });
      }
      if (isFinished(s, cur)) {
        label(ctx, '（已完成的委託）', dx + 18, rowY + 262, { size: 12, color: '#7a8496' });
      }
    }

    if (this.messageT > 0) {
      label(ctx, this.message, VIEW_W / 2, VIEW_H - 56, {
        size: 14,
        align: 'center',
        color: '#8ef0a8',
        bold: true
      });
    }

    label(ctx, '委託完成後記得回來回報；按 R 可更換一批隨機委託。', VIEW_W / 2, VIEW_H - 28, {
      size: 11,
      align: 'center',
      color: 'rgba(150,170,210,0.8)'
    });
  }
}

// ─────────────────────────────────────────────────────────────
// 結局
// ─────────────────────────────────────────────────────────────
const ENDING_LINES = [
  '星穹神殿的光，在星之霸主倒下的一瞬間，散成了整片星河。',
  '',
  '被奪走的晶石之光，一縷一縷回到大陸的每一個角落。',
  '',
  '雪原的冰晶重新亮起，焰心的火脈穩了下來，風空港的浮空石托住了整座港。',
  '',
  '「我們真的做到了。」鈴收起風刃，望著腳下的雲海。',
  '',
  '「不是我們。」旭說。「是這片大陸，自己想把光要回來。」',
  '',
  '鐵山扛著行李走在最前面，嘴裡念著要回港口喝一杯。',
  '',
  '星見長老站在晨曦村的石階上，抬頭看了很久很久。',
  '',
  '—— 星塵幻獸　終章　完 ——',
  '',
  '大陸上還有許多幻獸沒被認識。圖鑑裡空著的位置，就留給你吧。'
];

export const TRUE_ENDING_LINES = [
  '深淵主宰的最後一句話，沒有聲音，卻讓整條迴廊安靜了下來。',
  '',
  '「……原來，被照亮是這種感覺。」',
  '',
  '然後那個洞合了起來。被吞掉的星光，從最深處一路回到了天頂。',
  '',
  '星穹神殿的祭壇重新亮起，這次的光，比任何人記得的都還要滿。',
  '',
  '「所以我們不是把光拿回來。」鈴說，「是把它送回去。」',
  '',
  '鐵山把行李放下，難得地沒有抱怨，只說了一句：回去要煮一鍋大的。',
  '',
  '圖鑑翻到最後一頁，原本空著的地方，慢慢浮現出一道沒見過的紋路。',
  '',
  '—— 星塵幻獸　真章　完 ——',
  '',
  '星塵幻獸的旅程到這裡結束了。謝謝你陪這片大陸走到最後。'
];

export class EndingScene implements Scene {
  time = 0;
  idx = 1;
  lines: string[];

  constructor(lines: string[] = ENDING_LINES) {
    this.lines = lines;
  }

  enter() {
    audio.setBgm('ending');
  }

  update(dt: number) {
    this.time += dt;
    if (this.time > 1.6 && this.idx < this.lines.length) {
      this.time = 0;
      this.idx++;
    }
    if (input.consume('space', 'enter', 'escape') && this.idx >= this.lines.length) {
      void this.toTitle();
    }
    if (input.isDown('shift')) {
      this.idx = this.lines.length;
    }
  }

  private async toTitle() {
    const m = await import('./menus');
    m.resetStars();
    scenes.set(new m.TitleScene());
  }

  render(ctx: CanvasRenderingContext2D) {
    drawStarfield(ctx, this.time + this.idx);
    const shown = this.lines.slice(0, Math.max(1, this.idx));
    shown.forEach((l, i) => {
      const a = i === shown.length - 1 ? Math.min(1, this.time / 0.8) : 1;
      label(ctx, l, VIEW_W / 2, 84 + i * 22, {
        size: 15,
        align: 'center',
        color: l.startsWith('——') ? '#ffe6a8' : '#e0e8ff',
        alpha: a,
        bold: l.startsWith('——')
      });
    });

    if (this.idx >= this.lines.length) {
      const blink = Math.sin(this.time * 4) > 0;
      if (blink) {
        label(ctx, '按 空白鍵 回到標題', VIEW_W / 2, VIEW_H - 50, {
          size: 14,
          align: 'center',
          color: '#8ed0ff'
        });
      }
    } else {
      label(ctx, '（按住 Shift 可快速跳過）', VIEW_W / 2, VIEW_H - 40, {
        size: 12,
        align: 'center',
        color: 'rgba(150,170,210,0.7)'
      });
    }
  }
}
