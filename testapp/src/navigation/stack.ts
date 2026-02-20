import type { Screen } from "./screen";

export class ScreenStack {
  private readonly stack: Screen[] = [];
  private renderer: ((screen: Screen) => void | Promise<void>) | null = null;

  setRenderer(renderer: (screen: Screen) => void | Promise<void>): void {
    this.renderer = renderer;
  }

  push(screen: Screen): void {
    const current = this.current();
    if (current) {
      current.onExit();
    }
    this.stack.push(screen);
    screen.onEnter();
    this.render();
  }

  pop(): void {
    if (this.stack.length <= 1) {
      return;
    }
    const current = this.stack.pop();
    current?.onExit();
    const next = this.current();
    if (next) {
      next.onEnter();
    }
    this.render();
  }

  current(): Screen | undefined {
    return this.stack[this.stack.length - 1];
  }

  render(): void {
    const current = this.current();
    if (current && this.renderer) {
      Promise.resolve(this.renderer(current)).catch((error) => {
        console.error("[render] failed", error);
      });
    }
  }
}
