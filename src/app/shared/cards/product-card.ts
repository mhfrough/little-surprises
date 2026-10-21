import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, model, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../core/catalog.service';
import { Product } from '../../core/models';
import { I } from '../icons';
import { catalogSrcset } from '../thumb';
import { MoneyPipe } from '../money.pipe';
import { Rating } from '../rating';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, LucideAngularModule, MoneyPipe, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    <article class="card" [class.is-out]="!p.inStock">
      <div class="media">
        <a [routerLink]="['/product', p.slug]" tabindex="-1" aria-hidden="true" class="img-link"><img [src]="p.images[0]" [attr.srcset]="srcset(p.images[0])" sizes="auto, (max-width: 560px) 50vw, 320px" alt="" loading="lazy" width="640" height="640" /></a>
        @if (!p.inStock) {
          <span class="status is-muted">Sold out</span>
        } @else if (p.compareAtPrice) {
          <span class="status is-sale">Save {{ p.compareAtPrice - p.price | money }}</span>
        }
        <button type="button" class="wish" [attr.aria-pressed]="wished()"
          [attr.aria-label]="(wished() ? 'Remove ' : 'Save ') + p.name + (wished() ? ' from' : ' to') + ' wishlist'"
          (click)="wished.set(!wished())">
          <lucide-icon [img]="I.Heart" [size]="18" [strokeWidth]="2" />
        </button>
      </div>
      <div class="body">
        <p class="cat clamp-1">{{ meta() }}</p>
        <h3 class="name" [title]="p.name"><a [routerLink]="['/product', p.slug]">{{ p.name }}</a></h3>
        @if (p.reviewCount) {
          <app-rating [value]="p.rating ?? 0" [count]="p.reviewCount" [size]="13" />
        } @else {
          <span class="no-reviews">No reviews yet</span>
        }
        <div class="foot">
          <span class="price">
            {{ p.price | money }}
            @if (p.compareAtPrice) {
              <s><span class="visually-hidden">was </span>{{ p.compareAtPrice | money }}</s>
            }
          </span>
          @if (p.inStock) {
            <button type="button" class="btn btn-icon btn-primary btn-sm add" [class.is-added]="added()"
              [attr.aria-label]="'Add ' + p.name + ' to bag'" (click)="onAdd(p)">
              @if (added()) {
                <!-- the plus turns into a tick that draws itself in -->
                <svg class="motion-draw" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                  stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" /></svg>
              } @else {
                <lucide-icon [img]="I.Plus" [size]="18" [strokeWidth]="2.2" />
              }
            </button>
          } @else {
            <button type="button" class="btn btn-plain btn-sm">Notify me</button>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .card { display: grid; gap: 14px; }
    .media { transition: transform var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out); }
    .media {
      position: relative;
      aspect-ratio: 1;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--surface-2);
    }
    .img-link { display: block; width: 100%; height: 100%; }
    .name a:hover { text-decoration: underline; text-underline-offset: 3px; }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--dur-slow) var(--ease-out);
    }
    .card:hover img { transform: scale(1.08) rotate(2deg); }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) {
      .card:hover .media { transform: translateY(-4px); box-shadow: 0 16px 30px -18px rgb(31 20 24 / 0.45); }
      .add:not(.is-added):hover lucide-icon { transform: rotate(90deg) scale(1.12); }
    }
    .add.is-added { background: var(--positive); }
    /* saving to the wishlist: the heart pops and a ring spreads from it */
    .wish { overflow: visible; }
    .wish::after {
      content: ''; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--rose); opacity: 0; pointer-events: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      .wish[aria-pressed='true'] lucide-icon { animation: motion-pop 420ms var(--ease-spring); }
      .wish[aria-pressed='true']::after { animation: motion-ring 560ms var(--ease-out); }
    }
    .is-out img { filter: grayscale(0.85); opacity: 0.7; }
    .status { position: absolute; left: 12px; top: 12px; }
    .wish {
      position: absolute;
      right: 10px;
      top: 10px;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--ground);
      color: var(--ink);
      transition: transform var(--dur-fast) var(--ease-spring), color var(--dur-fast);
    }
    .wish:hover { transform: scale(1.08); }
    .wish:active { transform: scale(0.92); }
    .wish[aria-pressed='true'] { color: var(--rose); }
    .wish[aria-pressed='true'] ::ng-deep svg { fill: currentColor; }
    .body { display: grid; gap: 4px; padding-inline: 2px; }
    .cat { font-size: var(--text-small); color: var(--ink-3); }
    .name {
      font-size: var(--text-body); font-weight: 600; letter-spacing: -0.01em; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.6em;
    }
    .no-reviews { font-size: 0.8125rem; color: var(--ink-3); min-height: 19px; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; min-height: var(--control-sm); }
    .price { min-width: 0; flex-wrap: wrap; }
  `,
})
export class ProductCard {
  protected readonly I = I;
  protected readonly srcset = catalogSrcset;
  private readonly catalog = inject(CatalogService);
  readonly product = input.required<Product>();
  readonly wished = model(false);
  readonly add = output<Product>();
  /** true for a moment after adding, while the button shows a tick */
  protected readonly added = signal(false);
  private addedTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.addedTimer));
  }

  protected onAdd(p: Product): void {
    this.add.emit(p);
    this.added.set(true);
    clearTimeout(this.addedTimer);
    this.addedTimer = setTimeout(() => this.added.set(false), 1400);
  }

  protected readonly meta = computed(() => {
    const p = this.product();
    return [p.brand, this.catalog.categoryName(p.categoryId)].filter(Boolean).join(' · ');
  });
}
