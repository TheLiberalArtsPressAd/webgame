// 鍵盤與滑鼠輸入
const held: Record<string, boolean> = {};
const pressed: Record<string, boolean> = {};
const navTimers: Record<string, number> = {};

let pointerX = 0;
let pointerY = 0;
let pointerDown = false;
let pointerClicked = false;

function norm(k: string): string {
  if (k === ' ') return 'space';
  if (k === 'Enter') return 'enter';
  if (k === 'Escape') return 'escape';
  if (k === 'Shift') return 'shift';
  if (k.length === 1) return k.toLowerCase();
  return k.toLowerCase();
}

export function setupInput(canvas: HTMLCanvasElement) {
  window.addEventListener('keydown', (e) => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)
    ) {
      e.preventDefault();
    }
    const k = norm(e.key);
    if (!held[k]) pressed[k] = true;
    held[k] = true;
  });

  window.addEventListener('keyup', (e) => {
    held[norm(e.key)] = false;
  });

  window.addEventListener('blur', () => {
    for (const k in held) held[k] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / r.width) * 960;
    pointerY = ((e.clientY - r.top) / r.height) * 600;
  });

  canvas.addEventListener('mousedown', () => {
    pointerDown = true;
  });

  canvas.addEventListener('mouseup', (e) => {
    const r = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / r.width) * 960;
    pointerY = ((e.clientY - r.top) / r.height) * 600;
    pointerDown = false;
    pointerClicked = true;
  });
}

export function isDown(...keys: string[]): boolean {
  return keys.some((k) => held[k]);
}

/** 只回報「剛按下」一次 */
export function consume(...keys: string[]): boolean {
  for (const k of keys) {
    if (pressed[k]) {
      pressed[k] = false;
      return true;
    }
  }
  return false;
}

/** 用於選單導航：剛按下立即觸發，長按後自動重複 */
export function nav(key: string, dt: number): boolean {
  if (!held[key]) {
    navTimers[key] = 0;
    return false;
  }
  if (pressed[key]) {
    pressed[key] = false;
    navTimers[key] = -0.35;
    return true;
  }
  navTimers[key] = (navTimers[key] ?? 0) + dt;
  if (navTimers[key] >= 0.075) {
    navTimers[key] = 0;
    return true;
  }
  return false;
}

/** 每格方向輸入（-1 / 0 / 1） */
export function axis(): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (isDown('arrowleft', 'a')) x -= 1;
  if (isDown('arrowright', 'd')) x += 1;
  if (isDown('arrowup', 'w')) y -= 1;
  if (isDown('arrowdown', 's')) y += 1;
  return { x, y };
}

export function clearPressed() {
  for (const k in pressed) pressed[k] = false;
  pointerClicked = false;
}

export function pointer(): { x: number; y: number; down: boolean } {
  return { x: pointerX, y: pointerY, down: pointerDown };
}

export function consumeClick(): { x: number; y: number } | null {
  if (!pointerClicked) return null;
  pointerClicked = false;
  return { x: pointerX, y: pointerY };
}
