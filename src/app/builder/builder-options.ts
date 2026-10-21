import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BuilderStore } from '../core/stores';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

/** Choose a basket — native radios, so arrow keys work for free. */
@Component({
  selector: 'app-base-options',
  imports: [LucideAngularModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid" role="radiogroup" aria-label="Basket">
      @for (b of store.bases; track b.id) {
        <label class="opt">
          <input class="visually-hidden" type="radio" name="base" [value]="b.id"
            [checked]="store.baseId() === b.id" (change)="store.baseId.set(b.id)" />
          <span class="media"><img [src]="b.image" alt="" width="500" height="375" loading="lazy" /></span>
          <span class="tick" aria-hidden="true"><lucide-icon [img]="I.Check" [size]="14" [strokeWidth]="3" /></span>
          <span class="name">{{ b.name }}</span>
          <span class="meta">Holds up to {{ b.capacity }} treats</span>
          <span class="price t-num">{{ b.price | money }}</span>
        </label>
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .opt {
      position: relative;
      display: grid;
      gap: 2px;
      padding: 10px 10px 16px;
      border-radius: var(--radius);
      background: var(--surface);
      cursor: pointer;
      box-shadow: inset 0 0 0 2px transparent;
      transition: box-shadow var(--dur) var(--ease-out), background-color var(--dur) var(--ease-out);
    }
    .opt:hover { background: var(--surface-2); }
    .opt:has(input:checked) { box-shadow: inset 0 0 0 2px var(--accent); background: var(--ground); }
    .opt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 3px; }
    .media { display: block; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; margin-bottom: 10px; background: var(--surface-2); }
    img { width: 100%; height: 100%; object-fit: cover; }
    .tick {
      position: absolute; top: 18px; right: 18px; width: 26px; height: 26px; border-radius: 50%;
      display: grid; place-items: center; background: var(--accent); color: var(--accent-ink);
      transform: scale(0); transition: transform var(--dur) var(--ease-spring);
    }
    .opt:has(input:checked) .tick { transform: scale(1); }
    .name { font-weight: 600; letter-spacing: -0.01em; padding-inline: 6px; }
    .meta { font-size: var(--text-small); color: var(--ink-2); padding-inline: 6px; }
    .price { font-weight: 620; padding-inline: 6px; margin-top: 4px; }
    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
      .opt { grid-template-columns: 96px 1fr; column-gap: 14px; padding: 10px; align-items: center; }
      .media { grid-row: span 3; margin: 0; aspect-ratio: 1; }
      .name, .meta, .price { padding: 0; margin: 0; }
      .tick { top: auto; bottom: 14px; }
    }
  `,
})
export class BaseOptions {
  protected readonly I = I;
  protected readonly store = inject(BuilderStore);
}

/** Wrap it — flat colour swatches with their price. */
@Component({
  selector: 'app-wrap-options',
  imports: [MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid" role="radiogroup" aria-label="Wrapping">
      @for (w of store.wraps; track w.id) {
        <label class="opt">
          <input class="visually-hidden" type="radio" name="wrap" [value]="w.id"
            [checked]="store.wrapId() === w.id" (change)="store.wrapId.set(w.id)" />
          <span class="swatch" [style.background]="w.colour"></span>
          <span class="name">{{ w.name }}</span>
          <span class="meta t-num">{{ w.price ? '+ ' + (w.price | money) : 'Included' }}</span>
        </label>
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .opt {
      display: grid; gap: 2px; padding: 8px 8px 14px; border-radius: var(--radius); background: var(--surface);
      cursor: pointer; box-shadow: inset 0 0 0 2px transparent;
      transition: box-shadow var(--dur) var(--ease-out), background-color var(--dur) var(--ease-out);
    }
    .opt:hover { background: var(--surface-2); }
    .opt:has(input:checked) { box-shadow: inset 0 0 0 2px var(--accent); background: var(--ground); }
    .opt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 3px; }
    .swatch { display: block; height: 64px; border-radius: 12px; margin-bottom: 8px; }
    .name { font-weight: 600; font-size: var(--text-small); padding-inline: 4px; }
    .meta { font-size: var(--text-small); color: var(--ink-2); padding-inline: 4px; }
    @media (max-width: 640px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  `,
})
export class WrapOptions {
  protected readonly store = inject(BuilderStore);
}

/** Tie a ribbon — round swatches, name read back beside them. */
@Component({
  selector: 'app-ribbon-picker',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="row" role="radiogroup" aria-label="Ribbon colour">
      @for (r of store.ribbons; track r.id) {
        <label class="sw" [style.--c]="r.hex" [title]="r.name">
          <input class="visually-hidden" type="radio" name="ribbon" [value]="r.id"
            [checked]="store.ribbonId() === r.id" (change)="store.ribbonId.set(r.id)" />
          <span class="visually-hidden">{{ r.name }}</span>
        </label>
      }
      <span class="name" aria-hidden="true">{{ store.ribbon().name }}</span>
    </div>
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .sw {
      width: 44px; height: 44px; border-radius: 50%; background: var(--c); cursor: pointer;
      box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08), 0 0 0 0 var(--ground), 0 0 0 0 var(--c);
      transition: box-shadow var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-spring);
    }
    .sw:hover { transform: scale(1.06); }
    .sw:has(input:checked) { box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08), 0 0 0 3px var(--ground), 0 0 0 5px var(--c); }
    .sw:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 6px; }
    .name { font-weight: 600; margin-left: 8px; }
  `,
})
export class RibbonPicker {
  protected readonly store = inject(BuilderStore);
}
