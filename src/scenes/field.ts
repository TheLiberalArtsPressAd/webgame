import { VIEW_H, VIEW_W, scenes, type Scene } from '../engine/scene';
import { TILE_H, TILE_W, clamp, cameraFor, lerp, worldToScreen } from '../engine/iso';
import * as input from '../engine/input';
import {
  bar,
  drawBeast,
  drawHero,
  drawTextBox,
  label,
  panel,
  shade,
  wrapText
} from '../engine/draw';
import { MAPS, MAP_GRIDS, tileAt, type MapDef, type NpcDef, type PropDef } from '../game/maps';
import { npcDialogue, questHint, SCRIPTED_BATTLES, type BattleBg, type StoryLine } from '../game/story';
import { session, type GameState } from '../game/session';
import { addItem, fullRestore, giveExp, grantAchievements, MAX_PARTY } from '../game/state';
import { createUnit, ITEMS, itemName, SPECIES } from '../game/data';
import { questOnArrive, activeQuestSummary, ensureDailies } from '../game/quests';
import { audio, bgmForMap } from '../engine/audio';
import { BattleScene } from './battleScene';
import { MenuScene, QuestScene, ShopScene } from './menus';
import type { Unit } from '../game/types';

interface Toast {
  text: string;
  t: number;
  color: string;
}

interface DialogState {
  lines: StoryLine[];
  index: number;
  shown: number;
  action?: string;
  choices?: { text: string; action?: string }[];
  choiceIndex: number;
  after?: () => void;
}

function approach(v: number, target: number, step: number) {
  if (Math.abs(target - v) <= step) return target;
  return v + Math.sign(target - v) * step;
}

/** 依地圖決定戰鬥背景 */
export function bgForMap(mapId: string, indoor: boolean): BattleBg {
  switch (mapId) {
    case 'harbor':
      return 'harbor';
    case 'road':
      return 'road';
    case 'frostport':
    case 'snowfield':
      return 'snow';
    case 'icecave':
      return 'snow';
    case 'desert':
    case 'volcano':
      return 'volcano';
    case 'skyport':
    case 'skytemple':
      return 'sky';
    case 'abyssgate':
    case 'abysshall':
    case 'abyssdeep':
      return 'abyss';
    default:
      return indoor ? 'cave' : 'field';
  }
}

export class FieldScene implements Scene {
  s: GameState;
  mapId: string;
  map: MapDef;
  grid: string[][];

  px = 0;
  py = 0;
  tx = 0;
  ty = 0;
  moving = false;
  facing = 0;
  walkTime = 0;
  time = 0;
  cam = { x: 0, y: 0 };
  toastList: Toast[] = [];
  dialog: DialogState | null = null;
  encounterGrace = 2;
  /** 剛抵達時所站的傳送格，需要先離開才會再次觸發 */
  arrivedAt: { x: number; y: number } | null = null;

  /** 走路動畫用的假裝移動時間（僅供 bob 計算） */
  bob = 0;

  constructor() {
    this.s = session.state;
    this.mapId = this.s.mapId;
    this.map = MAPS[this.mapId] ?? MAPS['village'];
    this.grid = MAP_GRIDS[this.map.id];
    this.px = this.s.px;
    this.py = this.s.py;
    this.tx = this.px;
    this.ty = this.py;
    this.facing = this.s.facing;
    const c = cameraFor(this.px, this.py, VIEW_W, VIEW_H);
    this.cam = c;
    this.clampCamera();
  }

  enter() {
    this.s = session.state;
    this.syncMap();
    if (this.map.encounters) this.encounterGrace = Math.max(this.encounterGrace, 1);
    // 每日委託：跨日時自動更新
    if (ensureDailies(this.s)) {
      this.toast('今日的委託已更新，記得到委託板看看。', '#9fe0ff');
    }
    // 進入世界時補發成就
    for (const a of grantAchievements(this.s)) {
      this.toast(`🏆 成就達成：${a.name}`, '#ffd76a');
    }
  }

  // ── 地圖切換 ──
  private syncMap() {
    const id = this.s.mapId;
    if (id !== this.mapId || !this.grid) {
      const changed = id !== this.mapId;
      this.mapId = id;
      this.map = MAPS[id] ?? MAPS['village'];
      this.grid = MAP_GRIDS[this.map.id];
      if (changed) audio.play('portal');
    }
    if (this.map.town) this.s.lastTown = this.map.id;
    this.px = this.s.px;
    this.py = this.s.py;
    this.tx = this.px;
    this.ty = this.py;
    this.facing = this.s.facing;
    const c = cameraFor(this.px, this.py, VIEW_W, VIEW_H);
    this.cam = c;
    this.clampCamera();
    questOnArrive(this.s, this.map.id);
    audio.setBgm(bgmForMap(this.map.id, !!this.map.town));
  }

  /** 回到地圖時恢復對應的背景音樂 */
  private updateBgm() {
    audio.setBgm(bgmForMap(this.map.id, !!this.map.town));
  }

