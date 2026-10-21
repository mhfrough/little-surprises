import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND, PIC, img } from '../core/catalog';
import { ReviewsService } from '../core/reviews.service';
import { Rating } from '../shared/rating';
import { TiktokIcon } from '../shared/tiktok-icon';
import { CatalogService } from '../core/catalog.service';
import { BagStore } from '../core/stores';
import { ReadyBasketCard } from '../shared/cards/ready-basket-card';
import { ReviewCard } from '../shared/cards/review-card';
import { I } from '../shared/icons';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-ready-baskets-section',
  imports: [ReadyBasketCard, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section container" aria-labelledby="ready-title">
      <div class="section-head" appReveal>
        <div>
          <h2 id="ready-title" class="t-title" data-reveal>Ready-made baskets</h2>
          <p class="t-muted" data-reveal>Put together, wrapped and ready to go out today. Or build one like it.</p>
        </div>
      </div>
      <div class="list">
        @for (b of baskets(); track b.id; let odd = $odd) {
          <app-ready-basket-card appReveal [basket]="b" [reversed]="odd" (add)="bag.add($event)" />
        }
      </div>
    </section>
  `,
  styles: `.list { display: grid; gap: clamp(64px, 8vw, 120px); }`,
})
export class ReadyBasketsSection {
  protected readonly bag = inject(BagStore);
  private readonly catalog = inject(CatalogService);
  protected readonly baskets = computed(() => this.catalog.inCategory('hampers').filter((p) => p.inStock).slice(0, 3));
}

@Component({
  selector: 'app-corporate-section',
  imports: [RouterLink, LucideAngularModule, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container" aria-labelledby="corp-title">
      <div class="panel" appReveal>
        <div class="copy">
          <h2 id="corp-title" class="t-title" data-reveal>Corporate gifting</h2>
          <p class="lead" data-reveal>
            Client thank-yous, team Eid boxes, welcome kits. Your logo on the tag, one invoice, delivered to every address.
          </p>
          <ul role="list" data-reveal>
            <li><lucide-icon [img]="I.Check" [size]="18" [strokeWidth]="2.4" /> No minimum order</li>
            <li><lucide-icon [img]="I.Check" [size]="18" [strokeWidth]="2.4" /> Branded tags, cards and ribbon</li>
            <li><lucide-icon [img]="I.Check" [size]="18" [strokeWidth]="2.4" /> Delivery to many addresses from one list</li>
          </ul>
          <a routerLink="/contact" class="btn btn-on-dark btn-lg" data-reveal>Ask for a quote</a>
        </div>
        <img data-reveal [src]="photo" alt="Black gift boxes tied with gold satin ribbon" width="1000" height="1000" loading="lazy" />
      </div>
    </section>
  `,
  styles: `
    .panel {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--field-deep);
      color: var(--field-deep-ink);
      margin-block: calc(var(--section-gap) / 2);
    }
    .copy { display: grid; gap: 22px; align-content: center; justify-items: start; padding: clamp(32px, 6vw, 88px); }
    .lead { font-size: 1.1875rem; line-height: 1.5; opacity: 0.88; max-width: 28em; }
    ul { display: grid; gap: 10px; }
    li { display: flex; gap: 10px; align-items: center; }
    li lucide-icon { color: var(--blush); }
    img { width: 100%; height: 100%; min-height: 360px; object-fit: cover; }
    @media (max-width: 860px) { .panel { grid-template-columns: 1fr; } img { order: -1; aspect-ratio: 16 / 10; min-height: 0; } }
  `,
})
export class CorporateSection {
  protected readonly I = I;
  protected readonly photo = img(PIC.giftHands, 1000);
}

