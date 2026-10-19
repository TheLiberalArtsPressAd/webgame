import './style.css';
import { VIEW_H, VIEW_W, scenes } from './engine/scene';
import { clearPressed, setupInput } from './engine/input';
import { audio } from './engine/audio';
import { TitleScene } from './scenes/menus';
import { session } from './game/session';
import { initGameConfig } from './game/config';
import type { BattleBg } from './game/story';

// 先套用管理後台的覆寫設定，再建立任何場景
const adminConfig = initGameConfig();
if (adminConfig) {
  console.info(`[星塵幻獸] 已套用管理後台設定（更新時間：${new Date(adminConfig.updatedAt).toLocaleString()}）`);
}
console.info('[星塵幻獸] 管理後台：/admin.html');

const canvas = document.getElementById('game') as HTMLCanvasElement | null;
if (!canvas) throw new Error('找不到 canvas#game');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('無法取得 2D 繪圖內容');

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas!.width = Math.floor(VIEW_W * dpr);
  canvas!.height = Math.floor(VIEW_H * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas!.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas!.style.height = `${Math.floor(VIEW_H * scale)}px`;
}

window.addEventListener('resize', resize);
resize();

setupInput(canvas);
scenes.set(new TitleScene());

// 音訊需在使用者互動後才能啟動
const unlockAudio = () => audio.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  scenes.update(dt);

  ctx!.clearRect(0, 0, VIEW_W, VIEW_H);
  scenes.render(ctx!);

  clearPressed();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// 開發用除錯介面（僅在 dev 模式提供，不影響正式打包）
if (import.meta.env.DEV) {
  const dbg: Record<string, unknown> = { scenes, session, audio };
  dbg.goto = async (mapId: string, x: number, y: number) => {
    session.state.mapId = mapId;
    session.state.px = x;
    session.state.py = y;
    session.state.facing = 2;
    const m = await import('./scenes/field');
    scenes.set(new m.FieldScene());
  };
  dbg.battle = async (spec: [string, number][], bg = 'field', boss = false) => {
    const m = await import('./scenes/battleScene');
    const d = await import('./game/data');
    scenes.set(
      new m.BattleScene({
        enemies: spec.map(([s, l]) => d.createUnit(s, l, 'enemy')),
        bg: bg as BattleBg,
        boss,
        canFlee: !boss,
        intro: '（除錯戰鬥）',
        onEnd: () => {}
      })
    );
  };
  dbg.give = async (id: string, n: number) => {
    const st = await import('./game/state');
    st.addItem(session.state, id, n);
  };
  dbg.setLevel = async (lv: number) => {
    const st = await import('./game/state');
    for (const u of session.state.party) {
      u.level = lv;
      st.recalc(u);
      u.hp = u.max.hp;
      u.mp = u.max.mp;
    }
  };
  (window as unknown as Record<string, unknown>).__sb = dbg;
}
