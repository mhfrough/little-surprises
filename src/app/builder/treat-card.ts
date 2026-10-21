import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../core/models';
import { BuilderStore } from '../core/stores';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';
import { QtyStepper } from '../shared/qty-stepper';

/** A treat in the builder: Add, then a stepper once it is in the basket. */
@Component({
  selector: 'app-treat-card',
  imports: [LucideAngularModule, MoneyPipe, QtyStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-in]': 'qty() > 0' },
  template: `
    @let p = product();
    <div class="media">
      <img [src]="p.images[0]" [alt]="p.name" width="640" height="640" loading="lazy" />
      @if (qty() > 0) {
        <span class="count t-num" aria-hidden="true">{{ qty() }}</span>
      }
    </div>
    <h4 class="name clamp-2" [title]="p.name">{{ p.name }}</h4>
    <div class="foot">
      <span class="price t-num">{{ p.price | money }}</span>
      @if (!p.inStock) {
        <span class="out">Sold out</span>
      } @else if (qty() === 0) {
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="store.isFull()"
          (click)="store.setQty(p, 1)" [attr.aria-label]="'Add ' + p.name + ' to basket'">
          <lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2.2" /> Add
        </button>
      } @else {
        <app-qty-stepper [value]="qty()" (valueChange)="store.setQty(p, $event)" [min]="0"
          [max]="qty() + (store.isFull() ? 0 : 99)" [label]="p.name" />
      }
    </div>
  `,
  styles: `
    :host { display: grid; gap: 8px; align-content: start; min-width: 0; }
    .media {
      position: relative; aspect-ratio: 1; border-radius: var(--radius); overflow: hidden; background: var(--surface-2);
      box-shadow: inset 0 0 0 0 var(--accent); transition: box-shadow var(--dur) var(--ease-out);
    }
    img { width: 100%; height: 100%; object-fit: cover; }
    :host(.is-in) .media::after { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 3px var(--accent); }
    .count {
      position: absolute; top: 10px; right: 10px; min-width: 28px; height: 28px; padding: 0 8px; border-radius: var(--radius-pill);
      display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); font-size: var(--text-small); font-weight: 650;
      animation: pop var(--dur) var(--ease-spring);
    }
    @keyframes pop { from { transform: scale(0.4); } }
    .name { font-size: var(--text-small); font-weight: 600; line-height: 1.3; min-height: 2.6em; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: var(--control-sm); }
    .price { font-weight: 620; font-size: var(--text-small); }
    .out { font-size: var(--text-small); color: var(--ink-3); }
  `,
})
export class TreatCard {
  protected readonly I = I;
  protected readonly store = inject(BuilderStore);
  readonly product = input.required<Product>();
  protected readonly qty = computed(() => this.store.qty(this.product().id));
}
