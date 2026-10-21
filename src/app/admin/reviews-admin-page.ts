import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../core/catalog.service';
import { ModeratedReview, ReviewStatus, ReviewsService } from '../core/reviews.service';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';
import { Pagination } from '../shared/pagination';
import { Rating } from '../shared/rating';

const PAGE = 15;

/** Approve new reviews, hide unsuitable ones, restore hidden ones. */
@Component({
  selector: 'app-reviews-admin-page',
  imports: [RouterLink, LucideAngularModule, Pagination, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Reviews</h1>
          <p>{{ counts().pending }} to approve · {{ counts().published.toLocaleString('en-PK') }} published · {{ counts().hidden }} hidden</p>
        </div>
      </header>

      <div class="adm-toolbar">
        <div class="segmented" role="group" aria-label="Status">
          @for (s of statuses; track s.id) {
            <button type="button" [attr.aria-pressed]="status() === s.id" (click)="status.set(s.id); page.set(1)">{{ s.label }}</button>
          }
        </div>
        <label><span class="visually-hidden">Stars</span>
          <select class="select" [value]="stars()" (change)="stars.set(+$any($event.target).value); page.set(1)">
            <option value="0">Any rating</option>
            @for (n of [5, 4, 3, 2, 1]; track n) { <option [value]="n">{{ n }} ★</option> }
          </select>
        </label>
        <div class="search-field">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="rv-q">Search reviews</label>
          <input id="rv-q" class="input" type="search" placeholder="Search text, name or product" [value]="q()" (input)="q.set($any($event.target).value); page.set(1)" />
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th scope="col">Rating</th><th scope="col">Review</th><th scope="col">Product</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            @for (r of shown(); track r.id) {
              <tr>
                <td><app-rating [value]="r.rating" [showValue]="false" [size]="13" /></td>
                <td class="text"><strong class="clamp-1">{{ r.title }}</strong><span class="clamp-2">{{ r.text }}</span></td>
                <td class="prod">
                  @if (productOf(r.productId); as p) {
                    <a [routerLink]="['/admin/products', p.id]" class="clamp-1">{{ p.name }}</a>
                  } @else { <span class="t-note">The shop</span> }
                </td>
                <td class="who"><span class="clamp-1">{{ r.name }}</span><span class="sub">{{ r.city }} · {{ r.date }}{{ r.verified ? ' · verified' : '' }}</span></td>
                <td><span class="adm-pill" [class.is-warn]="r.status === 'pending'" [class.is-good]="r.status === 'published'" [class.is-bad]="r.status === 'hidden'">{{ label[r.status] }}</span></td>
                <td class="row-actions">
                  @if (r.status === 'pending') {
                    <button type="button" class="btn btn-primary btn-sm" (click)="act(r, 'approved')">Approve</button>
                  }
                  @if (r.status !== 'hidden') {
                    <button type="button" class="adm-icon-btn is-danger" (click)="act(r, 'hidden')" [attr.aria-label]="'Hide review by ' + r.name" title="Hide from the shop"><lucide-icon [img]="I.EyeOff" [size]="16" [strokeWidth]="2" /></button>
                  } @else {
                    <button type="button" class="btn btn-secondary btn-sm" (click)="act(r, 'reset')">Restore</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="adm-empty">No reviews match.</div></td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" label="Review pages" />
    </div>
  `,
  styles: `
    .text { max-width: 420px; }
    .text strong { display: block; font-weight: 600; }
    .text span { color: var(--ink-2); }
    .prod { max-width: 220px; }
    .prod a { color: var(--accent); font-weight: 560; }
    .who { max-width: 180px; }
    .who span { display: block; }
    .sub { font-size: 0.75rem; color: var(--ink-3); }
    .row-actions { white-space: nowrap; text-align: right; }
    .row-actions .btn { margin-right: 4px; }
  `,
})
export class ReviewsAdminPage {
  protected readonly I = I;
  private readonly reviews = inject(ReviewsService);
  private readonly catalog = inject(CatalogService);
  private readonly bag = inject(BagStore);
  protected readonly pageSize = PAGE;
  protected readonly label: Record<ReviewStatus, string> = { pending: 'To approve', published: 'Published', hidden: 'Hidden' };
  protected readonly statuses: { id: ReviewStatus | 'all'; label: string }[] = [
    { id: 'pending', label: 'To approve' },
    { id: 'published', label: 'Published' },
    { id: 'hidden', label: 'Hidden' },
    { id: 'all', label: 'All' },
  ];

  protected readonly status = signal<ReviewStatus | 'all'>(this.reviews.pendingCount() ? 'pending' : 'published');
  protected readonly stars = signal(0);
  protected readonly q = signal('');
  protected readonly page = signal(1);

  private readonly productMap = computed(() => new Map(this.catalog.allProducts().map((p) => [p.id, p])));
  productOf(id: string) {
    return this.productMap().get(id);
  }

  protected readonly counts = computed(() => {
    const all = this.reviews.moderated();
    return {
      pending: all.filter((r) => r.status === 'pending').length,
      published: all.filter((r) => r.status === 'published').length,
      hidden: all.filter((r) => r.status === 'hidden').length,
    };
  });

  protected readonly filtered = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    const map = this.productMap();
    return this.reviews
      .sort(this.reviews.moderated(), 'newest')
      .filter((r) => {
        const rr = r as ModeratedReview;
        if (this.status() !== 'all' && rr.status !== this.status()) return false;
        if (this.stars() && r.rating !== this.stars()) return false;
        const hay = `${r.title} ${r.text} ${r.name} ${map.get(r.productId)?.name ?? ''}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      }) as ModeratedReview[];
  });
  protected readonly shown = computed(() => this.filtered().slice((this.page() - 1) * PAGE, this.page() * PAGE));

  act(r: ModeratedReview, action: 'approved' | 'hidden' | 'reset'): void {
    this.reviews.moderate(r.id, action);
    this.bag.notify(action === 'approved' ? 'Review published' : action === 'hidden' ? 'Review hidden from the shop' : 'Review restored');
  }
}
