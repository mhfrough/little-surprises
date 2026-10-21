import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { I } from '../shared/icons';

const STORAGE_KEY = 'gw-cookie-consent';

/**
 * Cookie notice, bottom-left (the WhatsApp bubble owns bottom-right), ported
 * from the Bloomstone site. Remembers the choice: "all" or "essential".
 */
@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <section class="cookie" role="dialog" aria-live="polite" aria-labelledby="cookie-title">
        <span class="icon" aria-hidden="true"><lucide-icon [img]="I.Cookie" [size]="28" [strokeWidth]="1.7" /></span>
        <div class="text">
          <h2 id="cookie-title">We use cookies</h2>
          <p>We use them to remember your bag and delivery city, and to understand which gifts people like. You choose — read our
            <a routerLink="/policies/privacy">privacy policy</a>.</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" (click)="choose('all')">Accept all</button>
          <button type="button" class="btn btn-secondary" (click)="choose('essential')">Essential only</button>
        </div>
      </section>
    }
  `,
  styles: `
    .cookie {
      position: fixed; left: 24px; bottom: 24px; z-index: 68;
      width: min(480px, calc(100vw - 112px));
      display: grid; grid-template-columns: auto 1fr; gap: 18px 18px;
      padding: 26px 28px; border-radius: var(--radius); background: var(--ground); color: var(--ink);
      box-shadow: var(--shadow-float);
      animation: rise 420ms var(--ease-spring);
    }
    @keyframes rise { from { opacity: 0; transform: translateY(24px); } }
    .icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: var(--field); color: var(--accent); }
    .text { display: grid; gap: 6px; }
    h2 { font-size: var(--text-headline); font-weight: 650; letter-spacing: -0.014em; }
    p { font-size: 0.9375rem; color: var(--ink-2); line-height: 1.55; }
    a { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
    .actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 10px; }
    .actions .btn { flex: 1 1 140px; min-width: 0; }
    @media (max-width: 480px) {
      .cookie { left: 12px; right: 12px; bottom: 88px; width: auto; padding: 20px; gap: 14px; }
      .icon { width: 48px; height: 48px; }
    }
  `,
})
export class CookieConsent implements OnInit, OnDestroy {
  protected readonly I = I;
  protected readonly visible = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* storage blocked — ask, but the answer won't be kept */
    }
    this.timer = setTimeout(() => this.visible.set(true), 4000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  choose(choice: 'all' | 'essential'): void {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* storage blocked */
    }
    this.visible.set(false);
  }
}
