import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Product } from '../../core/models';
import { ReviewSort, ReviewsService } from '../../core/reviews.service';
import { I } from '../icons';
import { Pagination } from '../pagination';
import { RatingSummaryBlock, ReviewForm, ReviewItem } from './review-parts';

const PAGE = 5;

/** The reviews block on a product page: summary, filter, sort, list, pages, write one. */
@Component({
  selector: 'app-product-reviews',
  imports: [RouterLink, LucideAngularModule, Pagination, RatingSummaryBlock, ReviewItem, ReviewForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="reviews" aria-labelledby="reviews-title">
      <div class="head">
        <h2 id="reviews-title" class="t-title">Customer reviews</h2>
        <a routerLink="/reviews" class="btn btn-plain">All shop reviews <lucide-icon [img]="I.ArrowRight" [size]="16" [strokeWidth]="2" /></a>
      </div>

      <div class="layout">
        <aside class="side">
          <app-rating-summary [summary]="summary()" [(filter)]="stars" />
          @if (!writing()) {
            <div class="cta">
              <p class="t-small t-muted">Bought this? Tell others what you thought.</p>
              <button type="button" class="btn btn-secondary btn-block" (click)="writing.set(true)">
                <lucide-icon [img]="I.PenLine" [size]="18" [strokeWidth]="2" /> Write a review
              </button>
            </div>
          }
        </aside>

        <div class="main" #list>
          @if (writing()) {
            <div class="form-box">
              <app-review-form [productId]="product().id" [heading]="'Review ' + product().name" [cancellable]="true"
                (cancel)="writing.set(false)" (posted)="stars.set(0); page.set(1)" />
            </div>
          }

          @if (all().length) {
            <div class="bar">
              <p class="t-small t-muted" aria-live="polite">
                {{ filtered().length }} {{ filtered().length === 1 ? 'review' : 'reviews' }}{{ stars() ? ' with ' + stars() + ' stars' : '' }}
                @if (stars()) { · <button type="button" class="link" (click)="stars.set(0)">Show all</button> }
              </p>
              <label class="sort">
                <span class="visually-hidden">Sort reviews</span>
                <select class="select" [value]="sort()" (change)="setSort($any($event.target).value)">
                  <option value="newest">Newest first</option>
                  <option value="helpful">Most helpful</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
              </label>
            </div>
            <div class="items">
              @for (r of shown(); track r.id) { <app-review-item [review]="r" /> }
            </div>
            <app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" label="Review pages" />
          } @else if (reviews.loading()) {
            <p class="t-muted">Loading reviews…</p>
          } @else if (!writing()) {
            <div class="empty">
              <p><strong>No reviews yet.</strong> Be the first to review this gift.</p>
              <button type="button" class="btn btn-primary btn-sm" (click)="writing.set(true)">Write a review</button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    section { display: grid; gap: 28px; padding-top: calc(var(--section-gap) / 2); scroll-margin-top: calc(var(--header-h) + 16px); }
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .layout { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: clamp(28px, 5vw, 72px); align-items: start; }
    .side { display: grid; gap: 24px; position: sticky; top: calc(var(--header-h) + 16px); padding: 24px; border-radius: var(--radius-lg); background: var(--surface); }
    .side ::ng-deep app-rating-summary { grid-template-columns: 1fr; gap: 16px; }
    .cta { display: grid; gap: 10px; }
    .main { display: grid; gap: 8px; min-width: 0; scroll-margin-top: calc(var(--header-h) + 16px); }
    .form-box { padding: 24px; border-radius: var(--radius-lg); background: var(--surface); margin-bottom: 16px; }
    .form-box ::ng-deep .input, .form-box ::ng-deep .textarea, .form-box ::ng-deep .select { background: var(--ground); }
    .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
    .sort .select { min-height: 40px; width: auto; }
    .link { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    .items { display: grid; }
    .items > * + * { border-top: 1px solid var(--surface-2); }
    app-pagination { margin-top: 16px; }
    .empty { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 20px; border-radius: var(--radius); background: var(--surface); }
    @media (max-width: 900px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .side { position: static; }
    }
  `,
})
export class ProductReviews {
  protected readonly I = I;
  protected readonly reviews = inject(ReviewsService);
  private readonly list = inject(ElementRef);
  readonly product = input.required<Product>();

  protected readonly pageSize = PAGE;
  protected readonly stars = signal(0);
  protected readonly sort = signal<ReviewSort>('newest');
  protected readonly page = signal(1);
  protected readonly writing = signal(false);

  protected readonly all = computed(() => this.reviews.forProduct(this.product().id));
  protected readonly summary = computed(() => this.reviews.summary(this.all()));
  protected readonly filtered = computed(() =>
    this.reviews.sort(this.all().filter((r) => !this.stars() || r.rating === this.stars()), this.sort()),
  );
  protected readonly shown = computed(() => this.filtered().slice((this.page() - 1) * PAGE, this.page() * PAGE));

  constructor() {
    // a new product or filter starts at page 1
    effect(() => {
      this.product();
      this.stars();
      this.page.set(1);
      this.writing.set(false);
    });
    // turning a page brings the list's top into view
    let first = true;
    effect(() => {
      this.page();
      if (first) {
        first = false;
        return;
      }
      const el = (this.list.nativeElement as HTMLElement).querySelector('.main');
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  setSort(s: ReviewSort): void {
    this.sort.set(s);
    this.page.set(1);
  }
}
