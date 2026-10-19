import { VIEW_H, VIEW_W, scenes, type Scene } from '../engine/scene';
import * as input from '../engine/input';
import { bar, drawBeast, drawHero, label, panel, shade, wrapText } from '../engine/draw';
import { AILMENT_COLOR, AILMENT_ICON, AILMENT_NAME, ELEMENT_COLOR, ELEMENT_NAME, ITEMS, SKILLS, SPECIES, dexNumber, itemName } from '../game/data';
import { session } from '../game/session';
import { MAPS } from '../game/maps';
import {
  MAX_PARTY,
  addItem,
  deleteSave,
  hasSave,
  inventoryList,
  loadGame,
  newGame,
  removeItem,
  saveGame
} from '../game/state';
import { SHOP_STOCK, questHint } from '../game/story';
import { RULES } from '../game/rules';
import type { Unit } from '../game/types';

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
  items = [
    { id: 'new', text: '新的旅程' },
    { id: 'continue', text: '繼續冒險' },
    { id: 'help', text: '操作說明' },
    { id: 'clear', text: '刪除存檔' }
  ];

  update(dt: number) {
    this.time += dt;
    if (this.busy) return;
    if (this.help) {
      if (input.consume('space', 'enter', 'escape')) this.help = false;
      return;
    }
    if (this.confirmClear) {
      if (input.consume('space', 'enter')) {
        deleteSave();
        this.confirmClear = false;
        this.msg = '存檔已刪除。';
      } else if (input.consume('escape')) {
        this.confirmClear = false;
        this.msg = '';
      }
      return;
    }
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.idx = (this.idx - 1 + this.items.length) % this.items.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.idx = (this.idx + 1) % this.items.length;

    const has = hasSave();
    if (!has && (this.items[this.idx].id === 'continue')) this.idx = (this.idx + 1) % this.items.length;

    if (input.consume('space', 'enter')) {
      const id = this.items[this.idx].id;
      if (id === 'continue' && !has) return;
      if (id === 'new') void this.startNew();
      else if (id === 'continue') void this.startLoad();
      else if (id === 'help') this.help = true;
      else if (id === 'clear') {
        if (has) {
          this.confirmClear = true;
          this.msg = '再按一次空白鍵，確定刪除存檔。';
        } else {
          this.msg = '目前沒有存檔。';
        }
      }
    }
  }

  private async startNew() {
    this.busy = true;
    const { FieldScene } = await import('./field');
    session.state = newGame();
    scenes.set(new FieldScene());
  }

  private async startLoad() {
    const s = loadGame();
    if (!s) return;
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
      panel(ctx, 200, 100, 560, 400, { fill: 'rgba(8,13,26,0.96)', border: 'rgba(150,190,255,0.6)', radius: 12 });
      label(ctx, '操作說明', 480, 140, { size: 22, align: 'center', color: '#ffe6a8', bold: true });
      const lines = [
        '【探索】',
        '　方向鍵 / WASD　在等角地圖上走動（四方向對應畫面斜向）',
        '　空白鍵 / Enter　與前方的人或告示交談',
        '　Esc　開啟選單（隊伍 / 道具 / 圖鑑 / 系統）',
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
        label(ctx, l, 236, 178 + i * 22, {
          size: 13,
          color: l.startsWith('【') ? '#8ed0ff' : '#d8e4ff'
        })
      );
      return;
    }

    // 選單
    const my = 400;
    this.items.forEach((it, i) => {
      const sel = i === this.idx;
      const y = my + i * 34;
      const disabled = it.id === 'continue' && !hasSave();
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
  tabs = ['隊伍', '道具', '圖鑑', '系統'];
  unitIdx = 0;
  itemIdx = 0;
  dexIdx = 0;
  sysIdx = 0;
  sub: 'none' | 'itemTarget' = 'none';
  targetIdx = 0;
  message = '';
  messageT = 0;
  dexList: string[] = [];

  constructor(private onClose?: () => void) {
    this.dexList = Object.keys(session.state.dex).filter((k) => SPECIES[k]);
  }

  private units(): Unit[] {
    return [...session.state.party, ...session.state.storage];
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

    if (input.consume('escape')) {
      this.close();
      return;
    }
    if (input.consume('q', 'arrowleft', 'a')) this.tab = (this.tab - 1 + this.tabs.length) % this.tabs.length;
    if (input.consume('e', 'arrowright', 'd')) this.tab = (this.tab + 1) % this.tabs.length;
    if (input.consume('tab')) this.tab = (this.tab + 1) % this.tabs.length;

    if (this.tab === 0) this.updateParty(dt);
    else if (this.tab === 1) this.updateItems(dt);
    else if (this.tab === 2) this.updateDex(dt);
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
      if (def.use === 'none') {
        this.flash('這個道具沒有使用效果，可以賣給商人。');
        return;
      }
      this.sub = 'itemTarget';
      this.targetIdx = 0;
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
    if (this.dexList.length === 0) return;
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.dexIdx = (this.dexIdx - 1 + this.dexList.length) % this.dexList.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.dexIdx = (this.dexIdx + 1) % this.dexList.length;
  }

  private updateSystem(dt: number) {
    const items = ['儲存進度', '重新載入存檔', '回到標題畫面'];
    if (input.nav('arrowup', dt) || input.nav('w', dt)) this.sysIdx = (this.sysIdx - 1 + items.length) % items.length;
    if (input.nav('arrowdown', dt) || input.nav('s', dt)) this.sysIdx = (this.sysIdx + 1) % items.length;
    if (input.consume('space', 'enter')) {
      if (this.sysIdx === 0) {
        const ok = saveGame(session.state);
        this.flash(ok ? '已儲存進度。' : '儲存失敗（瀏覽器儲存空間可能被停用）。');
      } else if (this.sysIdx === 1) {
        const s = loadGame();
        if (s) {
          session.state = s;
          this.flash('已重新載入存檔。');
          this.unitIdx = 0;
          this.itemIdx = 0;
        } else {
          this.flash('找不到存檔。');
        }
      } else {
        void this.toTitle();
      }
    }
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
      const tw = 110;
      const tx = bx + 20 + i * (tw + 8);
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
    else if (this.tab === 2) this.renderDex(ctx, bx + 20, cy, bw - 40, bh - 92);
    else this.renderSystem(ctx, bx + 20, cy, bw - 40, bh - 92);

    if (this.messageT > 0) {
      panel(ctx, VIEW_W / 2 - 220, VIEW_H - 74, 440, 30, { alpha: 0.95, radius: 6 });
      label(ctx, this.message, VIEW_W / 2, VIEW_H - 53, {
        size: 14,
        align: 'center',
        color: '#ffe6a8'
      });
    }

    label(ctx, 'Q / E 切換頁籤　↑↓ 選擇　空白鍵 確定　Esc 關閉', VIEW_W / 2, VIEW_H - 12, {
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

    label(ctx, '空白鍵：在「出戰」與「待命」之間切換', dx + 20, y + h - 16, {
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
      label(
        ctx,
        def.use === 'battle' ? '（僅戰鬥中可使用）' : def.use === 'none' ? '（無使用效果，可販售）' : '（場上 / 戰鬥中皆可使用）',
        dx + 20,
        y + 64 + lines.length * 22 + 14,
        { size: 12, color: '#8a98b0' }
      );
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

  private renderDex(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const lw = 340;
    panel(ctx, x, y, lw, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    label(ctx, `幻獸圖鑑　${this.dexList.length} / ${Object.keys(SPECIES).length}`, x + 14, y + 22, {
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
      const evo = SPECIES[sp.evolvesTo.species];
      label(ctx, `Lv${sp.evolvesTo.level} 進化成 ${evo?.name ?? sp.evolvesTo.species}`, dx + 130, y + 58, {
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

  private renderSystem(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    panel(ctx, x, y, w, h, { fill: 'rgba(8,13,26,0.8)', radius: 8 });
    const items = ['儲存進度', '重新載入存檔', '回到標題畫面'];
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
      `遊玩時間：${Math.floor(session.state.playTime / 60)} 分 ${Math.floor(session.state.playTime % 60)} 秒`,
      `總步數：${session.state.steps}`,
      `戰鬥勝利：${session.state.battlesWon} 場`,
      `封印幻獸：${session.state.captured} 隻`,
      `持有金幣：${session.state.gold} G`
    ];
    info.forEach((t, i) => label(ctx, t, x + 360, y + 60 + i * 26, { size: 13, color: '#c8d4e8' }));

    const hint = wrapText(ctx, `目前目標：${questHint(session.state)}`, w - 380, 13);
    hint.forEach((l, i) => label(ctx, l, x + 360, y + 220 + i * 20, { size: 13, color: '#ffe6a8' }));
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

  update(dt: number) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;

    const list = this.list();
    if (list.length === 0) {
      if (input.consume('escape', 'space', 'enter')) scenes.pop();
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
      scenes.pop();
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
        this.flash(`購買了 ${def.name}。`);
      } else {
        const id = list[this.idx];
        const def = ITEMS[id];
        if (!def) return;
        const price = Math.floor(def.price * RULES.sellRatio);
        if (!removeItem(s, id, 1)) return;
        s.gold += price;
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

export class EndingScene implements Scene {
  time = 0;
  idx = 1;

  update(dt: number) {
    this.time += dt;
    if (this.time > 1.6 && this.idx < ENDING_LINES.length) {
      this.time = 0;
      this.idx++;
    }
    if (input.consume('space', 'enter', 'escape') && this.idx >= ENDING_LINES.length) {
      void this.toTitle();
    }
    if (input.isDown('shift')) {
      this.idx = ENDING_LINES.length;
    }
  }

  private async toTitle() {
    const m = await import('./menus');
    m.resetStars();
    scenes.set(new m.TitleScene());
  }

  render(ctx: CanvasRenderingContext2D) {
    drawStarfield(ctx, this.time + this.idx);
    const shown = ENDING_LINES.slice(0, Math.max(1, this.idx));
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

    if (this.idx >= ENDING_LINES.length) {
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
