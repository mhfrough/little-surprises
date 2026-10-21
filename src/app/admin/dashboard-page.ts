import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../core/catalog.service';
import { InboxService, TYPE_LABEL } from '../core/inbox.service';
import { ReviewsService } from '../core/reviews.service';
import { I } from '../shared/icons';
import { BarChart, Datum, StatTile } from './charts';

const DAY = 86_400_000;
/** The reply time the contact page promises. */
const REPLY_HOURS = 4;

/** Count by key, biggest first; past `top` the rest fold into "Other" so the chart never grows a long tail. */
function tally<T>(items: T[], key: (x: T) => string, top = 6): Datum[] {
  const counts = new Map<string, number>();
  for (const x of items) counts.set(key(x), (counts.get(key(x)) ?? 0) + 1);
  const sorted = [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (sorted.length <= top + 1) return sorted;
  const rest = sorted.slice(top).reduce((s, d) => s + d.value, 0);
  return [...sorted.slice(0, top), { label: 'Other', value: rest }];
}

function age(ms: number): string {
  const h = ms / 3_600_000;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} days`;
}

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
        <app-stat-tile label="Reviews, last 30 days" [value]="recent().count" [note]="recent().deltaNote" [tone]="recent().deltaTone" />
        <app-stat-tile label="Rating, last 30 days" [value]="recent().avg + ' / 5'" [note]="'All-time ' + ratingSummary().average.toFixed(1) + ' from ' + ratingSummary().count.toLocaleString('en-PK')" [tone]="recent().avgTone" />
        <app-stat-tile label="Awaiting a reply" [value]="waiting().count" [note]="waiting().note" [alert]="waiting().late" />
        <app-stat-tile label="Open complaints" [value]="openComplaints()" [note]="openComplaints() ? 'Resolve in Inbox' : 'None open'" [alert]="openComplaints() > 0" />
        <app-stat-tile label="Reviews to approve" [value]="reviews.pendingCount()" [note]="reviews.pendingCount() ? 'Waiting in Reviews' : 'All caught up'" [alert]="reviews.pendingCount() > 0" />
        <app-stat-tile label="Sold out" [value]="soldOut()" [note]="'of ' + products().length + ' products · ' + onSale() + ' on sale'" [alert]="soldOut() > 0" />
      </section>

      <div class="grid">
        <section class="adm-panel wide">
          <header><h2>Reviews per month</h2><p>Last 12 months</p></header>
          <app-bar-chart orientation="vertical" [data]="reviewsByMonth()" [height]="200" [partialLast]="true" label="Reviews per month, last 12 months" />
        </section>
        <section class="adm-panel">
          <header><h2>Rating breakdown</h2><p>All reviews</p></header>
          <app-bar-chart [data]="ratingBars()" label="Number of reviews at each star rating" />
        </section>
        <section class="adm-panel">
          <header><h2>Where customers are</h2><p>Reviews by city, last 90 days</p></header>
          <app-bar-chart [data]="byCity()" label="Reviews by customer city, last 90 days" />
        </section>
        <section class="adm-panel">
          <header><h2>Most reviewed</h2><p>Best proxy for best-sellers until orders are live</p></header>
          <app-bar-chart [data]="mostReviewed()" label="Products with the most reviews" />
        </section>
        <section class="adm-panel">
          <header><h2>How customers found you</h2><p>{{ surveyCount() }} surveys · {{ surveyAvg() }} average</p></header>
          <app-bar-chart [data]="bySource()" label="Where survey respondents heard about the shop" />
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
                  <span class="li-text"><strong class="clamp-1">{{ p.name }}</strong><span>{{ p.rating?.toFixed(1) }} <span class="t-star">★</span> · {{ p.reviewCount }} reviews</span></span>
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
  private readonly published = computed(() => this.reviews.moderated().filter((r) => r.status === 'published'));
  private readonly daysOld = (iso: string) => (Date.now() - new Date(iso).getTime()) / DAY;

  /** Last 30 days against the 30 before, so a trend shows without waiting for the month to end. */
  protected readonly recent = computed(() => {
    const last = this.published().filter((r) => this.daysOld(r.date) < 30);
    const prev = this.published().filter((r) => this.daysOld(r.date) >= 30 && this.daysOld(r.date) < 60).length;
    const avg = last.length ? last.reduce((s, r) => s + r.rating, 0) / last.length : 0;
    const delta = prev ? Math.round(((last.length - prev) / prev) * 100) : null;
    const allTime = this.ratingSummary().average;
    return {
      count: last.length,
      avg: last.length ? avg.toFixed(1) : '—',
      deltaNote: delta === null ? 'Nothing to compare yet' : `${delta > 0 ? '▲' : delta < 0 ? '▼' : '='} ${Math.abs(delta)}% vs previous 30 days`,
      deltaTone: (delta === null || delta === 0 ? '' : delta > 0 ? 'good' : 'bad') as '' | 'good' | 'bad',
      avgTone: (!last.length || Math.abs(avg - allTime) < 0.1 ? '' : avg > allTime ? 'good' : 'bad') as '' | 'good' | 'bad',
    };
  });

  /** Contact requests and complaints not yet resolved, and how long the oldest has waited against the promise. */
  protected readonly waiting = computed(() => {
    const open = this.inbox.all().filter((m) => (m.type === 'contact' || m.type === 'complaint') && m.status !== 'resolved');
    if (!open.length) return { count: 0, note: 'Inbox clear', late: false };
    const oldest = Math.max(...open.map((m) => Date.now() - new Date(m.date).getTime()));
    return { count: open.length, note: `Oldest waiting ${age(oldest)} · promise is ${REPLY_HOURS} h`, late: oldest > REPLY_HOURS * 3_600_000 };
  });

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

  protected readonly byCity = computed(() => tally(this.published().filter((r) => this.daysOld(r.date) < 90), (r) => r.city || 'Not given'));

  protected readonly mostReviewed = computed<Datum[]>(() =>
    [...this.products()]
      .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
      .slice(0, 6)
      .map((p) => ({ label: p.name, value: p.reviewCount ?? 0 })),
  );

  protected readonly bySource = computed(() => tally(this.surveys(), (m) => m.source || 'Didn’t say'));

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
