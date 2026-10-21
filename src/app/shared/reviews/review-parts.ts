import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Product, Review } from '../../core/models';
import { RatingSummary, ReviewsService } from '../../core/reviews.service';
import { I } from '../icons';
import { Rating } from '../rating';
import { StarInput } from './star-input';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Big average, star bars per score; clicking a bar filters to that score. */
@Component({
  selector: 'app-rating-summary',
  imports: [Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avg">
      <strong class="t-num">{{ summary().count ? summary().average.toFixed(1) : '–' }}</strong>
      <app-rating [value]="summary().average" [showValue]="false" [size]="20" />
      <span class="t-small t-muted">{{ summary().count }} {{ summary().count === 1 ? 'review' : 'reviews' }}</span>
    </div>
    <ul class="bars" role="list" aria-label="Filter by stars">
      @for (n of [5, 4, 3, 2, 1]; track n) {
        <li>
          <button type="button" class="bar" [attr.aria-pressed]="filter() === n" (click)="filter.set(filter() === n ? 0 : n)"
            [attr.aria-label]="n + ' stars: ' + summary().counts[n - 1] + ' reviews'" [disabled]="!summary().counts[n - 1]">
            <span class="lbl t-num">{{ n }}★</span>
            <span class="track"><span [style.width.%]="pct(n)"></span></span>
            <span class="n t-num">{{ summary().counts[n - 1] }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 28px; align-items: center; }
    .avg { display: grid; justify-items: center; gap: 6px; padding-right: 8px; }
    .avg strong { font-size: 3.5rem; line-height: 1; font-weight: 700; letter-spacing: -0.04em; }
    .bars { display: grid; gap: 2px; list-style: none; margin: 0; padding: 0; }
    .bar { width: 100%; display: grid; grid-template-columns: 34px 1fr 40px; align-items: center; gap: 10px; padding: 5px 8px; border-radius: 8px; font-size: var(--text-small); }
    .bar:hover:not(:disabled) { background: var(--surface-2); }
    .bar[aria-pressed='true'] { background: var(--field); }
    .bar:disabled { opacity: 0.45; cursor: default; }
    .lbl { font-weight: 600; text-align: left; }
    .track { height: 8px; border-radius: 4px; background: var(--surface-3); overflow: hidden; }
    .track span { display: block; height: 100%; background: #f5a623; border-radius: 4px; }
    .n { text-align: right; color: var(--ink-3); }
    @media (max-width: 480px) { :host { grid-template-columns: 1fr; gap: 16px; } }
  `,
})
export class RatingSummaryBlock {
  readonly summary = input.required<RatingSummary>();
  /** 0 = all */
  readonly filter = model(0);
  pct(n: number): number {
    const s = this.summary();
    return s.count ? (s.counts[n - 1] / s.count) * 100 : 0;
  }
}

/** One review: stars, title, words, who and when, verified, helpful. */
@Component({
  selector: 'app-review-item',
  imports: [RouterLink, LucideAngularModule, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = review();
    <article [class.is-mine]="r.mine">
      <header>
        <span class="avatar" aria-hidden="true">{{ r.name.charAt(0) }}</span>
        <div class="who">
          <strong class="clamp-1">{{ r.name }}</strong>
          <span class="t-small t-muted">{{ r.city }} · {{ date() }}</span>
        </div>
        @if (r.mine) {
          <span class="tag pending">Awaiting approval</span>
        } @else if (r.verified) {
          <span class="tag"><lucide-icon [img]="I.CircleCheck" [size]="14" [strokeWidth]="2.2" /> Verified purchase</span>
        }
      </header>
      <app-rating [value]="r.rating" [showValue]="false" [size]="16" />
      @if (product(); as p) {
        <a class="about" [routerLink]="['/product', p.slug]">
          <img [src]="p.images[0]" alt="" width="40" height="40" /><span class="clamp-1">{{ p.name }}</span>
        </a>
      }
      <h3 class="title clamp-2">{{ r.title }}</h3>
      <p class="text" [class.clamp-3]="!expanded() && long()">{{ r.text }}</p>
      @if (long()) {
        <button type="button" class="more" (click)="expanded.set(!expanded())">{{ expanded() ? 'Show less' : 'Read more' }}</button>
      }
      <footer>
        <button type="button" class="helpful" [attr.aria-pressed]="voted()" [disabled]="voted() || r.mine" (click)="reviews.markHelpful(r.id)">
          <lucide-icon [img]="I.Heart" [size]="14" [strokeWidth]="2" /> Helpful{{ r.helpful ? ' · ' + r.helpful : '' }}
        </button>
      </footer>
    </article>
  `,
  styles: `
    article { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 22px 0; }
    article.is-mine { padding: 22px; border-radius: var(--radius); background: var(--field); }
    header { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .avatar { width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--field); color: var(--field-ink); font-weight: 700; }
    .is-mine .avatar { background: var(--ground); }
    .who { display: grid; min-width: 0; flex: 1; }
    .who strong { font-weight: 620; }
    .tag { display: inline-flex; align-items: center; gap: 4px; flex: none; font-size: 0.75rem; font-weight: 600; color: var(--positive); }
    .tag.pending { color: var(--accent); padding: 3px 10px; border-radius: var(--radius-pill); background: var(--ground); }
    .about { display: inline-flex; align-items: center; gap: 10px; max-width: 100%; padding: 4px 12px 4px 4px; border-radius: var(--radius-pill); background: var(--surface); font-size: var(--text-small); font-weight: 560; justify-self: start; }
    .about:hover { background: var(--surface-2); }
    .about img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex: none; }
    .title { font-size: var(--text-body); font-weight: 650; }
    .text { color: var(--ink-2); line-height: 1.6; }
    .more { justify-self: start; color: var(--accent); font-weight: 600; font-size: var(--text-small); }
    footer { display: flex; }
    .helpful { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radius-pill); background: var(--surface-2); font-size: 0.8125rem; font-weight: 560; }
    .helpful:hover:not(:disabled) { background: var(--surface-3); }
    .helpful[aria-pressed='true'] { background: var(--field); color: var(--field-ink); }
    .helpful[aria-pressed='true'] ::ng-deep svg { fill: currentColor; }
    .helpful:disabled { cursor: default; }
  `,
})
export class ReviewItem {
  protected readonly I = I;
  protected readonly reviews = inject(ReviewsService);
  readonly review = input.required<Review>();
  /** shown as a link when listing reviews from many products */
  readonly product = input<Product | undefined>();
  protected readonly expanded = signal(false);
  protected readonly date = computed(() => fmtDate(this.review().date));
  protected readonly long = computed(() => this.review().text.length > 220);
  protected readonly voted = computed(() => this.reviews.helpfulIds().includes(this.review().id));
}

/** Write a review: stars first, then a title and words, name and city. */
@Component({
  selector: 'app-review-form',
  imports: [LucideAngularModule, StarInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (done()) {
      <div class="done" role="status">
        <lucide-icon [img]="I.CircleCheck" [size]="28" [strokeWidth]="1.8" />
        <div>
          <strong>Thank you for your review!</strong>
          <p class="t-small t-muted">You can see it now; everyone else will after we check it, usually within a day.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" (click)="done.set(false)">Write another</button>
      </div>
    } @else {
      <form (submit)="submit($event)" novalidate>
        <h3 class="t-headline">{{ heading() }}</h3>
        @if (products().length) {
          <div class="field">
            <label for="rv-product-{{ uid }}">Which gift?</label>
            <select id="rv-product-{{ uid }}" name="product" class="select" [value]="chosen()" (change)="chosen.set($any($event.target).value)">
              <option value="">The shop in general</option>
              @for (p of products(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
            </select>
          </div>
        }
        <div class="field">
          <span class="field-label" id="rv-stars-{{ uid }}">Your rating</span>
          <app-star-input [(value)]="stars" [name]="'stars-' + uid" />
          @if (tried() && !stars()) { <span class="field-hint is-error">Choose from 1 to 5 stars.</span> }
        </div>
        <div class="field">
          <label for="rv-title-{{ uid }}">Title</label>
          <input id="rv-title-{{ uid }}" name="title" class="input" required maxlength="80" placeholder="Sum it up in a few words" />
        </div>
        <div class="field">
          <label for="rv-text-{{ uid }}">Your review</label>
          <textarea id="rv-text-{{ uid }}" name="text" class="textarea" rows="4" required minlength="20" maxlength="1000"
            placeholder="How was the gift, the wrapping and the delivery?" (input)="len.set($any($event.target).value.length)"></textarea>
          <span class="field-hint t-num">{{ len() }} / 1000 · at least 20 characters</span>
        </div>
        <div class="two">
          <div class="field"><label for="rv-name-{{ uid }}">Name</label><input id="rv-name-{{ uid }}" name="name" class="input" required maxlength="40" autocomplete="given-name" placeholder="Shown as “Sara A.”" /></div>
          <div class="field"><label for="rv-city-{{ uid }}">City</label><input id="rv-city-{{ uid }}" name="city" class="input" maxlength="30" value="Karachi" /></div>
        </div>
        @if (error()) { <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p> }
        <div class="row">
          <button class="btn btn-primary">Post review</button>
          @if (cancellable()) { <button type="button" class="btn btn-plain" (click)="cancel.emit()">Cancel</button> }
        </div>
      </form>
    }
  `,
  styles: `
    form { display: grid; gap: 16px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .row { display: flex; gap: 10px; align-items: center; }
    .input:user-invalid, .textarea:user-invalid { border-color: var(--negative); }
    .done { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 20px; border-radius: var(--radius); background: var(--field); color: var(--field-ink); }
    .done lucide-icon { color: var(--positive); }
    .done div { flex: 1; min-width: 200px; }
    @media (max-width: 480px) { .two { grid-template-columns: 1fr; } }
  `,
})
export class ReviewForm {
  protected readonly I = I;
  private readonly reviews = inject(ReviewsService);
  protected readonly uid = Math.random().toString(36).slice(2, 7);

  /** fixed product (product page); leave empty to show a picker */
  readonly productId = input('');
  /** products to choose from (reviews page) */
  readonly products = input<Product[]>([]);
  readonly heading = input('Write a review');
  readonly cancellable = input(false);
  readonly cancel = output<void>();
  readonly posted = output<void>();

  protected readonly stars = signal(0);
  protected readonly chosen = signal('');
  protected readonly len = signal(0);
  protected readonly tried = signal(false);
  protected readonly error = signal('');
  protected readonly done = signal(false);

  submit(e: SubmitEvent): void {
    e.preventDefault();
    this.tried.set(true);
    const form = e.target as HTMLFormElement;
    if (!this.stars() || !form.checkValidity()) {
      this.error.set(!this.stars() ? 'Please choose a star rating.' : 'Please add a title, at least 20 characters of review, and your name.');
      form.reportValidity();
      return;
    }
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const [first, ...rest] = f['name'].trim().split(/\s+/);
    this.reviews.add({
      productId: this.productId() || this.chosen(),
      rating: this.stars(),
      title: f['title'].trim(),
      text: f['text'].trim(),
      name: rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first,
      city: (f['city'] || 'Karachi').trim(),
    });
    form.reset();
    this.stars.set(0);
    this.tried.set(false);
    this.error.set('');
    this.len.set(0);
    this.done.set(true);
    this.posted.emit();
  }
}
