import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from './icons';

/** Stars that fill to the exact average (4.3 fills 4 and a third), then the number and count. */
@Component({
  selector: 'app-rating',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  template: `
    <span class="stars" aria-hidden="true">
      <span class="row empty">
        @for (n of five; track n) { <lucide-icon [img]="I.Star" [size]="size()" [strokeWidth]="0" /> }
      </span>
      <span class="row full" [style.width.%]="(value() / 5) * 100">
        @for (n of five; track n) { <lucide-icon [img]="I.Star" [size]="size()" [strokeWidth]="0" /> }
      </span>
    </span>
    @if (showValue()) {
      <span class="value t-num">{{ value().toFixed(1) }}</span>
    }
    @if (count() !== null) {
      <span class="count t-num">({{ count() }})</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-small); }
    .stars { position: relative; display: inline-block; line-height: 0; }
    .row { display: inline-flex; gap: 1px; white-space: nowrap; }
    .full { position: absolute; inset: 0 auto 0 0; overflow: hidden; }
    .empty { color: var(--surface-3); }
    .full { color: #f5a623; }
    :host ::ng-deep svg { fill: currentColor; flex: none; }
    .value { font-weight: 620; }
    .count { color: var(--ink-3); }
  `,
})
export class Rating {
  protected readonly I = I;
  protected readonly five = [1, 2, 3, 4, 5];
  readonly value = input.required<number>();
  readonly count = input<number | null>(null);
  readonly size = input(14);
  readonly showValue = input(true);

  protected readonly label = computed(
    () => `Rated ${this.value().toFixed(1)} out of 5` + (this.count() !== null ? `, ${this.count()} reviews` : ''),
  );
}
