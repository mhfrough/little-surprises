import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';

/** Feedback lives in the interface: one floating line, gone on its own. */
@Component({
  selector: 'app-toast',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (bag.toast(); as t) {
        <div class="toast" [attr.data-id]="t.id">
          <lucide-icon [img]="I.CircleCheck" [size]="20" [strokeWidth]="2" />
          <span>{{ t.text }}</span>
          @if (!inAdmin()) {
            <a routerLink="/cart" class="btn btn-plain btn-sm">View bag</a>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .region { position: fixed; left: 50%; bottom: 24px; z-index: 80; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px); }
    .toast {
      display: flex; align-items: center; gap: 12px; padding: 8px 18px; border-radius: var(--radius-pill);
      background: var(--ink); color: var(--ground); box-shadow: var(--shadow-float); font-size: 0.9375rem; font-weight: 520;
      animation: rise var(--dur) var(--ease-spring);
    }
    lucide-icon { color: #9ccf8f; flex: none; }
    .toast:has(a) { padding-right: 8px; }
    .btn-plain { color: var(--ground); text-decoration: underline; text-underline-offset: 3px; }
    @keyframes rise { from { opacity: 0; transform: translateY(16px) scale(0.96); } }
  `,
})
export class Toast {
  protected readonly I = I;
  protected readonly bag = inject(BagStore);
  private readonly router = inject(Router);
  /** The operator portal reuses the toast, but has no bag to point at. */
  protected readonly inAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/admin')),
    ),
    { initialValue: inject(PlatformLocation).pathname.startsWith('/admin') },
  );
}
