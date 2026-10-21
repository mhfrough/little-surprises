import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BuilderStore } from '../core/stores';
import { GiftTag } from '../shared/gift-tag';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

/** The basket as it is being built: a live picture, what's in it, the total. */
@Component({
  selector: 'app-basket-summary',
  imports: [LucideAngularModule, MoneyPipe, GiftTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 class="t-headline">Your basket</h2>

    <div class="preview" [style.--wrap]="s.wrap().colour" [style.--ribbon]="s.ribbon().hex">
      <img [src]="s.base().image" [alt]="s.base().name" width="500" height="375" />
      <span class="band" aria-hidden="true"></span>
      <svg class="bow" viewBox="0 0 64 40" aria-hidden="true">
        <path d="M32 20C22 8 6 4 6 14S22 26 32 20ZM32 20C42 8 58 4 58 14S42 26 32 20Z" />
        <path d="M30 22l-8 16M34 22l8 16" stroke-width="5" stroke-linecap="round" />
        <circle cx="32" cy="20" r="5" />
      </svg>
    </div>
    <app-gift-tag class="tag" [to]="s.to()" [from]="s.from()" [note]="s.note()" [ribbon]="s.ribbon().hex" placeholder="Your note will be written here." />

    <dl class="lines">
      <div><dt>{{ s.base().name }}</dt><dd class="t-num">{{ s.base().price | money }}</dd></div>
      <div><dt>{{ s.wrap().name }} wrap</dt><dd class="t-num">{{ s.wrap().price ? (s.wrap().price | money) : 'Included' }}</dd></div>
      <div><dt>{{ s.ribbon().name }} ribbon</dt><dd>Included</dd></div>
      @for (l of s.lines(); track l.product.id) {
        <div class="treat"><dt class="clamp-1" [title]="l.product.name">{{ l.product.name }} <span class="t-note">× {{ l.quantity }}</span></dt><dd class="t-num">{{ l.product.price * l.quantity | money }}</dd></div>
      }
    </dl>

    <div class="fill">
      <div class="fill-row t-small">
        <span>{{ s.itemCount() }} of {{ s.base().capacity }} treats</span>
        <span class="t-note">{{ s.isFull() ? 'Full' : (s.base().capacity - s.itemCount()) + ' spaces left' }}</span>
      </div>
      <div class="meter" role="progressbar" [attr.aria-valuenow]="s.itemCount()" aria-valuemin="0"
        [attr.aria-valuemax]="s.base().capacity" aria-label="Basket filled">
        <span [style.width.%]="fillPct()"></span>
      </div>
    </div>

    <div class="total">
      <span>Total</span>
      <span class="t-num">{{ s.total() | money }}</span>
    </div>

    @if (showCta()) {
      <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="s.itemCount() === 0" (click)="checkout.emit()">
        <lucide-icon [img]="I.ShoppingBag" [size]="20" [strokeWidth]="2" /> Add basket to bag
      </button>
      @if (s.itemCount() === 0) {
        <p class="hint t-small t-note">Add at least one treat to continue.</p>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 18px;
      padding: 24px;
      border-radius: var(--radius-lg);
      background: var(--surface);
    }
    .preview {
      position: relative;
      padding: 18px;
      border-radius: var(--radius);
      background: var(--wrap);
      transition: background-color var(--dur-slow) var(--ease-out);
    }
    .preview img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; }
    .band {
      position: absolute; left: 0; right: 0; bottom: 26%; height: 14px; background: var(--ribbon);
      transition: background-color var(--dur-slow) var(--ease-out);
    }
    .bow {
      position: absolute; left: 50%; bottom: calc(26% - 30px); width: 104px; margin-left: -52px;
      fill: var(--ribbon); stroke: var(--ribbon); transition: fill var(--dur-slow), stroke var(--dur-slow);
      filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.25));
    }
    .tag { margin: -46px 0 0 -6px; position: relative; z-index: 2; }
    .lines { display: grid; gap: 8px; margin: 0; font-size: var(--text-small); }
    .lines div { display: flex; justify-content: space-between; gap: 12px; min-width: 0; }
    .lines dt { min-width: 0; }
    .lines dd { flex: none; }
    .lines dt { color: var(--ink-2); }
    .lines dd { margin: 0; font-weight: 560; }
    .treat { animation: in var(--dur) var(--ease-out); }
    @keyframes in { from { opacity: 0; transform: translateY(-6px); } }
    .fill { display: grid; gap: 8px; }
    .fill-row { display: flex; justify-content: space-between; }
    .total { display: flex; justify-content: space-between; font-size: var(--text-headline); font-weight: 650; letter-spacing: -0.015em; padding-top: 4px; }
    .hint { text-align: center; margin-top: -8px; }
  `,
})
export class BasketSummary {
  protected readonly I = I;
  protected readonly s = inject(BuilderStore);
  readonly checkout = output<void>();
  readonly showCta = input(true);
  protected readonly fillPct = computed(() => Math.min(100, (this.s.itemCount() / this.s.base().capacity) * 100));
}
