// 程式化繪圖工具 + 角色／幻獸 Sprite（全部即時繪製，不使用任何外部圖檔）
import type { Shape, SpriteDef } from '../game/types';

export const FONT = '"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC",sans-serif';

export function font(size: number, bold = false) {
  return `${bold ? '700' : '400'} ${size}px ${FONT}`;
}

export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

export interface PanelOpts {
  fill?: string;
  border?: string;
  borderWidth?: number;
  radius?: number;
  alpha?: number;
  glow?: string;
}

export function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  o: PanelOpts = {}
) {
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.glow) {
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = 18;
  }
  rrect(ctx, x, y, w, h, o.radius ?? 8);
  ctx.fillStyle = o.fill ?? 'rgba(12,18,32,0.92)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = o.borderWidth ?? 2;
  ctx.strokeStyle = o.border ?? 'rgba(130,175,255,0.5)';
  ctx.stroke();
  ctx.restore();
}

export interface TextOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  bold?: boolean;
  shadow?: boolean;
  alpha?: number;
}

export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: TextOpts = {}
) {
  ctx.save();
  ctx.font = font(o.size ?? 14, o.bold);
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  if (o.shadow !== false) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillText(text, x + 1, y + 1);
  }
  ctx.fillStyle = o.color ?? '#e8eefc';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export interface BarOpts {
  bg?: string;
  color?: string;
  color2?: string;
  border?: string;
  radius?: number;
}

