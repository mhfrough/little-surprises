import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../core/catalog.service';
import { InboxService, TYPE_LABEL } from '../core/inbox.service';
import { ReviewsService } from '../core/reviews.service';
import { I } from '../shared/icons';
import { BarChart, Datum, StatTile } from './charts';

const PRICE_BANDS = [
  { label: '< 1K', max: 1000 },
  { label: '1–3K', max: 3000 },
  { label: '3–5K', max: 5000 },
  { label: '5–10K', max: 10000 },
  { label: '10–20K', max: 20000 },
  { label: '20K+', max: Infinity },
];

/** The operator's morning view: counts, what's changing, and what needs a reply. */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, LucideAngularModule, BarChart, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Dashboard</h1>
          <p>{{ today }} · catalogue, reviews and messages at a glance</p>
        </div>
        <a routerLink="/admin/products/new" class="btn btn-primary btn-sm"><lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2.2" /> New product</a>
      </header>

      <section class="kpis" aria-label="Key numbers">
        <app-stat-tile label="Products" [value]="products().length" [note]="soldOut() + ' sold out · ' + onSale() + ' on sale'" />
        <app-stat-tile label="Categories" [value]="catalog.categories().length" [note]="'Largest: ' + largestCategory()" />
        <app-stat-tile label="Average rating" [value]="ratingSummary().average.toFixed(1) + ' ★'" [note]="ratingSummary().count.toLocaleString('en-PK') + ' reviews'" />
        <app-stat-tile label="New messages" [value]="inbox.unread()" [note]="openComplaints() + ' complaints open'" [alert]="openComplaints() > 0" />
        <app-stat-tile label="Reviews to approve" [value]="reviews.pendingCount()" [note]="reviews.pendingCount() ? 'Waiting in Reviews' : 'All caught up'" [alert]="reviews.pendingCount() > 0" />
        <app-stat-tile label="Survey score" [value]="surveyAvg()" [note]="surveyCount() + ' responses'" />
      </section>

      <div class="grid">
        <section class="adm-panel wide">
          <header><h2>Reviews per month</h2><p>Last 12 months</p></header>
          <app-bar-chart orientation="vertical" [data]="reviewsByMonth()" [height]="200" label="Reviews per month, last 12 months" labelHeader="Month" valueHeader="Reviews" />
        </section>
        <section class="adm-panel">
          <header><h2>Rating breakdown</h2><p>All reviews</p></header>
          <app-bar-chart [data]="ratingBars()" label="Number of reviews at each star rating" labelHeader="Rating" valueHeader="Reviews" />
        </section>
        <section class="adm-panel">
          <header><h2>Products by category</h2><a routerLink="/admin/categories" class="link">Manage</a></header>
          <app-bar-chart [data]="byCategory()" label="Number of products in each category" labelHeader="Category" valueHeader="Products" />
        </section>
        <section class="adm-panel">
          <header><h2>Price range</h2><p>Products per price band (Rs)</p></header>
          <app-bar-chart orientation="vertical" [data]="byPrice()" [height]="170" label="Products per price band" labelHeader="Price band" valueHeader="Products" />
        </section>
        <section class="adm-panel">
          <header><h2>Messages by type</h2><a routerLink="/admin/inbox" class="link">Open inbox</a></header>
          <app-bar-chart [data]="byType()" label="Inbox messages by type" labelHeader="Type" valueHeader="Messages" />
        </section>
      </div>

      <div class="grid three">
        <section class="adm-panel">
          <header><h2>Latest messages</h2><a routerLink="/admin/inbox" class="link">All</a></header>
          <ul class="list" role="list">
            @for (m of latest(); track m.id) {
              <li>
                <a [routerLink]="['/admin/inbox']" [queryParams]="{ id: m.id }">
                  <span class="adm-pill" [class.is-bad]="m.type === 'complaint'" [class.is-new]="m.status === 'new' && m.type !== 'complaint'">{{ typeLabel[m.type] }}</span>
                  <span class="li-text"><strong class="clamp-1">{{ m.subject }}</strong><span class="clamp-1">{{ m.name }} · {{ ago(m.date) }}</span></span>
                </a>
              </li>
            }
          </ul>
        </section>
        <section class="adm-panel">
          <header><h2>Lowest rated</h2><p>3+ reviews</p></header>
          <ul class="list" role="list">
            @for (p of lowestRated(); track p.id) {
              <li>
                <a [routerLink]="['/admin/products', p.id]">
                  <img [src]="p.images[0]" alt="" width="36" height="36" />
                  <span class="li-text"><strong class="clamp-1">{{ p.name }}</strong><span>{{ p.rating?.toFixed(1) }} ★ · {{ p.reviewCount }} reviews</span></span>
                </a>
              </li>
            }
          </ul>
        </section>
        <section class="adm-panel">
          <header><h2>Sold out</h2><p>{{ soldOut() }} products</p></header>
          <ul class="list" role="list">
            @for (p of soldOutList(); track p.id) {
              <li>
                <a [routerLink]="['/admin/products', p.id]">
                  <img [src]="p.images[0]" alt="" width="36" height="36" />
                  <span class="li-text"><strong class="clamp-1">{{ p.name }}</strong><span>{{ catalog.categoryName(p.categoryId) }}</span></span>
                </a>
              </li>
            } @empty {
              <li class="none">Everything is in stock.</li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .wide { grid-column: 1 / -1; }
    .link { font-size: 0.8125rem; font-weight: 600; color: var(--accent); }
    .list { display: grid; gap: 2px; list-style: none; margin: 0; padding: 0; }
    .list a { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 10px; min-width: 0; }
    .list a:hover { background: var(--surface-2); }
    .list img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex: none; }
    .li-text { display: grid; min-width: 0; font-size: 0.8125rem; }
    .li-text strong { font-weight: 600; }
    .li-text span { color: var(--ink-3); }
    .none { padding: 8px; color: var(--ink-3); font-size: var(--text-small); }
    @media (max-width: 1280px) { .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 1000px) { .grid, .grid.three { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 560px) { .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  `,
})
export class DashboardPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  protected readonly inbox = inject(InboxService);
  protected readonly reviews = inject(ReviewsService);
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  protected readonly products = this.catalog.allProducts;
  protected readonly soldOut = computed(() => this.products().filter((p) => !p.inStock).length);
  protected readonly onSale = computed(() => this.products().filter((p) => p.compareAtPrice).length);
  protected readonly soldOutList = computed(() => this.products().filter((p) => !p.inStock).slice(0, 5));
  protected readonly largestCategory = computed(() => [...this.catalog.categories()].sort((a, b) => b.count - a.count)[0]?.name ?? '—');

  protected readonly ratingSummary = computed(() => this.reviews.summary(this.reviews.moderated().filter((r) => r.status === 'published')));
  protected readonly ratingBars = computed<Datum[]>(() => [5, 4, 3, 2, 1].map((n) => ({ label: `${n} ★`, value: this.ratingSummary().counts[n - 1] })));

  protected readonly reviewsByMonth = computed<Datum[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
    const counts = new Map(months.map((m) => [`${m.getFullYear()}-${m.getMonth()}`, 0]));
    for (const r of this.reviews.moderated()) {
      const d = new Date(r.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
    }
    return months.map((m) => ({ label: m.toLocaleDateString('en-GB', { month: 'short' }), value: counts.get(`${m.getFullYear()}-${m.getMonth()}`)! }));
  });

  protected readonly byCategory = computed<Datum[]>(() =>
    [...this.catalog.categories()].sort((a, b) => b.count - a.count).map((c) => ({ label: c.name, value: c.count })),
  );

  protected readonly byPrice = computed<Datum[]>(() => {
    let min = 0;
    return PRICE_BANDS.map((b) => {
      const value = this.products().filter((p) => p.price >= min && p.price < b.max).length;
      min = b.max;
      return { label: b.label, value };
    });
  });

  protected readonly byType = computed<Datum[]>(() =>
    (Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((t) => ({ label: TYPE_LABEL[t], value: this.inbox.all().filter((m) => m.type === t).length })),
  );

  protected readonly openComplaints = computed(() => this.inbox.all().filter((m) => m.type === 'complaint' && (m.status === 'new' || m.status === 'read')).length);
  private readonly surveys = computed(() => this.inbox.all().filter((m) => m.type === 'survey' && m.rating));
  protected readonly surveyCount = computed(() => this.surveys().length);
  protected readonly surveyAvg = computed(() =>
    this.surveyCount() ? (this.surveys().reduce((s, m) => s + (m.rating ?? 0), 0) / this.surveyCount()).toFixed(1) + ' / 5' : '—',
  );

  protected readonly latest = computed(() => this.inbox.all().slice(0, 5));
  protected readonly lowestRated = computed(() =>
    this.products()
      .filter((p) => (p.reviewCount ?? 0) >= 3)
      .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
      .slice(0, 5),
  );

  ago(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  }
}
