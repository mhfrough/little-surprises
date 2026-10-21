import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../core/catalog.service';
import { Product } from '../../core/models';
import { I } from '../icons';
import { catalogSrcset } from '../thumb';
import { MoneyPipe } from '../money.pipe';

/** A ready-made hamper: gift it as is, or open it in the builder. */
@Component({
  selector: 'app-ready-basket-card',
  imports: [RouterLink, LucideAngularModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-reversed]': 'reversed()' },
  template: `
    @let b = basket();
    <article class="card">
      <div class="media" data-reveal>
        <a [routerLink]="['/product', b.slug]" tabindex="-1" aria-hidden="true"><img [src]="b.images[0]" [attr.srcset]="srcset(b.images[0])" sizes="auto, (max-width: 560px) 100vw, 400px" alt="" loading="lazy" width="640" height="640" /></a>
      </div>
      <div class="body" data-reveal>
        <p class="occasion">{{ b.brand ? b.brand + ' · ' : '' }}{{ catalog.categoryName(b.categoryId) }}</p>
        <h3 class="t-title clamp-3"><a [routerLink]="['/product', b.slug]">{{ b.name }}</a></h3>
        @if (b.description) {
          <p class="desc clamp-3">{{ b.description }}</p>
        }
        <p class="deliver t-small">
          <lucide-icon [img]="I.Truck" [size]="16" [strokeWidth]="2" />
          {{ catalog.city() === 'karachi' ? 'Same-day delivery in Karachi' : 'Delivers to your city' }}
        </p>

        <div class="buy">
          <span class="price t-headline">
            {{ b.price | money }}
            @if (b.compareAtPrice) {
              <s><span class="visually-hidden">was </span>{{ b.compareAtPrice | money }}</s>
            }
          </span>
          <div class="actions">
            <button type="button" class="btn btn-primary" (click)="add.emit(b)" [disabled]="!b.inStock">
              <lucide-icon [img]="I.ShoppingBag" [size]="18" [strokeWidth]="2" /> {{ b.inStock ? 'Add to bag' : 'Sold out' }}
            </button>
            <a routerLink="/build-a-basket" class="btn btn-secondary">Build one like this</a>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .card {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: clamp(24px, 4vw, 64px);
      align-items: center;
    }
    :host(.is-reversed) .media { order: 2; }
    .media { aspect-ratio: 1; border-radius: var(--radius); overflow: hidden; background: var(--surface-2); }
    .media img { width: 100%; height: 100%; object-fit: cover; }
    .body { display: grid; gap: 14px; align-content: center; max-width: 520px; justify-items: start; min-width: 0; }
    .body > * { max-width: 100%; }
    .occasion { color: var(--ink-2); font-weight: 560; }
    .desc { color: var(--ink-2); max-width: 34em; }
    .deliver { display: inline-flex; align-items: center; gap: 8px; color: var(--positive); font-weight: 560; }
    .buy { display: grid; gap: 16px; margin-top: 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    @media (max-width: 760px) {
      .card { grid-template-columns: minmax(0, 1fr); }
      :host(.is-reversed) .media { order: 0; }
    }
  `,
})
export class ReadyBasketCard {
  protected readonly I = I;
  protected readonly srcset = catalogSrcset;
  protected readonly catalog = inject(CatalogService);
  readonly basket = input.required<Product>();
  readonly reversed = input(false);
  readonly add = output<Product>();
}
