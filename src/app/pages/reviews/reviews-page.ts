import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../core/catalog.service';
import { Product } from '../../core/models';
import { ReviewSort, ReviewsService } from '../../core/reviews.service';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { I } from '../../shared/icons';
import { Pagination } from '../../shared/pagination';
import { Rating } from '../../shared/rating';
import { RatingSummaryBlock, ReviewForm, ReviewItem } from '../../shared/reviews/review-parts';

const PAGE = 12;

/**
 * Every customer review in one place, filterable by stars, category and words,
 * with the best-loved gifts alongside and a form to leave feedback. Filters
 * live in the URL so a filtered view can be shared.
 */
@Component({
  selector: 'app-reviews-page',
  imports: [RouterLink, LucideAngularModule, Breadcrumbs, Pagination, Rating, RatingSummaryBlock, ReviewItem, ReviewForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Customer reviews' }]" />

      <header class="hero">
        <div class="hero-copy">
          <h1 class="t-title">What our customers say</h1>
          <p class="t-lead">Honest reviews of our hampers, chocolates, cakes and flowers, from people who sent them and people who received them.</p>
          <a href="#feedback" class="btn btn-primary" (click)="jump($event, 'feedback')">
            <lucide-icon [img]="I.PenLine" [size]="18" [strokeWidth]="2" /> Share your feedback
          </a>
        </div>
        <div class="hero-summary">
          <app-rating-summary [summary]="summary()" [filter]="starsNum()" (filterChange)="setQuery({ stars: $event || null })" />
        </div>
      </header>

      @if (loved().length) {
        <section class="loved" aria-labelledby="loved-title">
          <h2 id="loved-title" class="t-headline">Most loved gifts</h2>
          <ul role="list">
            @for (p of loved(); track p.id) {
              <li>
                <a [routerLink]="['/product', p.slug]" class="lov">
                  <img [src]="p.images[0]" alt="" width="64" height="64" loading="lazy" />
                  <span class="lov-text">
                    <strong class="clamp-1">{{ p.name }}</strong>
                    <app-rating [value]="p.rating ?? 0" [count]="p.reviewCount ?? 0" [size]="12" />
                  </span>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      <section class="all" aria-labelledby="all-title" id="all">
        <div class="all-head">
          <h2 id="all-title" class="t-title">All reviews</h2>
          <p class="t-small t-muted" aria-live="polite">{{ filtered().length.toLocaleString('en-PK') }} {{ filtered().length === 1 ? 'review' : 'reviews' }}</p>
        </div>

        <div class="tools">
          <form class="search-field" role="search" (submit)="$event.preventDefault()">
            <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
            <label class="visually-hidden" for="rv-q">Search reviews</label>
            <input id="rv-q" class="input" type="search" placeholder="Search reviews, e.g. delivery, fresh, kunafa" [value]="q() ?? ''"
              (input)="setQuery({ q: $any($event.target).value || null })" />
          </form>
          <label>
            <span class="visually-hidden">Category</span>
            <select class="select" [value]="cat() ?? ''" (change)="setQuery({ cat: $any($event.target).value || null })">
              <option value="">All gifts</option>
              <option value="shop">About the shop</option>
              @for (c of catalog.categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </label>
          <label>
            <span class="visually-hidden">Sort reviews</span>
            <select class="select" [value]="sort() ?? 'newest'" (change)="setQuery({ sort: $any($event.target).value })">
              <option value="newest">Newest first</option>
              <option value="helpful">Most helpful</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </label>
        </div>
        <div class="chip-row filters" role="group" aria-label="Filter">
          <button type="button" class="chip" [attr.aria-pressed]="!starsNum()" (click)="setQuery({ stars: null })">All stars</button>
          @for (n of [5, 4, 3, 2, 1]; track n) {
            <button type="button" class="chip" [attr.aria-pressed]="starsNum() === n" (click)="setQuery({ stars: starsNum() === n ? null : n })">{{ n }}<span class="t-star">★</span></button>
          }
          <button type="button" class="chip" [attr.aria-pressed]="verified() === '1'" (click)="setQuery({ verified: verified() === '1' ? null : '1' })">
            <lucide-icon [img]="I.CircleCheck" [size]="14" [strokeWidth]="2.2" /> Verified only
          </button>
        </div>

        @if (reviews.loading()) {
          <p class="t-muted">Loading reviews…</p>
        } @else if (shown().length) {
          <div class="grid">
            @for (r of shown(); track r.id) {
              <div class="card"><app-review-item [review]="r" [product]="productOf(r.productId)" /></div>
            }
          </div>
          <app-pagination [total]="filtered().length" [pageSize]="pageSize" [page]="pageNum()" (pageChange)="goPage($event)" label="Review pages" />
        } @else {
          <div class="empty">
            <h3 class="t-headline">No reviews match</h3>
            <p class="t-muted">Try fewer words or another filter.</p>
            <a routerLink="/reviews" class="btn btn-secondary">Clear filters</a>
          </div>
        }
      </section>

      <section id="feedback" class="feedback" aria-labelledby="fb-title">
        <div class="fb-copy">
          <h2 id="fb-title" class="t-title">Share your feedback</h2>
          <p class="t-muted">Tell us about a gift you sent or received, or about us in general. Every review is read by our team in Karachi.</p>
          <ul class="t-small promises" role="list">
            <li><lucide-icon [img]="I.ShieldCheck" [size]="16" [strokeWidth]="2" /> We publish good and bad reviews alike</li>
            <li><lucide-icon [img]="I.Clock" [size]="16" [strokeWidth]="2" /> Checked and published within a day</li>
            <li><lucide-icon [img]="I.Mail" [size]="16" [strokeWidth]="2" /> A problem with an order? <a routerLink="/contact">Contact us</a> and we'll fix it first</li>
          </ul>
        </div>
        <div class="fb-form">
          <app-review-form [products]="byName()" heading="Write a review" (posted)="afterPost()" />
        </div>
      </section>
    </main>
  `,
  styles: `
    .page { display: grid; gap: clamp(40px, 6vw, 80px); padding-top: 32px; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); align-items: center; margin-top: -24px; }
    .hero-copy { display: grid; gap: 18px; justify-items: start; }
    .hero-summary { padding: 28px; border-radius: var(--radius-lg); background: var(--surface); }

    .loved { display: grid; gap: 16px; }
    .loved ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; list-style: none; margin: 0; padding: 0; }
    .lov { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: var(--radius); background: var(--surface); min-width: 0; }
    .lov:hover { background: var(--surface-2); }
    .lov img { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; flex: none; }
    .lov-text { display: grid; gap: 4px; min-width: 0; }
    .lov strong { font-size: 0.9375rem; font-weight: 600; }

    .all { display: grid; gap: 18px; scroll-margin-top: calc(var(--header-h) + 16px); }
    .all-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .tools { display: grid; grid-template-columns: minmax(0, 1fr) 220px 200px; gap: 10px; }
    .filters { flex-wrap: wrap; overflow: visible; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
    .card { padding: 0 22px; border-radius: var(--radius); background: var(--surface); min-width: 0; }
    .card ::ng-deep .about { background: var(--ground); }
    app-pagination { margin-top: 12px; }
    .empty { display: grid; justify-items: center; gap: 10px; padding: 56px 24px; border-radius: var(--radius-lg); background: var(--surface); text-align: center; }

    .feedback { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: clamp(28px, 5vw, 72px); align-items: start; padding: clamp(24px, 4vw, 48px); border-radius: var(--radius-lg); background: var(--field); color: var(--field-ink); scroll-margin-top: calc(var(--header-h) + 16px); }
    .fb-copy { display: grid; gap: 14px; }
    .fb-copy .t-muted { color: inherit; opacity: 0.85; }
    .promises { display: grid; gap: 10px; }
    .promises li { display: flex; gap: 10px; align-items: flex-start; }
    .promises lucide-icon { color: var(--positive); flex: none; margin-top: 2px; }
    .promises a { color: var(--accent); text-decoration: underline; font-weight: 600; }
    .fb-form { padding: clamp(20px, 3vw, 32px); border-radius: var(--radius-lg); background: var(--ground); color: var(--ink); }

    @media (max-width: 1000px) {
      .hero, .feedback { grid-template-columns: minmax(0, 1fr); }
      .loved ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tools { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
      .tools form { grid-column: 1 / -1; }
      .grid { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 520px) {
      .loved ul, .tools { grid-template-columns: minmax(0, 1fr); }
    }
  `,
})
export class ReviewsPage {
  protected readonly I = I;
  protected readonly reviews = inject(ReviewsService);
  protected readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  // query params, bound by the router
  readonly q = input<string>();
  readonly cat = input<string>();
  readonly stars = input<string>();
  readonly sort = input<ReviewSort>();
  readonly verified = input<string>();
  readonly page = input<string>();

  protected readonly pageSize = PAGE;
  protected readonly starsNum = computed(() => Number(this.stars()) || 0);
  protected readonly pageNum = computed(() => Math.max(1, Number(this.page()) || 1));

  private readonly productMap = computed(() => new Map(this.catalog.products().map((p) => [p.id, p])));
  productOf(id: string): Product | undefined {
    return this.productMap().get(id);
  }

  /** Reviews in scope before the star filter, so the bars show what's there. */
  private readonly scoped = computed(() => {
    const words = (this.q() ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const cat = this.cat();
    const map = this.productMap();
    return this.reviews.all().filter((r) => {
      if (this.verified() === '1' && !r.verified) return false;
      if (cat === 'shop' && r.productId) return false;
      if (cat && cat !== 'shop' && map.get(r.productId)?.categoryId !== cat) return false;
      if (!words.length) return true;
      const hay = `${r.title} ${r.text} ${map.get(r.productId)?.name ?? ''} ${r.city}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  });

  protected readonly summary = computed(() => this.reviews.summary(this.scoped()));
  protected readonly filtered = computed(() =>
    this.reviews.sort(this.scoped().filter((r) => !this.starsNum() || r.rating === this.starsNum()), this.sort() ?? 'newest'),
  );
  protected readonly shown = computed(() => this.filtered().slice((this.pageNum() - 1) * PAGE, this.pageNum() * PAGE));

  protected readonly loved = computed(() =>
    this.catalog
      .products()
      .filter((p) => p.inStock && (p.reviewCount ?? 0) >= 8)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
      .slice(0, 8),
  );
  protected readonly byName = computed(() => [...this.catalog.products()].sort((a, b) => a.name.localeCompare(b.name)));

  constructor() {
    effect(() => {
      const s = this.reviews.summary(this.reviews.all());
      this.seo.set({
        title: 'Customer reviews',
        description: `Rated ${s.average.toFixed(1)} out of 5 from ${s.count.toLocaleString('en-PK')} reviews of our gift hampers, chocolates, cakes and flowers.`,
        path: '/reviews',
      });
    });
  }

  setQuery(params: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: { ...params, page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  goPage(n: number): void {
    this.router.navigate([], { queryParams: { page: n > 1 ? n : null }, queryParamsHandling: 'merge' });
    document.getElementById('all')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  jump(e: Event, id: string): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  afterPost(): void {
    this.router.navigate([], { queryParams: { sort: null, page: null, stars: null, q: null, cat: null, verified: null } });
  }
}
