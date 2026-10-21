import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { Options, Shape } from 'canvas-confetti';

type Confetti = { fire: (options: Options) => unknown; shapes: Shape[] };

/** Wine, rose, blush, cream and a little gold, from the brand palette. */
const COLOURS = ['#7a0f3d', '#d86b8a', '#e89cb3', '#f2e7d8', '#f5a623'];
const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.8 4.5 6.6 4.1c2.2-.2 4 .9 5.4 2.8 1.4-1.9 3.2-3 5.4-2.8 3.8.4 5.7 4.3 4.2 7.7C19.5 16.4 12 21 12 21z';

/**
 * Confetti for the moments worth celebrating: an order sent, a review posted.
 * canvas-confetti loads on first use, so it costs nothing until then, and it
 * stays still for visitors who ask for reduced motion.
 */
@Injectable({ providedIn: 'root' })
export class CelebrateService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private lib?: Promise<Confetti | null>;

  /** Two bursts from the lower corners, then a shower: for a placed order. */
  async big(): Promise<void> {
    const c = await this.load();
    if (!c) return;
    const base: Options = { colors: COLOURS, shapes: c.shapes, disableForReducedMotion: true, ticks: 260, zIndex: 120 };
    c.fire({ ...base, particleCount: 80, angle: 60, spread: 70, startVelocity: 58, origin: { x: 0, y: 0.9 } });
    c.fire({ ...base, particleCount: 80, angle: 120, spread: 70, startVelocity: 58, origin: { x: 1, y: 0.9 } });
    setTimeout(() => c.fire({ ...base, particleCount: 110, spread: 120, startVelocity: 30, origin: { x: 0.5, y: 0.35 }, scalar: 0.9 }), 280);
  }

  /** One small puff, from a point on screen (0–1 each way) or the middle: for a thank-you. */
  async small(origin: { x: number; y: number } = { x: 0.5, y: 0.6 }): Promise<void> {
    const c = await this.load();
    if (!c) return;
    c.fire({ colors: COLOURS, shapes: c.shapes, disableForReducedMotion: true, zIndex: 120, particleCount: 45, spread: 70, startVelocity: 30, ticks: 180, scalar: 0.85, origin });
  }

  private load(): Promise<Confetti | null> {
    if (!this.browser) return Promise.resolve(null);
    return (this.lib ??= import('canvas-confetti')
      .then(({ default: confetti }): Confetti => {
        const shapes: Shape[] = ['circle', 'square', confetti.shapeFromPath({ path: HEART })];
        return { fire: confetti, shapes };
      })
      .catch(() => null));
  }
}