@Component({
  selector: 'app-reviews-section',
  imports: [RouterLink, ReviewCard, Rating, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section container" appReveal aria-labelledby="rev-title">
      <div class="section-head">
        <div>
          <h2 id="rev-title" class="t-title" data-reveal>What people are saying</h2>
          <p class="t-muted rated" data-reveal>
            <app-rating [value]="summary().average" [showValue]="false" [size]="16" />
            Rated {{ summary().average.toFixed(1) }} out of 5 from {{ summary().count.toLocaleString('en-PK') }} reviews
          </p>
        </div>
        <a routerLink="/reviews" class="btn btn-secondary" data-reveal>Read all reviews</a>
      </div>
      <ul class="rail" role="list" data-reveal>
        @for (r of highlights(); track r.id) {
          <li><app-review-card [review]="r" /></li>
        }
      </ul>
    </section>
  `,
  styles: `
    .rated { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .rail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    @media (max-width: 1000px) {
      .rail { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: min(80vw, 340px); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
      .rail li { scroll-snap-align: start; }
    }
  `,
})
export class ReviewsSection {
  private readonly reviews = inject(ReviewsService);
  protected readonly summary = computed(() => this.reviews.summary(this.reviews.all()));
  /** recent, five-star, with something to say */
  protected readonly highlights = computed(() =>
    this.reviews.sort(this.reviews.all().filter((r) => r.rating === 5 && r.text.length > 80 && !r.mine), 'newest').slice(0, 4),
  );
}

/** Instagram + TikTok. The pictures are from the shop, captioned as such, not fake posts. */
@Component({
  selector: 'app-social-section',
  imports: [LucideAngularModule, TiktokIcon, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section container social" appReveal aria-labelledby="social-title">
      <div class="copy">
        <h2 id="social-title" class="t-title" data-reveal>Unwrapped, every week</h2>
        <p class="t-muted" data-reveal>New hampers, behind-the-scenes wrapping and Karachi deliveries, on Instagram and TikTok.</p>
        <div class="links" data-reveal>
          <a class="btn btn-primary" [href]="brand.instagram.url" target="_blank" rel="noopener">
            <lucide-icon [img]="I.Instagram" [size]="18" [strokeWidth]="2" /> {{ brand.instagram.handle }}
          </a>
          <a class="btn btn-secondary" [href]="brand.tiktok.url" target="_blank" rel="noopener">
            <app-tiktok-icon [size]="18" /> {{ brand.tiktok.handle }}
          </a>
        </div>
      </div>
      <ul class="grid" role="list" data-reveal>
        @for (p of photos(); track p.id) {
          <li><img [src]="p.images[0]" [alt]="p.name" width="640" height="640" loading="lazy" /></li>
        }
      </ul>
    </section>
  `,
  styles: `
    .social { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: clamp(32px, 5vw, 80px); align-items: center; }
    .copy { display: grid; gap: 16px; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 14px; background: var(--surface-2); }
    @media (max-width: 860px) { .social { grid-template-columns: 1fr; } }
  `,
})
export class SocialSection {
  protected readonly I = I;
  protected readonly brand = BRAND;
  private readonly catalog = inject(CatalogService);
  protected readonly photos = computed(() =>
    ['hampers', 'flowers', 'chocolates', 'cakes', 'mithai', 'perfumes']
      .map((c) => this.catalog.inCategory(c).find((p) => p.inStock))
      .filter((p) => !!p),
  );
}

@Component({
  selector: 'app-newsletter-section',
  imports: [RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container" appReveal aria-labelledby="news-title">
      <div class="panel">
        <div>
          <h2 id="news-title" class="t-title" data-reveal>Little notes, now and then</h2>
          <p class="t-muted" data-reveal>New baskets, occasion reminders before the day, and the odd members-only treat.</p>
        </div>
        <form class="form" data-reveal (submit)="$event.preventDefault(); done.set(true)">
          @if (!done()) {
            <label class="visually-hidden" for="news-email">Email address</label>
            <input id="news-email" class="input" type="email" required placeholder="you@example.com" autocomplete="email" />
            <button class="btn btn-primary">Subscribe</button>
          } @else {
            <p class="t-strong">Thank you. The first note is on its way.</p>
          }
        </form>
      </div>
    </section>
  `,
  styles: `
    .panel {
      display: grid; grid-template-columns: 1fr minmax(280px, 460px); gap: 32px; align-items: center;
      padding: clamp(32px, 5vw, 64px); border-radius: var(--radius-lg); background: var(--surface);
    }
    .panel > div { display: grid; gap: 12px; }
    .form { display: flex; gap: 10px; }
    .input { border-radius: var(--radius-pill); background: var(--ground); }
    @media (max-width: 760px) { .panel { grid-template-columns: 1fr; } .form { flex-direction: column; } }
  `,
})
export class NewsletterSection {
  protected readonly done = signal(false);
}
