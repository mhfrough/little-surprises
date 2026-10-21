import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BASKET_CATEGORIES, BRAND } from '../../core/catalog';
import { CatalogService, cityLabel } from '../../core/catalog.service';
import { SeoService } from '../../core/seo.service';
import { BagStore } from '../../core/stores';
import { bold, clean, waLink } from '../../core/whatsapp';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { ProductCard } from '../../shared/cards/product-card';
import { I } from '../../shared/icons';
import { MoneyPipe } from '../../shared/money.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { Lightbox } from '../../shared/lightbox';
import { Rating } from '../../shared/rating';
import { ProductReviews } from '../../shared/reviews/product-reviews';
import { WhatsappIcon } from '../../shared/whatsapp-icon';

@Component({
  selector: 'app-product-page',
  imports: [RouterLink, LucideAngularModule, MoneyPipe, QtyStepper, ProductCard, Breadcrumbs, WhatsappIcon, Lightbox, Rating, ProductReviews],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      @if (product(); as p) {
        <app-breadcrumbs [items]="[{ label: 'Shop', link: '/shop' }, { label: categoryName(), link: '/category/' + p.categoryId }, { label: p.name }]" />

        <div class="layout">
          <div class="gallery">
            <div class="main-img">
              <button type="button" class="open" (click)="viewing.set(true)" [attr.aria-label]="'View ' + p.name + ' full screen'">
                <img [src]="p.images[active()]" [alt]="p.name" width="640" height="640" fetchpriority="high" />
              </button>
              @if (!p.inStock) {
                <span class="status is-muted">Sold out</span>
              } @else if (p.compareAtPrice) {
                <span class="status is-sale">Save {{ p.compareAtPrice - p.price | money }}</span>
              }
              <button type="button" class="g-btn expand" (click)="viewing.set(true)" aria-label="Full screen">
                <lucide-icon [img]="I.Expand" [size]="18" [strokeWidth]="2" />
              </button>
              @if (p.images.length > 1) {
                <button type="button" class="g-btn g-prev" (click)="step(-1)" aria-label="Previous picture">
                  <lucide-icon [img]="I.ChevronLeft" [size]="20" [strokeWidth]="2" />
                </button>
                <button type="button" class="g-btn g-next" (click)="step(1)" aria-label="Next picture">
                  <lucide-icon [img]="I.ChevronRight" [size]="20" [strokeWidth]="2" />
                </button>
                <span class="g-count t-num" aria-hidden="true">{{ active() + 1 }} / {{ p.images.length }}</span>
              }
            </div>
            @if (p.images.length > 1) {
              <div class="thumbs" role="group" aria-label="Pictures">
                @for (src of p.images; track src; let i = $index) {
                  <button type="button" [attr.aria-pressed]="active() === i" (click)="active.set(i)" [attr.aria-label]="'Picture ' + (i + 1)">
                    <img [src]="src" alt="" width="96" height="96" />
                  </button>
                }
              </div>
            }
          </div>
          @if (viewing()) {
            <app-lightbox [images]="p.zoom ?? p.images" [thumbnails]="p.images" [title]="p.name"
              [(index)]="active" (closed)="viewing.set(false)" />
          }

          <div class="info">
            <p class="meta">{{ p.brand ? p.brand + ' · ' : '' }}<a [routerLink]="['/category', p.categoryId]">{{ categoryName() }}</a></p>
            <h1 class="t-title clamp-3" [title]="p.name">{{ p.name }}</h1>
            @if (p.reviewCount) {
              <a href="#reviews" class="rating-link" (click)="toReviews($event)">
                <app-rating [value]="p.rating ?? 0" [count]="p.reviewCount" [size]="16" />
                <span class="t-small">Read reviews</span>
              </a>
            }
            <p class="price t-headline">
              {{ p.price | money }}
              @if (p.compareAtPrice) {
                <s><span class="visually-hidden">was </span>{{ p.compareAtPrice | money }}</s>
              }
            </p>
            @if (p.description) {
              <p class="desc">{{ p.description }}</p>
            }

            <div class="deliver" [class.is-no]="!delivers()">
              <lucide-icon [img]="delivers() ? I.Truck : I.CircleAlert" [size]="20" [strokeWidth]="2" />
              <div>
                @if (delivers()) {
                  <strong>{{ catalog.city() === 'karachi' ? 'Same-day delivery in Karachi' : 'Delivers to ' + city() + ' in 2–4 days' }}</strong>
                  <span>{{ catalog.city() === 'karachi' ? 'Order before 2 pm. ' : '' }}Change the city at the top of the page.</span>
                } @else {
                  <strong>Not available in {{ city() }}</strong>
                  <span>This one is made in {{ deliverCities() }}. <a routerLink="/shop">See gifts for {{ city() }}</a>.</span>
                }
              </div>
            </div>

            @if (p.inStock && delivers()) {
              <div class="buy">
                <app-qty-stepper [(value)]="qty" [min]="1" [max]="20" [label]="p.name" />
                <button type="button" class="btn btn-primary btn-lg add" (click)="bag.add(p, qty())">
                  <lucide-icon [img]="I.ShoppingBag" [size]="20" [strokeWidth]="2" /> Add to bag · {{ p.price * qty() | money }}
                </button>
              </div>
              <a class="btn btn-secondary btn-lg wa" [href]="waLink()" target="_blank" rel="noopener">
                <app-whatsapp-icon [size]="20" /> Order on WhatsApp
              </a>
            } @else if (!p.inStock) {
              <button type="button" class="btn btn-secondary btn-lg" disabled>Sold out</button>
            }

            @if (basketable()) {
              <p class="t-small t-muted">Fits in a custom basket too. <a routerLink="/build-a-basket" class="link">Build a basket</a></p>
            }

            <ul class="promises" role="list">
              <li><lucide-icon [img]="I.PenLine" [size]="18" [strokeWidth]="1.8" /> Free handwritten note</li>
              <li><lucide-icon [img]="I.Wallet" [size]="18" [strokeWidth]="1.8" /> Cash on delivery</li>
              <li><lucide-icon [img]="I.ShieldCheck" [size]="18" [strokeWidth]="1.8" /> Replaced if it arrives damaged</li>
            </ul>

            <div class="details">
              <details>
                <summary>Delivery</summary>
                <p>Same day across Karachi on orders before 2 pm; 2–4 days to other cities. Rs 250 in Karachi, free over Rs 10,000.
                  <a routerLink="/policies/delivery" class="link">Delivery policy</a></p>
              </details>
              <details>
                <summary>Refunds and cancellations</summary>
                <p>Tell us within 24 hours if anything arrives damaged and we'll replace it.
                  <a routerLink="/policies/refunds" class="link">Refund policy</a></p>
              </details>
            </div>
          </div>
        </div>

        <app-product-reviews [product]="p" />

        @if (related().length) {
          <section class="related" aria-labelledby="rel-title">
            <h2 id="rel-title" class="t-title">You may also like</h2>
            <div class="grid">
              @for (r of related(); track r.id) {
                <app-product-card [product]="r" (add)="bag.add($event)" />
              }
            </div>
          </section>
        }
      } @else if (catalog.loading()) {
        <div class="layout" aria-busy="true">
          <span class="skeleton sk-img"></span>
          <div class="info"><span class="skeleton sk-l"></span><span class="skeleton sk-l w"></span><span class="skeleton sk-l"></span></div>
        </div>
      } @else {
        <div class="missing">
          <h1 class="t-title">We couldn't find that gift</h1>
          <p class="t-muted">It may have sold out for the season.</p>
          <a routerLink="/shop" class="btn btn-primary">See all gifts</a>
        </div>
      }
    </main>
  `,
  styles: `
    .page { display: grid; gap: 28px; padding-top: 32px; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 80px); align-items: start; }
    .gallery { display: grid; gap: 12px; position: sticky; top: calc(var(--header-h) + 16px); }
    .main-img { position: relative; aspect-ratio: 1; border-radius: var(--radius-lg); overflow: hidden; background: var(--surface-2); }
    .main-img .open { display: block; width: 100%; height: 100%; padding: 0; cursor: zoom-in; }
    .main-img img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow) var(--ease-out); }
    .main-img:hover img { transform: scale(1.03); }
    .main-img .status { position: absolute; left: 16px; top: 16px; pointer-events: none; }
    .g-btn {
      position: absolute; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
      background: var(--ground); color: var(--ink); box-shadow: 0 2px 10px rgb(0 0 0 / 0.12);
      opacity: 0; transition: opacity var(--dur) var(--ease-out), transform var(--dur-fast) var(--ease-out);
    }
    .main-img:hover .g-btn, .g-btn:focus-visible { opacity: 1; }
    .g-btn:active { transform: scale(0.94); }
    .expand { right: 14px; top: 14px; opacity: 1; }
    .g-prev { left: 14px; top: 50%; margin-top: -22px; }
    .g-next { right: 14px; top: 50%; margin-top: -22px; }
    .g-count {
      position: absolute; right: 14px; bottom: 14px; padding: 4px 10px; border-radius: var(--radius-pill);
      background: rgb(0 0 0 / 0.55); color: #fff; font-size: 0.8125rem; pointer-events: none;
    }
    @media (hover: none) { .g-btn { opacity: 1; } }
    .thumbs { display: flex; gap: 10px; overflow-x: auto; padding: 3px; scrollbar-width: none; }
    .thumbs button { flex: none; width: 80px; height: 80px; border-radius: 14px; overflow: hidden; opacity: 0.6; transition: opacity var(--dur-fast); }
    .thumbs button:hover { opacity: 0.9; }
    .thumbs button[aria-pressed='true'] { opacity: 1; box-shadow: 0 0 0 2px var(--accent); }
    .thumbs img { width: 100%; height: 100%; object-fit: cover; }
    .info { display: grid; gap: 18px; align-content: start; }
    .meta { color: var(--ink-2); font-weight: 560; }
    .rating-link { display: inline-flex; align-items: center; gap: 10px; justify-self: start; margin-top: -6px; }
    .rating-link span { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    .meta a:hover, .link { text-decoration: underline; text-underline-offset: 3px; }
    .link { color: var(--accent); font-weight: 560; }
    .price s { font-size: 0.8em; }
    .desc { color: var(--ink-2); max-width: 36em; }
    .deliver { display: flex; gap: 12px; padding: 16px 18px; border-radius: var(--radius); background: var(--surface); }
    .deliver lucide-icon { color: var(--positive); flex: none; margin-top: 2px; }
    .deliver.is-no lucide-icon { color: var(--negative); }
    .deliver div { display: grid; gap: 2px; font-size: var(--text-small); }
    .deliver strong { font-size: var(--text-body); font-weight: 620; }
    .deliver a { color: var(--accent); text-decoration: underline; }
    .buy { display: flex; gap: 12px; align-items: center; }
    .buy app-qty-stepper { height: var(--control-lg); padding: 4px; }
    .add { flex: 1; }
    .wa { color: var(--wa-ink); }
    .promises { display: grid; gap: 10px; padding-top: 4px; font-size: var(--text-small); color: var(--ink-2); }
    .promises li { display: flex; align-items: center; gap: 10px; }
    .promises lucide-icon { color: var(--accent); }
    .details { display: grid; gap: 8px; }
    details { border-radius: var(--radius); background: var(--surface); padding: 4px 18px; }
    summary { cursor: pointer; font-weight: 600; padding: 12px 0; list-style-position: inside; }
    details p { padding-bottom: 14px; font-size: var(--text-small); color: var(--ink-2); }
    .related { display: grid; gap: 28px; padding-top: calc(var(--section-gap) / 2); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 20px; }
    .sk-img { aspect-ratio: 1; border-radius: var(--radius-lg); }
    .sk-l { height: 28px; width: 70%; }
    .sk-l.w { width: 40%; }
    .missing { display: grid; justify-items: start; gap: 14px; padding-block: 80px; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
      .gallery { position: static; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
    }
  `,
})
export class ProductPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  protected readonly bag = inject(BagStore);
  private readonly seo = inject(SeoService);

  readonly slug = input.required<string>();
  protected readonly qty = signal(1);
  protected readonly active = signal(0);
  protected readonly viewing = signal(false);

  protected readonly product = computed(() => this.catalog.bySlug(this.slug()));
  protected readonly categoryName = computed(() => this.catalog.categoryName(this.product()?.categoryId ?? ''));
  protected readonly city = computed(() => cityLabel(this.catalog.city()));
  protected readonly delivers = computed(() => {
    const p = this.product();
    return !!p && this.catalog.deliversTo(p);
  });
  protected readonly deliverCities = computed(() => {
    const cs = this.product()?.cities ?? [];
    return cs.length > 3 ? `${cs.slice(0, 3).map(cityLabel).join(', ')} and ${cs.length - 3} more` : cs.map(cityLabel).join(', ');
  });
  protected readonly basketable = computed(() => BASKET_CATEGORIES.includes(this.product()?.categoryId ?? ''));
  protected readonly related = computed(() => {
    const p = this.product();
    return p ? this.catalog.related(p) : [];
  });
  protected readonly waLink = computed(() => {
    const p = this.product();
    const text = p
      ? [
          `👋 Hi! I'd like to order:`,
          '',
          `🎁 ${bold(`${this.qty()} × ${clean(p.name)}`)}`,
          `💰 Rs ${p.price.toLocaleString('en-PK')} each`,
          `📍 Delivery in ${this.city()}`,
          '',
          `🔗 ${BRAND.siteUrl}/product/${p.slug}`,
        ].join('\n')
      : '';
    return waLink(text);
  });

  toReviews(e: Event): void {
    e.preventDefault();
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  step(dir: number): void {
    const n = this.product()?.images.length ?? 1;
    this.active.set((this.active() + dir + n) % n);
  }

  constructor() {
    effect(() => {
      this.slug();
      this.qty.set(1);
      this.active.set(0);
      this.viewing.set(false);
    });
    effect(() => {
      const p = this.product();
      if (!p) return;
      this.seo.set({
        title: p.name,
        description: p.description || `${p.name} — ${this.categoryName()}, delivered same day across Karachi.`,
        path: `/product/${p.slug}`,
        image: p.images[0],
        jsonLd: {
          '@type': 'Product',
          name: p.name,
          image: p.images.map((src) => new URL(src, BRAND.siteUrl + '/').href),
          description: p.description || undefined,
          brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
          category: this.categoryName(),
          aggregateRating: p.reviewCount
            ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount, bestRating: 5, worstRating: 1 }
            : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'PKR',
            price: p.price,
            availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${BRAND.siteUrl}/product/${p.slug}`,
          },
        },
      });
    });
  }
}
