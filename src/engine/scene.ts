// 場景堆疊管理
export interface Scene {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  /** 回傳 true 表示攔截事件，不傳給下層 */
  key?(key: string): boolean;
}

export const VIEW_W = 960;
export const VIEW_H = 600;

class SceneManager {
  private stack: Scene[] = [];

  get top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  /** 直接用新場景取代整個堆疊 */
  set(s: Scene) {
    while (this.stack.length) this.stack.pop()?.exit?.();
    this.stack.push(s);
    s.enter?.();
  }

  push(s: Scene) {
    this.stack.push(s);
    s.enter?.();
  }

  pop() {
    this.stack.pop()?.exit?.();
    this.top?.enter?.();
  }

  /** 用新場景取代最上層 */
  replace(s: Scene) {
    this.stack.pop()?.exit?.();
    this.stack.push(s);
    s.enter?.();
  }

  update(dt: number) {
    this.top?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D) {
    this.top?.render(ctx);
  }
}

export const scenes = new SceneManager();
