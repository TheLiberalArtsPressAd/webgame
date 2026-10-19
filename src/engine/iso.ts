// 等角座標（isometric）轉換與繪製順序工具
export const TILE_W = 64;
export const TILE_H = 32;

export interface Cam {
  x: number;
  y: number;
}

/** 世界座標（浮點格子座標）轉螢幕像素 */
export function worldToScreen(wx: number, wy: number, cam: Cam) {
  return {
    sx: (wx - wy) * (TILE_W / 2) - cam.x,
    sy: (wx + wy) * (TILE_H / 2) - cam.y
  };
}

/** 螢幕像素轉世界座標 */
export function screenToWorld(sx: number, sy: number, cam: Cam) {
  const x = sx + cam.x;
  const y = sy + cam.y;
  return {
    wx: (y / (TILE_H / 2) + x / (TILE_W / 2)) / 2,
    wy: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2
  };
}

/** 深度排序值：越大越晚畫（越靠前） */
export function depthOf(wx: number, wy: number) {
  return wx + wy;
}

/** 取得鏡頭左上角，使世界座標 (wx,wy) 位於畫面中心 */
export function cameraFor(wx: number, wy: number, viewW: number, viewH: number): Cam {
  return {
    x: (wx - wy) * (TILE_W / 2) - viewW / 2,
    y: (wx + wy) * (TILE_H / 2) - viewH / 2
  };
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