  private walkableAt(x: number, y: number): boolean {
    if (!tileAt(this.grid, x, y).walk) return false;
    // 道具（井、水晶、告示牌…）視為障礙物
    if (this.map.props.some((p) => p.x === x && p.y === y)) return false;
    return true;
  }

  private clampCamera() {
    const w = this.map.w;
    const h = this.map.h;
    const mapLeft = (-(h - 1) * TILE_W) / 2 - TILE_W / 2;
    const mapRight = ((w - 1) * TILE_W) / 2 + TILE_W / 2;
    const mapTop = -TILE_H / 2;
    const mapBottom = ((w - 1 + h - 1) * TILE_H) / 2 + TILE_H / 2;
    const minX = mapRight - VIEW_W;
    const maxX = mapLeft;
    const minY = mapBottom - VIEW_H;
    const maxY = mapTop;
    this.cam.x = minX > maxX ? (minX + maxX) / 2 : clamp(this.cam.x, minX, maxX);
    this.cam.y = minY > maxY ? (minY + maxY) / 2 : clamp(this.cam.y, minY, maxY);
  }

  // ── 訊息 ──
  toast(text: string, color = '#ffe98a') {
    this.toastList.push({ text, t: 0, color });
    if (this.toastList.length > 4) this.toastList.shift();
  }

  // ── 每幀 ──
  update(dt: number) {
    this.time += dt;
    this.s.playTime += dt;
    for (const t of this.toastList) t.t += dt;
    this.toastList = this.toastList.filter((t) => t.t < 3);

    if (this.dialog) {
      this.updateDialog(dt);
      return;
    }

    if (input.consume('escape', 'x')) {
      this.openMenu();
      return;
    }

    if (input.consume('space', 'enter')) {
      if (this.interact()) return;
    }

    this.updateMovement(dt);

    // 鏡頭跟隨
    const want = cameraFor(this.px, this.py, VIEW_W, VIEW_H);
    const k = 1 - Math.pow(0.0008, dt);
    this.cam.x = lerp(this.cam.x, want.x, k);
    this.cam.y = lerp(this.cam.y, want.y, k);
    this.clampCamera();
  }

  private updateMovement(dt: number) {
    if (this.moving) {
      this.walkTime += dt;
      const speed = 4.2 * dt;
      this.px = approach(this.px, this.tx, speed);
      this.py = approach(this.py, this.ty, speed);
      if (this.px === this.tx && this.py === this.ty) {
        this.moving = false;
        this.onArrive();
      }
      return;
    }

    const a = input.axis();
    let dx = 0;
    let dy = 0;
    let f = this.facing;
    // 八方向：兩鍵同時按可走出純 X / 純 Y 的格子方向
    if (a.y < 0 && a.x < 0) {
      dx = -1;
      dy = 0;
      f = 1;
    } else if (a.y > 0 && a.x > 0) {
      dx = 1;
      dy = 0;
      f = 3;
    } else if (a.y > 0 && a.x < 0) {
      dx = 0;
      dy = 1;
      f = 0;
    } else if (a.y < 0 && a.x > 0) {
      dx = 0;
      dy = -1;
      f = 2;
    } else if (a.y < 0) {
      dx = -1;
      dy = -1;
      f = 2;
    } else if (a.y > 0) {
      dx = 1;
      dy = 1;
      f = 0;
    } else if (a.x < 0) {
      dx = -1;
      dy = 1;
      f = 1;
    } else if (a.x > 0) {
      dx = 1;
      dy = -1;
      f = 3;
    }
    if (dx === 0 && dy === 0) return;

    // 允許轉向而不移動
    const cx = Math.round(this.px);
    const cy = Math.round(this.py);
    const nx = cx + dx;
    const ny = cy + dy;
    this.facing = f;
    this.s.facing = f;
    if (this.walkableAt(nx, ny)) {
      this.tx = nx;
      this.ty = ny;
      this.moving = true;
      this.walkTime = 0;
    }
  }

  private onArrive() {
    this.s.px = this.tx;
    this.s.py = this.ty;
    this.s.steps++;
    if (this.encounterGrace > 0) this.encounterGrace--;

    // 傳送點
    const portal = this.map.portals.find((p) => p.x === this.tx && p.y === this.ty);
    if (portal) {
      if (portal.requires && !this.s.flags[portal.requires]) {
        this.toast('這裡還沒有任何反應……', '#a8b6cc');
      } else if (this.arrivedAt && this.arrivedAt.x === this.tx && this.arrivedAt.y === this.ty) {
        // 剛從這個傳送點抵達，先離開才會再次觸發
        this.arrivedAt = null;
      } else {
        this.travel(portal.to, portal.tx, portal.ty, portal.dir ?? 0);
        return;
      }
    }

    // 劇情觸發
    const trig = this.map.triggers.find((t) => t.x === this.tx && t.y === this.ty);
    if (trig && !this.s.flags[trig.flag]) {
      this.s.flags[trig.flag] = true;
      this.runAction(trig.action);
      return;
    }

    // 隨機遇敵
    if (this.map.encounters && this.encounterGrace <= 0) {
      if (Math.random() < this.map.encounters.rate) {
        this.startRandomBattle();
      }
    }
  }

