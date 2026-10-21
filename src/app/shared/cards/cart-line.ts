import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { MoneyPipe } from '../money.pipe';
import { QtyStepper } from '../qty-stepper';
import { catalogSrcset } from '../thumb';

/** One row of the bag. `meta` lists what a custom basket is made of. */
@Component({
  selector: 'app-cart-line',
  imports: [MoneyPipe, QtyStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img [src]="image()" [attr.srcset]="srcset(image())" sizes="auto, 88px" alt="" width="88" height="88" loading="lazy" />
    <div class="info">
      <h3 class="clamp-2" [title]="name()">{{ name() }}</h3>
      @if (meta()) {
        <p class="meta clamp-2">{{ meta() }}</p>
      }
      <div class="controls">
        <app-qty-stepper [(value)]="quantity" [min]="1" [label]="name()" />
        <button type="button" class="btn btn-plain btn-sm" (click)="remove.emit()">Remove</button>
      </div>
    </div>
    <span class="price t-num">{{ unitPrice() * quantity() | money }}</span>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: 88px 1fr auto;
      gap: 18px;
      align-items: start;
      padding: 16px;
      border-radius: var(--radius);
      background: var(--surface);
    }
    img { width: 88px; height: 88px; border-radius: 14px; object-fit: cover; }
    .info { display: grid; gap: 4px; min-width: 0; }
    h3 { font-size: var(--text-body); font-weight: 600; letter-spacing: -0.01em; }
    .meta { font-size: var(--text-small); color: var(--ink-2); }
    .controls { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .price { font-weight: 620; }
    @media (max-width: 480px) {
      :host { grid-template-columns: 64px 1fr; column-gap: 14px; row-gap: 6px; }
      img { width: 64px; height: 64px; grid-row: span 2; }
      .info { grid-column: 2; grid-row: 1; }
      .price { grid-column: 2; grid-row: 2; }
    }
  `,
})
export class CartLine {
  protected readonly srcset = catalogSrcset;
  readonly name = input.required<string>();
  readonly image = input.required<string>();
  readonly meta = input('');
  readonly unitPrice = input.required<number>();
  readonly quantity = model(1);
  readonly remove = output<void>();
}