export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  o: BarOpts = {}
) {
  const r = Math.max(0, Math.min(1, ratio));
  ctx.save();
  rrect(ctx, x, y, w, h, o.radius ?? 3);
  ctx.fillStyle = o.bg ?? 'rgba(0,0,0,0.55)';
  ctx.fill();
  if (r > 0) {
    ctx.save();
    rrect(ctx, x, y, w, h, o.radius ?? 3);
    ctx.clip();
    ctx.fillStyle = o.color ?? '#54d16a';
    ctx.fillRect(x, y, w * r, h);
    if (o.color2) {
      ctx.fillStyle = o.color2;
      ctx.fillRect(x, y, w * r, Math.max(1, h / 2));
    }
    ctx.restore();
  }
  if (o.border) {
    rrect(ctx, x, y, w, h, o.radius ?? 3);
    ctx.lineWidth = 1;
    ctx.strokeStyle = o.border;
    ctx.stroke();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// 角色（Q 版人物）
// ─────────────────────────────────────────────────────────────
export interface HumanColors {
  skin: string;
  hair: string;
  cloth: string;
  cloth2: string;
  cape?: string;
}

/** facing: 0=下 1=左 2=上 3=右 */
export function drawHero(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: number,
  c: HumanColors,
  t: number,
  walking: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 影子
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const bob = walking ? Math.sin(t * 11) * 1.6 : Math.sin(t * 2.2) * 0.7;
  const swing = walking ? Math.sin(t * 11) : 0;
  ctx.translate(0, bob);

  // 腿
  ctx.fillStyle = c.cloth2;
  ctx.beginPath();
  ctx.ellipse(-4 + swing * 2.5, -5, 3.4, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4 - swing * 2.5, -5, 3.4, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 披風（背面才看得到）
  if (c.cape && facing === 2) {
    ctx.fillStyle = c.cape;
    ctx.beginPath();
    ctx.moveTo(-9, -30);
    ctx.quadraticCurveTo(-13, -14, -8, -2);
    ctx.lineTo(8, -2);
    ctx.quadraticCurveTo(13, -14, 9, -30);
    ctx.closePath();
    ctx.fill();
  }

  // 身體
  const grad = ctx.createLinearGradient(0, -30, 0, -8);
  grad.addColorStop(0, c.cloth);
  grad.addColorStop(1, c.cloth2);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-8, -30);
  ctx.quadraticCurveTo(-11, -19, -7.5, -8);
  ctx.lineTo(7.5, -8);
  ctx.quadraticCurveTo(11, -19, 8, -30);
  ctx.closePath();
  ctx.fill();

  // 手臂
  ctx.fillStyle = c.cloth;
  ctx.beginPath();
  ctx.ellipse(-9.5, -20 - swing * 1.5, 3, 6, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9.5, -20 + swing * 1.5, 3, 6, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // 頭
  const headY = -38;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(0, headY, 9.2, 0, Math.PI * 2);
  ctx.fill();

  // 頭髮
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  if (facing === 2) {
    ctx.arc(0, headY, 9.4, 0, Math.PI * 2);
  } else {
    ctx.arc(0, headY - 0.6, 9.4, Math.PI * 1.03, Math.PI * 1.97);
    ctx.lineTo(8.6, headY + 3);
    ctx.quadraticCurveTo(6, headY - 2, 2, headY - 1);
    ctx.lineTo(-2, headY - 1);
    ctx.quadraticCurveTo(-6, headY - 2, -8.6, headY + 3);
  }
  ctx.closePath();
  ctx.fill();

  // 臉
  if (facing !== 2) {
    const eo = facing === 1 ? -2 : facing === 3 ? 2 : 0;
    ctx.fillStyle = 'rgba(30,22,28,0.92)';
    ctx.beginPath();
    ctx.ellipse(-3.2 + eo, headY + 2.2, 1.25, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3.2 + eo, headY + 2.2, 1.25, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,150,140,0.35)';
    ctx.beginPath();
    ctx.arc(-6 + eo, headY + 4.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6 + eo, headY + 4.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// 幻獸（依 shape 程序化生成）
// ─────────────────────────────────────────────────────────────
export function drawBeast(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facing: number,
  sp: SpriteDef,
  t: number,
  hurt = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * sp.size, scale * sp.size);

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const bob = Math.sin(t * 4.5) * 1.6;
  ctx.translate(0, bob);
  const flip = facing === 1 ? -1 : 1;
  if (flip < 0) ctx.scale(-1, 1);

  if (hurt > 0) {
    ctx.shadowColor = 'rgba(255,80,80,0.9)';
    ctx.shadowBlur = 22 * hurt;
  }

  const shape: Shape = sp.shape;
  switch (shape) {
    case 'beast':
      drawBeastQuadruped(ctx, sp, t);
      break;
    case 'bird':
      drawBeastBird(ctx, sp, t);
      break;
    case 'fish':
      drawBeastFish(ctx, sp, t);
      break;
    case 'bug':
      drawBeastBug(ctx, sp, t);
      break;
    case 'dragon':
      drawBeastDragon(ctx, sp, t);
      break;
    case 'human':
      drawBeastHuman(ctx, sp, t);
      break;
    default:
      drawBeastBlob(ctx, sp, t);
  }

  ctx.restore();
}

function legs(ctx: CanvasRenderingContext2D, color: string, t: number, y = -6, spread = 10) {
  ctx.fillStyle = color;
  for (const dx of [-spread, -spread + 5, spread - 5, spread]) {
    const ph = Math.sin(t * 4 + dx) * 1.4;
    ctx.beginPath();
    ctx.ellipse(dx, y + ph, 3.4, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function beastEyes(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  count: number,
  color = '#121018'
) {
  ctx.fillStyle = color;
  if (count === 1) {
    ctx.beginPath();
    ctx.ellipse(hx, hy, 3.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx - 1, hy - 1, 1.1, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  for (const dx of [-4, 4]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(hx + dx, hy, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(hx + dx - 0.7, hy - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBeastQuadruped(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  // 尾巴
  ctx.strokeStyle = c2;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, -20);
  ctx.quadraticCurveTo(-30, -30 + Math.sin(t * 5) * 3, -26, -42 + Math.sin(t * 5) * 4);
  ctx.stroke();
  // 腿
  legs(ctx, c2, t, -6, 13);
  // 身體
  const g = ctx.createLinearGradient(0, -34, 0, -8);
  g.addColorStop(0, c1);
  g.addColorStop(1, shade(c1, -0.22));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -20, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // 頭
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(16, -33, 12, 0, Math.PI * 2);
  ctx.fill();
  // 吻
  ctx.beginPath();
  ctx.ellipse(26, -30, 6, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // 耳
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(9, -42);
  ctx.lineTo(7, -54);
  ctx.lineTo(18, -45);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -43);
  ctx.lineTo(24, -54);
  ctx.lineTo(28, -43);
  ctx.closePath();
  ctx.fill();
  if (sp.horns) {
    ctx.fillStyle = '#f2ead6';
    ctx.beginPath();
    ctx.moveTo(11, -42);
    ctx.lineTo(4, -56);
    ctx.lineTo(14, -47);
    ctx.closePath();
    ctx.fill();
  }
  beastEyes(ctx, 19, -35, 2);
  // 鼻
  ctx.fillStyle = '#2b2230';
  ctx.beginPath();
  ctx.arc(31, -30, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeastBird(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  const flap = Math.sin(t * 9) * 0.5;
  // 翅膀
  ctx.fillStyle = c2;
  ctx.save();
  ctx.translate(-4, -30);
  ctx.rotate(-flap);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18, -14, -26, 4);
  ctx.quadraticCurveTo(-12, 2, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(6, -30);
  ctx.rotate(flap);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(18, -14, 26, 4);
  ctx.quadraticCurveTo(12, 2, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 身體
  const g = ctx.createLinearGradient(0, -38, 0, -10);
  g.addColorStop(0, c1);
  g.addColorStop(1, shade(c1, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -26, 13, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // 尾羽
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.lineTo(-22, -4);
  ctx.lineTo(-14, -14);
  ctx.lineTo(-24, -12);
  ctx.lineTo(-8, -20);
  ctx.closePath();
  ctx.fill();
  // 頭
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(6, -42, 9, 0, Math.PI * 2);
  ctx.fill();
  // 冠羽
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(2, -50);
  ctx.lineTo(-2, -60);
  ctx.lineTo(8, -52);
  ctx.closePath();
  ctx.fill();
  // 喙
  ctx.fillStyle = '#f0b447';
  ctx.beginPath();
  ctx.moveTo(13, -43);
  ctx.lineTo(24, -40);
  ctx.lineTo(13, -37);
  ctx.closePath();
  ctx.fill();
  beastEyes(ctx, 8, -44, 2);
}

function drawBeastFish(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  const wob = Math.sin(t * 6) * 2;
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(-16, -24);
  ctx.lineTo(-32, -36 + wob);
  ctx.lineTo(-30, -14 + wob);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, -36, 0, -10);
  g.addColorStop(0, c1);
  g.addColorStop(1, shade(c1, -0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -24, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // 背鰭
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(-6, -35);
  ctx.quadraticCurveTo(2, -48, 12, -34);
  ctx.closePath();
  ctx.fill();
  // 胸鰭
  ctx.beginPath();
  ctx.ellipse(4, -16, 7, 3.5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  beastEyes(ctx, 12, -27, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(16, -27, 2, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeastBug(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  ctx.strokeStyle = c2;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = -12 + i * 9;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(bx, -16);
      ctx.lineTo(bx + side * 10, -6 + Math.sin(t * 8 + i) * 1.5);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 0 ? shade(c1, 0.12) : c1;
    ctx.beginPath();
    ctx.ellipse(-10 + i * 10, -24, 11 - i, 12 - i, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 甲紋
  ctx.strokeStyle = shade(c1, -0.35);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-10 + i * 10, -24, 11 - i, 12 - i, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  beastEyes(ctx, -14, -26, 2);
  // 觸角
  ctx.strokeStyle = c2;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-16, -32);
  ctx.lineTo(-26, -44 + Math.sin(t * 5) * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-10, -34);
  ctx.lineTo(-14, -48 + Math.sin(t * 5 + 1) * 2);
  ctx.stroke();
}

function drawBeastDragon(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  const flap = Math.sin(t * 3.5) * 0.55;
  ctx.fillStyle = shade(c2, -0.1);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 8, -40);
    ctx.rotate(s * (0.3 + flap));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 30, -34, s * 46, -6);
    ctx.quadraticCurveTo(s * 24, -6, s * 14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  legs(ctx, c2, t, -8, 14);
  const g = ctx.createLinearGradient(0, -44, 0, -10);
  g.addColorStop(0, c1);
  g.addColorStop(1, shade(c1, -0.28));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -26, 21, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // 尾
  ctx.strokeStyle = c1;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, -24);
  ctx.quadraticCurveTo(-38, -18 + Math.sin(t * 4) * 4, -46, -34);
  ctx.stroke();
  // 頸 + 頭
  ctx.beginPath();
  ctx.moveTo(8, -36);
  ctx.quadraticCurveTo(18, -52, 26, -54);
  ctx.lineWidth = 11;
  ctx.strokeStyle = c1;
  ctx.stroke();
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.ellipse(30, -56, 11, 8.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // 角
  ctx.fillStyle = '#efe6cf';
  ctx.beginPath();
  ctx.moveTo(24, -62);
  ctx.lineTo(16, -76);
  ctx.lineTo(30, -66);
  ctx.closePath();
  ctx.fill();
  beastEyes(ctx, 34, -58, 2, '#ffdc5e');
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-2, -34, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeastHuman(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.moveTo(-10, -34);
  ctx.quadraticCurveTo(-16, -12, -10, 0);
  ctx.lineTo(10, 0);
  ctx.quadraticCurveTo(16, -12, 10, -34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.arc(0, -42, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(c1, -0.35);
  ctx.beginPath();
  ctx.arc(0, -44, 10, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  beastEyes(ctx, 0, -40, 2);
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.ellipse(-14, -24 + Math.sin(t * 3) * 2, 3.6, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(14, -24 - Math.sin(t * 3) * 2, 3.6, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeastBlob(ctx: CanvasRenderingContext2D, sp: SpriteDef, t: number) {
  const { c1, c2 } = sp;
  const sq = 1 + Math.sin(t * 3) * 0.06;
  const g = ctx.createRadialGradient(-6, -32, 4, 0, -22, 26);
  g.addColorStop(0, shade(c1, 0.25));
  g.addColorStop(1, shade(c1, -0.28));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -20 * sq, 22 / sq, 20 * sq, 0, 0, Math.PI * 2);
  ctx.fill();
  // 耳朵
  ctx.fillStyle = c2;
  ctx.beginPath();
  ctx.ellipse(-15, -38, 4, 9, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(15, -38, 4, 9, 0.35, 0, Math.PI * 2);
  ctx.fill();
  beastEyes(ctx, 0, -24, 2);
  // 腮紅
  ctx.fillStyle = 'rgba(255,120,140,0.35)';
  ctx.beginPath();
  ctx.arc(-11, -19, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(11, -19, 3.2, 0, Math.PI * 2);
  ctx.fill();
  // 尾巴
  ctx.strokeStyle = c2;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(16, -12);
  ctx.quadraticCurveTo(28, -14 + Math.sin(t * 5) * 3, 30, -28);
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────────
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
  } else {
    r = Math.round(r * (1 + amt));
    g = Math.round(g * (1 + amt));
    b = Math.round(b * (1 + amt));
  }
  return `rgb(${r},${g},${b})`;
}

/** 圓角對話框，支援逐字顯示 */
export function drawTextBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  panel(ctx, x, y, w, h, {
    fill: 'rgba(8,13,26,0.95)',
    border: 'rgba(150,190,255,0.65)',
    borderWidth: 2,
    radius: 10,
    glow: 'rgba(70,130,255,0.35)'
  });
}

/** 自動換行（支援中英文混排，以字元寬度估算） */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number
): string[] {
  ctx.save();
  ctx.font = font(size);
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur.length) lines.push(cur);
  ctx.restore();
  return lines;
}
