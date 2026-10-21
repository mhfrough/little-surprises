import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from './icons';

/** Previous / numbered pages / next, with gaps ("…") when there are many. */
@Component({
  selector: 'app-pagination',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pages() > 1) {
      <nav [attr.aria-label]="label()">
        <button type="button" class="pg nav" (click)="go(page() - 1)" [disabled]="page() === 1" aria-label="Previous page">
          <lucide-icon [img]="I.ChevronLeft" [size]="18" [strokeWidth]="2" /><span class="hide-sm">Previous</span>
        </button>
        <ol role="list">
          @for (n of numbers(); track $index) {
            <li>
              @if (n === 0) {
                <span class="gap" aria-hidden="true">…</span>
              } @else {
                <button type="button" class="pg" [attr.aria-current]="n === page() ? 'page' : null" (click)="go(n)"
                  [attr.aria-label]="'Page ' + n">{{ n }}</button>
              }
            </li>
          }
        </ol>
        <button type="button" class="pg nav" (click)="go(page() + 1)" [disabled]="page() === pages()" aria-label="Next page">
          <span class="hide-sm">Next</span><lucide-icon [img]="I.ChevronRight" [size]="18" [strokeWidth]="2" />
        </button>
      </nav>
      <p class="range t-small t-muted" aria-live="polite">Showing {{ from() }}–{{ to() }} of {{ total() }}</p>
    }
  `,
  styles: `
    :host { display: grid; justify-items: center; gap: 10px; }
    nav { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
    ol { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
    .pg {
      min-width: 40px; height: 40px; padding: 0 12px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      background: var(--surface-2); color: var(--ink); font-weight: 600; font-size: var(--text-small); font-variant-numeric: tabular-nums;
      transition: background-color var(--dur-fast);
    }
    .pg:hover:not(:disabled) { background: var(--surface-3); }
    .pg[aria-current='page'] { background: var(--accent); color: var(--accent-ink); }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .gap { display: inline-grid; place-items: center; width: 28px; height: 40px; color: var(--ink-3); }
    @media (max-width: 480px) { .hide-sm { display: none; } .nav { padding: 0; width: 40px; } }
  `,
})
export class Pagination {
  protected readonly I = I;
  readonly page = model(1);
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly label = input('Pages');

  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min(this.total(), this.page() * this.pageSize()));

  /** 1 … 4 5 6 … 20 (0 marks a gap) */
  protected readonly numbers = computed(() => {
    const n = this.pages();
    const p = this.page();
    if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);
    const set = new Set([1, n, p - 1, p, p + 1].filter((x) => x >= 1 && x <= n));
    const sorted = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    sorted.forEach((x, i) => {
      if (i && x - sorted[i - 1] > 1) out.push(0);
      out.push(x);
    });
    return out;
  });

  go(n: number): void {
    if (n >= 1 && n <= this.pages()) this.page.set(n);
  }
}
