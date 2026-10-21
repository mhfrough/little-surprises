import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService, cityLabel } from '../../core/catalog.service';
import { SearchService } from '../../core/search.service';
import { SeoService } from '../../core/seo.service';
import { BagStore } from '../../core/stores';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { ProductCard } from '../../shared/cards/product-card';
import { I } from '../../shared/icons';

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'name';

const PRICE_BANDS = [
  { id: '', label: 'Any price', min: 0, max: Infinity },
  { id: 'u3', label: 'Under Rs 3,000', min: 0, max: 3000 },
  { id: '3-7', label: 'Rs 3,000 – 7,500', min: 3000, max: 7500 },
  { id: '7p', label: 'Rs 7,500+', min: 7500, max: Infinity },
];

const PAGE = 24;

/** All gifts, a category, an occasion or a search — one page, read from the URL. */
@Component({
  selector: 'app-shop-page',
  imports: [RouterLink, LucideAngularModule, ProductCard, Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="crumbs()" />

      <header class="head">
        <h1 class="t-title">{{ heading() }}</h1>
        <p class="t-muted">{{ intro() }}</p>
      </header>

      <nav class="chip-row cats" aria-label="Categories">
        <a class="chip" routerLink="/shop" [class.is-active]="mode() === 'all'">All gifts</a>
        @for (c of catalog.categories(); track c.id) {
          <a class="chip" [routerLink]="['/category', c.slug]" [class.is-active]="mode() === 'category' && slug() === c.slug">{{ c.name }}</a>
        }
      </nav>

      <div class="tools">
        <form class="search-field" role="search" (submit)="$event.preventDefault()">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="shop-q">Search gifts</label>
          <input id="shop-q" class="input" type="search" placeholder="Search cakes, Belco, mithai…" [value]="q() ?? ''"
            (input)="setQuery({ q: $any($event.target).value || null })" />
        </form>
        <div class="segmented" role="group" aria-label="Price">
          @for (b of bands; track b.id) {
            <button type="button" [attr.aria-pressed]="(price() ?? '') === b.id" (click)="setQuery({ price: b.id || null })">{{ b.label }}</button>
          }
        </div>
        <label class="sort">
          <span class="visually-hidden">Sort by</span>
          <select class="select" [value]="sort() ?? 'featured'" (change)="setQuery({ sort: $any($event.target).value })">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      @if (brands().length > 1) {
        <div class="chip-row brands" role="group" aria-label="Brand">
          @for (b of brands(); track b) {
            <button type="button" class="chip" [attr.aria-pressed]="brand() === b" (click)="setQuery({ brand: brand() === b ? null : b })">{{ b }}</button>
          }
        </div>
      }

      <p class="count t-small t-muted" aria-live="polite">
        {{ results().length }} {{ results().length === 1 ? 'gift' : 'gifts' }} delivering to {{ city() }}
      </p>

      @if (catalog.error()) {
        <div class="empty" role="alert">
          <h2 class="t-headline">We couldn't load the gifts</h2>
          <p class="t-muted">Check your connection and try again, or message us on WhatsApp and we'll help you order.</p>
          <div class="row">
            <button type="button" class="btn btn-primary" (click)="catalog.retry()">Try again</button>
            <a routerLink="/contact" class="btn btn-secondary">Contact us</a>
          </div>
        </div>
      } @else if (catalog.loading()) {
        <div class="grid">
          @for (n of skeleton; track n) {
            <div class="sk" aria-hidden="true"><span class="skeleton sk-img"></span><span class="skeleton sk-line"></span><span class="skeleton sk-line short"></span></div>
          }
        </div>
      } @else if (results().length) {
        <div class="grid">
          @for (p of shown(); track p.id) {
            <app-product-card [product]="p" (add)="bag.add($event)" />
          }
        </div>
        @if (results().length > shown().length) {
          <div class="more">
            <button type="button" class="btn btn-secondary" (click)="limit.set(limit() + page)">
              Show more ({{ results().length - shown().length }} left)
            </button>
          </div>
        }
      } @else {
        <div class="empty">
          <h2 class="t-headline">Nothing matches that yet</h2>
          <p class="t-muted">Try another word or price, or build a basket of exactly what you want.</p>
          <div class="row">
            <a routerLink="/shop" class="btn btn-secondary">Clear filters</a>
            <a routerLink="/build-a-basket" class="btn btn-primary">Build a basket</a>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    .page { display: grid; gap: 28px; padding-block: 32px 0; }
    .head { display: grid; gap: 10px; max-width: 720px; }
    .tools { display: grid; grid-template-columns: minmax(220px, 1fr) auto 220px; gap: 12px; align-items: center; }
    .segmented { overflow-x: auto; scrollbar-width: none; }
    .segmented button { flex: none; }
    .count { margin-top: -8px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 20px; }
    .more { display: flex; justify-content: center; margin-top: 16px; }
    .sk { display: grid; gap: 10px; }
    .sk-img { aspect-ratio: 1; border-radius: var(--radius); }
    .sk-line { height: 14px; }
    .short { width: 50%; }
    .empty { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 72px 24px; border-radius: var(--radius-lg); background: var(--surface); }
    .row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }
    @media (max-width: 1100px) {
      .tools { grid-template-columns: 1fr 200px; }
      .segmented { grid-column: 1 / -1; grid-row: 2; justify-self: start; max-width: 100%; }
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 700px) {
      .tools { grid-template-columns: 1fr; }
      .segmented { grid-row: auto; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
    }
  `,
})
export class ShopPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  protected readonly bag = inject(BagStore);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly search = inject(SearchService);

  // route params, route data and query params, bound by the router
  readonly mode = input<'all' | 'category' | 'occasion'>('all');
  readonly slug = input<string>();
  readonly q = input<string>();
  readonly price = input<string>();
  readonly sort = input<Sort>();
  readonly brand = input<string>();

  protected readonly bands = PRICE_BANDS;
  protected readonly page = PAGE;
  protected readonly skeleton = Array.from({ length: 8 }, (_, i) => i);
  protected readonly limit = signal(PAGE);
  protected readonly city = computed(() => cityLabel(this.catalog.city()));

  private readonly base = computed(() => {
    const s = this.slug() ?? '';
    if (this.mode() === 'category') return this.catalog.inCategory(s);
    if (this.mode() === 'occasion') return this.catalog.inOccasion(s);
    return this.catalog.products();
  });

  protected readonly brands = computed(() =>
    [...new Set(this.base().map((p) => p.brand).filter((b): b is string => !!b))].sort(),
  );

  protected readonly results = computed(() => {
    const band = PRICE_BANDS.find((b) => b.id === (this.price() ?? '')) ?? PRICE_BANDS[0];
    const words = (this.q() ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const ranked = words.length ? this.search.products(this.q()!) : [];
    const rank = new Map(ranked.map((r, i) => [r.product.id, i]));
    const list = this.base().filter(
      (p) =>
        p.price >= band.min &&
        p.price < band.max &&
        (!this.brand() || p.brand === this.brand()) &&
        (!words.length || rank.has(p.id)),
    );
    if (words.length && (!this.sort() || this.sort() === 'featured')) return [...list].sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    switch (this.sort()) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list; // catalog order: in stock first
    }
  });

  protected readonly shown = computed(() => this.results().slice(0, this.limit()));

  protected readonly heading = computed(() => {
    if (this.mode() === 'category') return this.catalog.category(this.slug() ?? '')?.name ?? 'Gifts';
    if (this.mode() === 'occasion') return this.catalog.occasionName(this.slug() ?? '') || 'Gifts';
    return this.q() ? `Results for “${this.q()}”` : 'All gifts';
  });

  protected readonly intro = computed(() => {
    if (this.mode() === 'category') return this.catalog.category(this.slug() ?? '')?.description ?? '';
    if (this.mode() === 'occasion') return `Gifts for ${this.heading().toLowerCase()}, delivered across ${this.city()}.`;
    return `Hampers, chocolates, cakes, flowers and more, delivered across ${this.city()}.`;
  });

  protected readonly crumbs = computed(() =>
    this.mode() === 'all' ? [{ label: 'Shop' }] : [{ label: 'Shop', link: '/shop' }, { label: this.heading() }],
  );

  constructor() {
    // New listing or filter: start from the first page again.
    effect(() => {
      this.mode();
      this.slug();
      this.q();
      this.price();
      this.brand();
      this.limit.set(PAGE);
    });
    effect(() => {
      const path = this.mode() === 'all' ? '/shop' : `/${this.mode()}/${this.slug()}`;
      this.seo.set({ title: this.heading(), description: this.intro(), path });
    });
  }

  setQuery(params: Record<string, string | null>): void {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