  travel(to: string, x: number, y: number, dir: number) {
    // dir 只作為「抵達後面向」的提示，正規化為 4 個基本面向
    const facing = ((Math.round(dir) % 4) + 4) % 4;
    this.s.mapId = to;
    this.s.px = x;
    this.s.py = y;
    this.s.facing = facing;
    this.encounterGrace = 3;
    this.mapId = to;
    this.map = MAPS[to] ?? MAPS['village'];
    this.grid = MAP_GRIDS[this.map.id];
    if (this.map.town) this.s.lastTown = this.map.id;
    this.px = x;
    this.py = y;
    this.tx = x;
    this.ty = y;
    this.facing = facing;
    this.moving = false;
    this.arrivedAt = { x, y };
    const c = cameraFor(x, y, VIEW_W, VIEW_H);
    this.cam = c;
    this.clampCamera();
    questOnArrive(this.s, to);
    this.toast(`抵達 ${this.map.name}`, '#9fe0ff');
  }

  // ── 互動 ──
  private npcAt(x: number, y: number): NpcDef | undefined {
    return this.map.npcs.find((n) => n.x === x && n.y === y);
  }

  private propAt(x: number, y: number): PropDef | undefined {
    return this.map.props.find((p) => p.x === x && p.y === y);
  }

  private frontTile(): { x: number; y: number } {
    const cx = Math.round(this.px);
    const cy = Math.round(this.py);
    // 只有 4 個基本面向；facing 可能來自傳送點的 dir（任意整數），一律正規化避免越界
    const FRONT = [
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: -1 },
      { x: 1, y: -1 }
    ];
    const d = FRONT[((Math.round(this.facing) % 4) + 4) % 4] ?? FRONT[0];
    return { x: cx + d.x, y: cy + d.y };
  }

  /** 互動 / 提示用的相鄰格優先序：面朝方向 → 自身 → 斜角 → 正交 */
  private interactOrder(): { x: number; y: number }[] {
    const cx = Math.round(this.px);
    const cy = Math.round(this.py);
    const f = this.frontTile();
    return [
      { x: f.x, y: f.y },
      { x: cx, y: cy },
      { x: cx + 1, y: cy + 1 },
      { x: cx - 1, y: cy - 1 },
      { x: cx - 1, y: cy + 1 },
      { x: cx + 1, y: cy - 1 },
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 }
    ];
  }

  private interact(): boolean {
    const order = this.interactOrder();
    for (const t of order) {
      const npc = this.npcAt(t.x, t.y);
      if (npc) {
        this.startDialog(npcDialogue(npc.id, this.s), npc.name);
        return true;
      }
    }
    for (const t of order) {
      const prop = this.propAt(t.x, t.y);
      if (!prop) continue;
      if (prop.kind === 'board') {
        scenes.push(new QuestScene(() => this.syncMap()));
        return true;
      }
      if (prop.text) {
        this.startDialog({ lines: [{ who: '告示牌', text: prop.text }] }, '告示牌');
        return true;
      }
    }
    return false;
  }

  private startDialog(node: { lines: StoryLine[]; action?: string; choices?: { text: string; action?: string }[] }, _who: string) {
    audio.play('talk');
    this.dialog = {
      lines: node.lines,
      index: 0,
      shown: 0,
      action: node.action,
      choices: node.choices,
      choiceIndex: 0
    };
  }

  private updateDialog(dt: number) {
    const d = this.dialog!;
    const line = d.lines[d.index];
    const full = line.text.length;
    if (d.shown < full) {
      d.shown = Math.min(full, d.shown + dt * 55);
      if (input.consume('space', 'enter')) d.shown = full;
      return;
    }

    const atLast = d.index >= d.lines.length - 1;

    if (atLast && d.choices && d.choices.length) {
      if (input.nav('arrowup', dt) || input.nav('w', dt)) {
        d.choiceIndex = (d.choiceIndex - 1 + d.choices.length) % d.choices.length;
      }
      if (input.nav('arrowdown', dt) || input.nav('s', dt)) {
        d.choiceIndex = (d.choiceIndex + 1) % d.choices.length;
      }
      if (input.consume('space', 'enter')) {
        const ch = d.choices[d.choiceIndex];
        this.dialog = null;
        if (ch.action) this.runAction(ch.action);
        else if (d.action) this.runAction(d.action);
        return;
      }
      input.consume('escape');
      return;
    }

    if (input.consume('space', 'enter')) {
      if (atLast) {
        const act = d.action;
        this.dialog = null;
        if (act) this.runAction(act);
      } else {
        d.index++;
        d.shown = 0;
      }
    }
  }

  // ── 動作 ──
  runAction(action: string) {
    for (const raw of action.split(';')) {
      const part = raw.trim();
      if (!part) continue;
      const seg = part.split(':');
      switch (seg[0]) {
        case 'heal':
          fullRestore(this.s);
          this.toast('全隊 HP / MP 已完全恢復', '#8ef0a8');
          break;
        case 'shop':
          scenes.push(new ShopScene(() => this.syncMap()));
          return;
        case 'travel': {
          const mapId = seg[1];
          const x = parseInt(seg[2] ?? '1', 10);
          const y = parseInt(seg[3] ?? '1', 10);
          if (MAPS[mapId]) {
            this.s.mapId = mapId;
            this.s.px = x;
            this.s.py = y;
            this.s.facing = 2;
            this.arrivedAt = { x, y };
            this.syncMap();
            this.encounterGrace = 6;
            this.toast(`抵達 ${MAPS[mapId].name}`, '#9fe0ff');
          }
          break;
        }
        case 'give': {
          const id = seg[1];
          const n = parseInt(seg[2] ?? '1', 10);
          addItem(this.s, id, n);
          this.toast(`獲得 ${itemName(id)} ×${n}`, '#ffe98a');
          break;
        }
        case 'flag':
          this.s.flags[seg[1]] = true;
          break;
        case 'stage':
          this.s.stage = parseInt(seg[1], 10);
          break;
        case 'battle':
          this.startScriptedBattle(seg[1]);
          return;
        case 'recruit': {
          const species = seg[1];
          const lvl = Math.max(1, this.s.party[0]?.level ?? 1);
          const u = createUnit(species, lvl, 'hero');
          u.hp = u.max.hp;
          u.mp = u.max.mp;
          this.s.dex[species] = true;
          if (this.s.party.length < MAX_PARTY) {
            this.s.party.push(u);
            this.toast(`${u.name} 加入了隊伍！`, '#9fe0ff');
          } else {
            this.s.storage.push(u);
            this.toast(`${u.name} 加入了待命區！`, '#9fe0ff');
          }
          break;
        }
        case 'ending':
          this.s.flags['ended'] = true;
          break;
        default:
          break;
      }
    }
  }

  // ── 戰鬥 ──
  private startScriptedBattle(id: string) {
    const def = SCRIPTED_BATTLES[id];
    if (!def) return;
    const enemies = def.enemies
      .filter((e) => SPECIES[e.species])
      .map((e) => createUnit(e.species, e.level, 'enemy'));
    scenes.push(
      new BattleScene({
        enemies,
        bg: def.bg,
        boss: def.boss,
        canFlee: def.canFlee,
        intro: def.intro,
        phases: def.phases,
        onEnd: (result) => {
          if (result === 'win') {
            if (def.onWin) this.runAction(def.onWin);
            this.maybeEnding();
          } else if (result === 'lose') {
            this.respawn();
          }
        }
      })
    );
  }

  private maybeEnding() {
    if (this.s.flags['true_ended'] && !this.s.flags['true_ending_shown']) {
      this.s.flags['true_ending_shown'] = true;
      void import('./menus').then((m) => {
        m.resetStars();
        scenes.set(new m.EndingScene(m.TRUE_ENDING_LINES));
      });
      return;
    }
    if (this.s.flags['ended'] && !this.s.flags['ending_shown']) {
      this.s.flags['ending_shown'] = true;
      void import('./menus').then((m) => {
        m.resetStars();
        scenes.set(new m.EndingScene());
      });
    }
  }

  private startRandomBattle() {
    const enc = this.map.encounters!;
    const total = enc.table.reduce((a, b) => a + b.weight, 0);
    const count = 1 + Math.floor(Math.random() * 3);
    const enemies: Unit[] = [];
    for (let i = 0; i < count; i++) {
      let roll = Math.random() * total;
      let chosen = enc.table[0];
      for (const e of enc.table) {
        roll -= e.weight;
        if (roll <= 0) {
          chosen = e;
          break;
        }
      }
      const lvl = chosen.min + Math.floor(Math.random() * (chosen.max - chosen.min + 1));
      enemies.push(createUnit(chosen.species, lvl, 'enemy'));
    }
    scenes.push(
      new BattleScene({
        enemies,
        bg: bgForMap(this.mapId, !!this.map.indoor),
        boss: false,
        canFlee: true,
        onEnd: (result) => {
          if (result === 'lose') this.respawn();
        }
      })
    );
  }

  respawn() {
    fullRestore(this.s);
    this.s.mapId = 'village';
    this.s.px = 9;
    this.s.py = 11;
    this.s.facing = 2;
    this.syncMap();
    this.encounterGrace = 5;
    this.toast('你在晨曦村的床鋪上醒了過來……', '#ffb0b0');
  }

  private openMenu() {
    scenes.push(new MenuScene(() => this.syncMap()));
  }

  // ── 繪圖 ──
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (this.map.indoor) {
      sky.addColorStop(0, '#0a0812');
      sky.addColorStop(1, '#161024');
    } else if (this.mapId === 'harbor') {
      sky.addColorStop(0, '#1b2a4a');
      sky.addColorStop(1, '#3a4a6a');
    } else {
      sky.addColorStop(0, '#1d2b44');
      sky.addColorStop(1, '#2c3f5c');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    this.drawGround(ctx);
    this.drawSorted(ctx);

    // 環境色調
    if (this.map.tint) {
      ctx.fillStyle = this.map.tint;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.map.indoor) {
      const p = worldToScreen(this.px, this.py, this.cam);
      const g = ctx.createRadialGradient(p.sx, p.sy - 30, 30, p.sx, p.sy - 30, 320);
      g.addColorStop(0, 'rgba(6,3,16,0)');
      g.addColorStop(1, 'rgba(6,3,16,0.78)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    this.drawHud(ctx);
    if (this.dialog) this.drawDialog(ctx);
  }

  private tileCenter(x: number, y: number) {
    return worldToScreen(x, y, this.cam);
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    for (let y = 0; y < this.map.h; y++) {
      for (let x = 0; x < this.map.w; x++) {
        const def = tileAt(this.grid, x, y);
        const { sx, sy } = this.tileCenter(x, y);
        if (sx < -TILE_W || sx > VIEW_W + TILE_W || sy < -TILE_H * 4 || sy > VIEW_H + TILE_H * 4) continue;
        this.diamond(ctx, sx, sy);
        let c = def.top;
        if (def.water) {
          const w = Math.sin(this.time * 1.6 + x * 0.7 + y * 0.5) * 0.5 + 0.5;
          c = shade(def.top, -0.12 + w * 0.18);
        } else if ((x + y) % 2 === 0) {
          c = shade(def.top, 0.03);
        }
        ctx.fillStyle = c;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.stroke();

        if (def.deco === 'flower') this.drawFlower(ctx, sx, sy);
        else if (def.deco === 'grass') this.drawGrassTuft(ctx, sx, sy);
      }
    }
  }

  private diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - TILE_H / 2);
    ctx.lineTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx - TILE_W / 2, cy);
    ctx.closePath();
  }

  private drawFlower(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    const cols = ['#f7e07a', '#f78ab0', '#a8d8ff'];
    for (let i = 0; i < 3; i++) {
      const a = this.time * 0.6 + i * 2.1 + sx * 0.01;
      const ox = Math.cos(a) * 9;
      const oy = Math.sin(a) * 4;
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.arc(sx + ox, sy + oy - 3, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGrassTuft(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    ctx.strokeStyle = shade('#4a8745', 0.25);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const sway = Math.sin(this.time * 2 + sx * 0.05 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(sx + i * 6, sy + 2);
      ctx.quadraticCurveTo(sx + i * 6 + sway, sy - 6, sx + i * 6 + sway * 1.6, sy - 12);
      ctx.stroke();
    }
  }

  private drawSorted(ctx: CanvasRenderingContext2D) {
    type Item = { key: number; kind: number; draw: () => void };
    const items: Item[] = [];

    for (let y = 0; y < this.map.h; y++) {
      for (let x = 0; x < this.map.w; x++) {
        const def = tileAt(this.grid, x, y);
        if (def.h <= 0) continue;
        const { sx, sy } = this.tileCenter(x, y);
        if (sx < -TILE_W * 2 || sx > VIEW_W + TILE_W * 2 || sy < -TILE_H * 8 || sy > VIEW_H + TILE_H * 6)
          continue;
        items.push({ key: x + y, kind: 0, draw: () => this.drawBlock(ctx, def.ch, sx, sy, x, y) });
      }
    }

    for (const prop of this.map.props) {
      const { sx, sy } = this.tileCenter(prop.x, prop.y);
      items.push({
        key: prop.x + prop.y + 0.4,
        kind: 0,
        draw: () => this.drawProp(ctx, prop, sx, sy)
      });
    }

    for (const npc of this.map.npcs) {
      const { sx, sy } = this.tileCenter(npc.x, npc.y);
      items.push({ key: npc.x + npc.y + 0.5, kind: 1, draw: () => this.drawNpc(ctx, npc, sx, sy) });
    }

    {
      const { sx, sy } = this.tileCenter(this.px, this.py);
      items.push({
        key: this.px + this.py + 0.5,
        kind: 1,
        draw: () => {
          drawHero(ctx, sx, sy, 1, this.facing, {
            skin: '#f0c8a0',
            hair: '#3f3128',
            cloth: '#3a6fd8',
            cloth2: '#26489a',
            cape: '#2f8ad8'
          }, this.time, this.moving);
        }
      });
    }

    items.sort((a, b) => a.key - b.key || a.kind - b.kind);
    for (const it of items) it.draw();
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    ch: string,
    cx: number,
    cy: number,
    x: number,
    y: number
  ) {
    const def = tileAt(this.grid, x, y);
    const lift = def.h * TILE_H;
    const topY = cy - lift;

    // 側面
    ctx.beginPath();
    ctx.moveTo(cx - TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, cy + TILE_H / 2 - lift);
    ctx.lineTo(cx - TILE_W / 2, cy - lift);
    ctx.closePath();
    ctx.fillStyle = shade(def.side, -0.14);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + TILE_W / 2, cy);
    ctx.lineTo(cx, cy + TILE_H / 2);
    ctx.lineTo(cx, cy + TILE_H / 2 - lift);
    ctx.lineTo(cx + TILE_W / 2, cy - lift);
    ctx.closePath();
    ctx.fillStyle = shade(def.side, 0.06);
    ctx.fill();

    if (ch === 'T') {
      // 樹：樹幹 + 樹冠
      ctx.fillStyle = '#5c4128';
      ctx.beginPath();
      ctx.moveTo(cx - TILE_W / 2, cy);
      ctx.lineTo(cx, cy + TILE_H / 2);
      ctx.lineTo(cx, cy + TILE_H / 2 - lift);
      ctx.lineTo(cx - TILE_W / 2, cy - lift);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + TILE_W / 2, cy);
      ctx.lineTo(cx, cy + TILE_H / 2);
      ctx.lineTo(cx, cy + TILE_H / 2 - lift);
      ctx.lineTo(cx + TILE_W / 2, cy - lift);
      ctx.closePath();
      ctx.fillStyle = '#6d4e30';
      ctx.fill();

      const sway = Math.sin(this.time * 1.2 + x * 1.3 + y * 0.7) * 1.5;
      const cyTop = topY - 12;
      ctx.fillStyle = '#3f7d3a';
      ctx.beginPath();
      ctx.arc(cx - 12 + sway, cyTop + 6, 15, 0, Math.PI * 2);
      ctx.arc(cx + 12 + sway, cyTop + 6, 15, 0, Math.PI * 2);
      ctx.arc(cx + sway, cyTop - 6, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(150,220,140,0.28)';
      ctx.beginPath();
      ctx.arc(cx - 6 + sway, cyTop - 12, 9, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // 頂面
    this.diamond(ctx, cx, topY);
    ctx.fillStyle = ch === 'r' ? shade('#b04f4f', (x + y) % 2 ? 0.03 : -0.03) : def.top;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (ch === 'R') {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.ellipse(cx - 7, topY - 2, 7, 3.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (ch === 'r') {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(cx, topY - TILE_H / 2 + 3);
      ctx.lineTo(cx + 10, topY + 1);
      ctx.lineTo(cx, topY + 5);
      ctx.lineTo(cx - 10, topY + 1);
      ctx.closePath();
      ctx.fill();
    }
    if (ch === 'w') {
      ctx.fillStyle = '#2f4a6a';
      ctx.beginPath();
      ctx.ellipse(cx - 8, topY - 4, 7, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 8, topY - 4, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(160,220,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx - 10, topY - 6, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawProp(ctx: CanvasRenderingContext2D, prop: PropDef, sx: number, sy: number) {
    switch (prop.kind) {
      case 'sign': {
        ctx.fillStyle = '#6d4a28';
        ctx.fillRect(sx - 2, sy - 22, 4, 22);
        ctx.fillStyle = '#a8763f';
        ctx.fillRect(sx - 16, sy - 32, 32, 14);
        ctx.strokeStyle = '#6d4a28';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 16, sy - 32, 32, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(sx - 11, sy - 27, 22, 2);
        ctx.fillRect(sx - 11, sy - 23, 15, 2);
        break;
      }
      case 'board': {
        // 委託板：兩根木柱 + 板面 + 紙張
        ctx.fillStyle = '#5c4128';
        ctx.fillRect(sx - 17, sy - 34, 4, 34);
        ctx.fillRect(sx + 13, sy - 34, 4, 34);
        ctx.fillStyle = '#a8763f';
        ctx.fillRect(sx - 22, sy - 46, 44, 26);
        ctx.strokeStyle = '#6d4a28';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 22, sy - 46, 44, 26);
        // 釘在板上的委託單
        ctx.fillStyle = '#f3ecd8';
        ctx.fillRect(sx - 17, sy - 42, 12, 9);
        ctx.fillRect(sx - 2, sy - 43, 12, 10);
        ctx.fillRect(sx + 6, sy - 36, 12, 12);
        ctx.fillStyle = 'rgba(120,100,70,0.8)';
        ctx.fillRect(sx - 15, sy - 39, 8, 1.5);
        ctx.fillRect(sx - 15, sy - 36, 6, 1.5);
        ctx.fillRect(sx, sy - 40, 8, 1.5);
        ctx.fillRect(sx + 8, sy - 32, 8, 1.5);
        break;
      }
      case 'well': {
        ctx.fillStyle = '#7a7d86';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 4, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1b2a44';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 5, 14, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5c4128';
        ctx.fillRect(sx - 16, sy - 34, 4, 30);
        ctx.fillRect(sx + 12, sy - 34, 4, 30);
        ctx.fillStyle = '#8a3a3a';
        ctx.beginPath();
        ctx.moveTo(sx - 22, sy - 34);
        ctx.lineTo(sx + 22, sy - 34);
        ctx.lineTo(sx + 14, sy - 44);
        ctx.lineTo(sx - 14, sy - 44);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'crystal': {
        const pulse = 0.6 + Math.sin(this.time * 2.4 + sx * 0.05) * 0.25;
        ctx.save();
        ctx.shadowColor = `rgba(150,120,255,${pulse})`;
        ctx.shadowBlur = 26;
        const cols = ['#9a86f0', '#c0b0f8', '#7f6ce0'];
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 9;
          const hgt = 22 + (i % 2) * 12;
          ctx.fillStyle = cols[i];
          ctx.beginPath();
          ctx.moveTo(sx + ox, sy - hgt);
          ctx.lineTo(sx + ox + 7, sy - hgt * 0.45);
          ctx.lineTo(sx + ox + 4, sy);
          ctx.lineTo(sx + ox - 4, sy);
          ctx.lineTo(sx + ox - 7, sy - hgt * 0.45);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 'chest': {
        ctx.fillStyle = '#8a5a2a';
        ctx.fillRect(sx - 14, sy - 18, 28, 18);
        ctx.fillStyle = '#c8a04a';
        ctx.fillRect(sx - 14, sy - 22, 28, 6);
        ctx.fillStyle = '#f0d878';
        ctx.fillRect(sx - 3, sy - 14, 6, 8);
        break;
      }
      case 'torch': {
        ctx.fillStyle = '#5c4128';
        ctx.fillRect(sx - 3, sy - 30, 6, 30);
        const f = 1 + Math.sin(this.time * 9 + sx) * 0.18;
        ctx.save();
        ctx.shadowColor = 'rgba(255,170,60,0.9)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffb43c';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 36, 6 * f, 11 * f, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff0a0';
        ctx.beginPath();
        ctx.ellipse(sx, sy - 34, 3 * f, 6 * f, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'boat': {
        const bob = Math.sin(this.time * 1.4 + sx * 0.02) * 2.5;
        ctx.save();
        ctx.translate(0, bob);
        ctx.fillStyle = '#8a5a2a';
        ctx.beginPath();
        ctx.moveTo(sx - 30, sy - 8);
        ctx.lineTo(sx + 30, sy - 8);
        ctx.lineTo(sx + 20, sy + 2);
        ctx.lineTo(sx - 20, sy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a8763f';
        ctx.fillRect(sx - 2, sy - 34, 4, 26);
        ctx.fillStyle = '#e8e0d0';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy - 32);
        ctx.lineTo(sx + 24, sy - 12);
        ctx.lineTo(sx + 2, sy - 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
    }
  }

  private drawNpc(ctx: CanvasRenderingContext2D, npc: NpcDef, sx: number, sy: number) {
    const col = npc.color ?? {
      skin: '#f0c8a0',
      hair: '#3f3128',
      cloth: '#8a8a9a',
      cloth2: '#5a5a6a'
    };
    drawHero(ctx, sx, sy, 1, npc.dir ?? 0, col, this.time * 0.4 + npc.x, false);
    label(ctx, npc.name, sx, sy - 56, {
      size: 11,
      align: 'center',
      color: '#dfe8ff',
      shadow: true
    });
  }

  // ── HUD ──
  private drawHud(ctx: CanvasRenderingContext2D) {
    // 地點
    panel(ctx, 10, 10, 186, 30, { alpha: 0.85, radius: 6 });
    label(ctx, this.map.name, 22, 30, { size: 15, bold: true, color: '#ffe6a8' });

    // 任務
    const hint = questHint(this.s);
    const lines = wrapText(ctx, hint, 240, 12);
    panel(ctx, 10, 46, 262, 22 + lines.length * 16, { alpha: 0.8, radius: 6 });
    label(ctx, '◆ 現在目標', 20, 63, { size: 11, color: '#8ed0ff', bold: true });
    lines.forEach((l, i) => label(ctx, l, 20, 80 + i * 16, { size: 12, color: '#d8e4ff' }));

    // 進行中的委託
    const actives = activeQuestSummary(this.s);
    if (actives.length > 0) {
      const ay = 46 + 22 + lines.length * 16 + 6;
      const shown = actives.slice(0, 4);
      panel(ctx, 10, ay, 262, 20 + shown.length * 16, { alpha: 0.8, radius: 6 });
      label(ctx, '◆ 委託', 20, ay + 15, { size: 11, color: '#ffd76a', bold: true });
      shown.forEach((l, i) =>
        label(ctx, l, 20, ay + 32 + i * 16, { size: 12, color: '#e8eefc' })
      );
      if (actives.length > shown.length) {
        label(ctx, `…還有 ${actives.length - shown.length} 件`, 20, ay + 32 + shown.length * 16, {
          size: 11,
          color: '#a8b6cc'
        });
      }
    }

    // 隊伍
    const py = VIEW_H - 26 - this.s.party.length * 26;
    panel(ctx, 10, py - 24, 246, this.s.party.length * 26 + 32, { alpha: 0.86, radius: 6 });
    label(ctx, '隊伍', 20, py - 8, { size: 11, bold: true, color: '#8ed0ff' });
    this.s.party.forEach((u, i) => {
      const y = py + i * 26;
      const down = u.hp <= 0;
      label(ctx, u.name, 22, y + 10, {
        size: 12,
        color: down ? '#ff8a8a' : '#e8eefc',
        bold: true
      });
      label(ctx, `Lv${u.level}`, 108, y + 10, { size: 11, color: '#a8b6cc' });
      bar(ctx, 148, y, 88, 10, u.hp / u.max.hp, {
        color: u.hp / u.max.hp > 0.5 ? '#54d16a' : u.hp / u.max.hp > 0.25 ? '#e8c24a' : '#e05a5a',
        color2: 'rgba(255,255,255,0.22)',
        border: 'rgba(255,255,255,0.25)'
      });
      label(ctx, `${u.hp}/${u.max.hp}`, 194, y + 9, { size: 10, color: '#c8d4e8' });
    });

    // 金幣
    panel(ctx, VIEW_W - 150, 10, 140, 28, { alpha: 0.85, radius: 6 });
    label(ctx, `${this.s.gold} G`, VIEW_W - 24, 29, {
      size: 14,
      bold: true,
      color: '#ffd76a',
      align: 'right'
    });

    // 操作提示
    const nearby = this.interactOrder()
      .map((t) => this.npcAt(t.x, t.y))
      .find((n): n is NpcDef => !!n);
    if (nearby) {
      panel(ctx, VIEW_W / 2 - 92, VIEW_H - 96, 184, 26, { alpha: 0.85, radius: 6 });
      label(ctx, '[空白鍵] 交談', VIEW_W / 2, VIEW_H - 78, {
        size: 12,
        align: 'center',
        color: '#ffe6a8'
      });
    }

    // toast
    this.toastList.forEach((t, i) => {
      const a = t.t > 2.4 ? 1 - (t.t - 2.4) / 0.6 : 1;
      label(ctx, t.text, VIEW_W / 2, 96 + i * 20, {
        size: 14,
        align: 'center',
        color: t.color,
        alpha: Math.max(0, a),
        bold: true
      });
    });

    // 底部提示
    label(ctx, '方向鍵/WASD 移動　空白鍵 交談　Esc 選單', VIEW_W / 2, VIEW_H - 8, {
      size: 11,
      align: 'center',
      color: 'rgba(200,215,240,0.75)'
    });
  }

  private drawDialog(ctx: CanvasRenderingContext2D) {
    const d = this.dialog!;
    const line = d.lines[d.index];
    const boxH = d.choices && d.index === d.lines.length - 1 && d.shown >= line.text.length ? 150 : 118;
    const bx = 40;
    const by = VIEW_H - boxH - 46;
    const bw = VIEW_W - 80;
    drawTextBox(ctx, bx, by, bw, boxH);

    // 說話者
    const isBeast = line.beast;
    if (isBeast) {
      const sp = SPECIES[line.beast!];
      if (sp) {
        drawBeast(ctx, bx + 52, by + boxH - 18, 1.5, 3, {
          shape: sp.shape,
          c1: sp.c1,
          c2: sp.c2,
          size: sp.size,
          horns: sp.horns
        }, this.time);
      }
    } else {
      panel(ctx, bx + 16, by - 14, 120, 28, {
        radius: 6,
        fill: 'rgba(30,48,88,0.96)',
        border: 'rgba(150,200,255,0.7)'
      });
      label(ctx, line.who, bx + 76, by + 5, {
        size: 14,
        align: 'center',
        color: '#ffe6a8',
        bold: true
      });
    }

    const text = line.text.slice(0, Math.floor(d.shown));
    const lines = wrapText(ctx, text, bw - 60, 17);
    lines.forEach((l, i) => label(ctx, l, bx + 30, by + 48 + i * 26, { size: 17, color: '#eef3ff' }));

    // 選項
    if (d.choices && d.index === d.lines.length - 1 && d.shown >= line.text.length) {
      const cy0 = by + 56 + lines.length * 26;
      d.choices.forEach((c, i) => {
        const sel = i === d.choiceIndex;
        const y = cy0 + i * 24;
        if (sel) {
          panel(ctx, bx + 26, y - 15, bw - 52, 22, {
            radius: 5,
            fill: 'rgba(70,120,220,0.5)',
            border: 'rgba(180,220,255,0.8)'
          });
        }
        label(ctx, `${sel ? '▶ ' : '   '}${c.text}`, bx + 38, y, {
          size: 14,
          color: sel ? '#ffffff' : '#c8d4e8'
        });
      });
    } else {
      const blink = Math.sin(this.time * 5) > 0 ? 1 : 0.25;
      label(ctx, '▼', bx + bw - 32, by + boxH - 14, {
        size: 16,
        color: '#ffe6a8',
        alpha: blink,
        align: 'center'
      });
    }
  }
}
