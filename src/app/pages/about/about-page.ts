import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND, img } from '../../core/catalog';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { GiftTag } from '../../shared/gift-tag';
import { I } from '../../shared/icons';
import { RevealDirective } from '../../shared/reveal.directive';
import { WhatsappIcon } from '../../shared/whatsapp-icon';

/** What people told the research about gifting today, most cited first. */
const PROBLEMS = [
  { title: 'There is never enough time', text: 'Between work, study and family, finding the right gift and getting it there is one more job on the list.' },
  { title: 'The idea is online, the shop isn’t', text: 'You see the perfect basket on Instagram or Pinterest, and nobody nearby can make it.' },
  { title: 'Every shop sells the same box', text: 'Most gift shops here sell from a fixed catalogue, with little room to make a gift your own.' },
  { title: 'Far from the people you love', text: 'More than half the people asked live in a different city or country from the people they buy for.' },
];

const PARTS = [
  { title: 'The basket', text: 'Kraft weave, gift box or keepsake hamper' },
  { title: 'The wrap', text: 'Blush tissue, kraft, rose satin or velvet wine' },
  { title: 'The ribbon', text: 'Your colour, tied by hand' },
  { title: 'The treats', text: 'Chocolates, mithai, perfumes and toys' },
  { title: 'The note', text: 'Your words, handwritten on our “For you” tag' },
];

const PROMISES = [
  { icon: 'Truck', title: 'Same day in Karachi', text: 'Order before 2 pm and it arrives today, in a time slot that suits you. Other cities take 2–4 days.' },
  { icon: 'Wallet', title: 'Cash on delivery', text: 'Pay when the gift arrives. JazzCash, Easypaisa, card and bank transfer work too.' },
  { icon: 'PenLine', title: 'A note in your words', text: 'Every gift can carry a handwritten message, so it says what you would say in person.' },
  { icon: 'Gift', title: 'The basket you built', text: 'We pack the wrap, ribbon and treats you chose, the way you saw them on screen.' },
] as const;

/** An Unsplash photo at two widths, so phones don't fetch the desktop copy. */
const photo = (id: string) => ({ src: img(id, 800), srcset: `${img(id, 640)} 640w, ${img(id, 1600)} 1600w` });

/**
 * The story behind the shop, from Shazra Akbar's research: why it exists,
 * the two ways to shop, and what every order can count on.
 */
@Component({
  selector: 'app-about-page',
  imports: [RouterLink, LucideAngularModule, Breadcrumbs, GiftTag, RevealDirective, WhatsappIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'About' }]" />

      <section class="hero" aria-labelledby="about-title">
        <div class="hero-copy">
          <h1 id="about-title" class="t-display">Every gift tells a story</h1>
          <p class="t-lead">
            {{ brand.name }} is a Karachi gift shop for presents that feel personal: chosen for one person,
            wrapped by hand, and carried to their door with a note in your own words.
          </p>
          <div class="cta">
            <a routerLink="/build-a-basket" class="btn btn-primary btn-lg">Build a basket</a>
            <a routerLink="/shop" class="btn btn-secondary btn-lg">Shop ready-made</a>
          </div>
        </div>
        <figure class="hero-media">
          <img [src]="hero.src" [attr.srcset]="hero.srcset" sizes="(max-width: 860px) 100vw, 640px"
               alt="Pink roses heaped in a wicker basket on a white cloth"
               width="800" height="800" fetchpriority="high" />
          <app-gift-tag class="hero-tag" size="lg" note="Personalized with love, delivered with care." [from]="brand.name" ribbon="#7a0f3d" />
        </figure>
      </section>

      <section class="story" appReveal aria-labelledby="story-title">
        <div class="story-top">
          <div class="story-copy" data-reveal>
            <h2 id="story-title" class="t-title">Where the idea came from</h2>
            <p>
              {{ brand.name }} began as Shazra Akbar’s MMS research at Iqra University Karachi. She asked people
              how they give gifts today, and talked to people who run online shops, brands and deliveries.
              The same four problems kept coming up.
            </p>
            <p>
              So the shop is built around them: one place to choose the whole gift, make it personal,
              and have it delivered, for anyone who can’t be there to hand it over themselves.
            </p>
            <!-- TODO(owner): add a photo of Shazra and two or three lines in her own words about why she started. -->
            <!-- TODO(owner): add when the shop opened or took its first order; no date is given in the brief. -->
            <p class="credit">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M12 20.5C9.2 18 3.5 13.6 3.5 8.9 3.5 6.3 5.5 4.5 7.8 4.5c1.7 0 3.2.9 4.2 2.4 1-1.5 2.5-2.4 4.2-2.4 2.3 0 4.3 1.8 4.3 4.4 0 4.7-5.7 9.1-8.5 11.6Z" />
              </svg>
              <span class="by">An original idea by</span>
              <span class="name">Shazra Akbar</span>
            </p>
          </div>
          <figure class="frame story-photo" data-reveal>
            <img [src]="wrapping.src" [attr.srcset]="wrapping.srcset" sizes="auto, (max-width: 860px) 100vw, 640px"
                 alt="Hands wrapping gifts in brown kraft paper, one tied with a red satin ribbon" width="1200" height="900" loading="lazy" />
          </figure>
        </div>
        <ol class="problems" role="list">
          @for (p of problems; track p.title) {
            <li data-reveal>
              <strong>{{ p.title }}</strong>
              <span>{{ p.text }}</span>
            </li>
          }
        </ol>
      </section>

      <section class="ways decor-gifts" appReveal aria-labelledby="ways-title">
        <h2 id="ways-title" class="t-title" data-reveal>Two ways to shop</h2>
        <div class="split">
          <article class="ready" data-reveal>
            <div class="frame ready-photo">
              <img [src]="ready.src" [attr.srcset]="ready.srcset" sizes="auto, (max-width: 860px) 100vw, 700px"
                   alt="A woven gift basket packed with a candle and a book, tied with a cream satin ribbon" width="1200" height="900" loading="lazy" />
            </div>
            <h3 class="t-headline">Ready-made gifts</h3>
            <p>
              Hampers, flowers, cakes, mithai and chocolates, put together for birthdays, Eid, anniversaries,
              new babies and thank-yous. Wrapped and ready to go out today.
            </p>
            <a routerLink="/shop" class="btn btn-plain">
              Shop all gifts <lucide-icon [img]="I.ArrowRight" [size]="18" [strokeWidth]="2" />
            </a>
          </article>
          <article class="own" data-reveal>
            <h3 class="t-headline">Build your own basket</h3>
            <p>Choose every part of it, and watch the price as you go.</p>
            <ol class="parts">
              @for (p of parts; track p.title) {
                <li><strong>{{ p.title }}</strong><span>{{ p.text }}</span></li>
              }
            </ol>
            <app-gift-tag to="Ammi" note="Happy birthday. Wish I could be there today." from="Sara" ribbon="#d86b8a" />
            <a routerLink="/build-a-basket" class="btn btn-primary btn-lg">Start building</a>
          </article>
        </div>
      </section>

      <section class="promises" appReveal aria-labelledby="promises-title">
        <h2 id="promises-title" class="t-title" data-reveal>What every order gets</h2>
        <!-- TODO(owner): say who packs the baskets and where (team, studio area); BRAND.address is only "Karachi, Pakistan". -->
        <ul class="promise-list" role="list">
          @for (p of promises; track p.title) {
            <li data-reveal>
              <span class="p-icon"><lucide-icon [img]="I[p.icon]" [size]="22" [strokeWidth]="1.8" /></span>
              <h3 class="t-headline">{{ p.title }}</h3>
              <p>{{ p.text }}</p>
            </li>
          }
        </ul>
      </section>

      <!-- TODO(owner): once real reviews come in, add one customer's words here (reviews.json is sample data for now). -->
      <section class="close decor-gifts decor-from-left" appReveal aria-labelledby="close-title">
        <h2 id="close-title" class="t-title" data-reveal>Make every gift personal</h2>
        <p data-reveal>
          The best gifts aren’t measured by their price. They’re remembered by the love behind them.
          Not sure where to start? Send us a picture or an idea and we’ll help.
        </p>
        <div class="cta" data-reveal>
          <a routerLink="/build-a-basket" class="btn btn-on-dark btn-lg">Build a basket</a>
          <a class="btn btn-lg wa" [href]="waLink" target="_blank" rel="noopener">
            <app-whatsapp-icon [size]="20" /> Ask on WhatsApp
          </a>
        </div>
      </section>
    </main>
  `,
  styles: `
    .page { display: grid; gap: clamp(72px, 9vw, 136px); padding-top: 32px; padding-bottom: clamp(16px, 3vw, 32px); }
    .page > app-breadcrumbs { margin-bottom: calc(-1 * clamp(56px, 8vw, 120px)); }
    .cta { display: flex; flex-wrap: wrap; gap: 12px; }

    /* hero */
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 80px); align-items: center; }
    .hero-copy { display: grid; gap: 24px; justify-items: start; }
    .hero h1 { max-width: 9ch; }
    .hero-media { position: relative; margin: 0; padding-bottom: 40px; }
    .hero-media img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-lg); background: var(--surface-2); }
    .hero-tag { position: absolute; left: clamp(-40px, -3vw, 0px); bottom: 0; }

    /* a photo in a rounded frame that leans in a little on hover */
    .frame { margin: 0; overflow: hidden; border-radius: var(--radius); background: var(--surface-2); }
    .frame img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow) var(--ease-out); }
    .frame:hover img { transform: scale(1.04); }

    /* story */
    .story { display: grid; gap: clamp(32px, 4vw, 56px); }
    .story-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 88px); align-items: center; }
    .story-photo { aspect-ratio: 4 / 3; border-radius: var(--radius-lg); }
    .story-photo img { object-position: 50% 62%; }
    .story-copy { display: grid; gap: 16px; }
    .story-copy p { max-width: 34em; color: var(--ink-2); text-wrap: pretty; }
    .story-copy .credit { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin-top: 8px; color: var(--rose); }
    .by { font-size: var(--text-small); color: var(--ink-3); }
    .name { font-family: var(--font-brand); font-size: 1.25rem; font-weight: 500; letter-spacing: 0.06em; line-height: 1; color: var(--accent); }
    .problems { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; counter-reset: problem; }
    .problems li {
      counter-increment: problem; display: grid; gap: 6px; align-content: start;
      padding: 24px; border-radius: var(--radius); background: var(--surface);
    }
    .problems li::before { content: counter(problem); font-size: var(--text-small); font-weight: 650; color: var(--accent); font-variant-numeric: tabular-nums; }
    .problems strong { font-size: var(--text-body); font-weight: 640; line-height: 1.3; }
    .problems span { font-size: 0.9375rem; color: var(--ink-2); }

    /* two ways, on a blush field */
    .ways {
      display: grid; gap: 48px; padding: clamp(32px, 6vw, 88px) clamp(20px, 5vw, 72px);
      border-radius: var(--radius-lg); background: var(--field); color: var(--field-ink);
    }
    .split { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 88px); align-items: start; }
    .ready { display: grid; gap: 12px; }
    .ready-photo { aspect-ratio: 4 / 3; margin-bottom: 12px; background: var(--ground); }
    .ready p, .own > p { max-width: 30em; opacity: 0.85; }
    .ready .btn-plain { justify-self: start; color: var(--field-ink); font-weight: 650; }
    .own { display: grid; gap: 16px; justify-items: start; }
    .parts { display: grid; gap: 4px; margin: 4px 0 12px; padding-left: 1.4em; }
    .parts li { padding: 8px 0 8px 6px; }
    .parts li::marker { font-weight: 650; }
    .parts strong { display: block; font-weight: 640; }
    .parts span { font-size: var(--text-small); opacity: 0.8; }
    .own .btn { margin-top: 20px; }

    /* promises */
    .promises { display: grid; gap: 32px; }
    .promise-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .promise-list li { display: grid; gap: 8px; align-content: start; padding: 24px; border-radius: var(--radius); background: var(--surface); }
    .promise-list p { font-size: 0.9375rem; color: var(--ink-2); }
    .p-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: var(--ground); color: var(--accent); margin-bottom: 8px; }

    /* close */
    .close {
      display: grid; gap: 20px; justify-items: center; text-align: center;
      padding: clamp(48px, 7vw, 96px) clamp(20px, 5vw, 72px);
      border-radius: var(--radius-lg); background: var(--field-deep); color: var(--field-deep-ink);
    }
    .close p { max-width: 34em; opacity: 0.88; text-wrap: pretty; }
    .close .cta { justify-content: center; margin-top: 8px; }
    .wa { background: #25d366; color: #fff; }
    .wa:hover { background: #1ebe5e; }

    @media (max-width: 1000px) {
      .promise-list { grid-template-columns: 1fr 1fr; }
      .story-top, .problems { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 860px) {
      .hero, .split, .story-top { grid-template-columns: 1fr; }
      .hero-tag { left: 0; }
    }
    @media (max-width: 520px) {
      .problems, .promise-list { grid-template-columns: 1fr; }
      .cta .btn { flex: 1 1 100%; }
    }
  `,
})
export class AboutPage {
  protected readonly I = I;
  protected readonly brand = BRAND;
  protected readonly problems = PROBLEMS;
  protected readonly parts = PARTS;
  protected readonly promises = PROMISES;
  protected readonly hero = photo('1503652601-557d07733ddc');
  protected readonly ready = photo('1769286145156-70a40fff80ec');
  protected readonly wrapping = photo('1764845357195-06f744d1c972');
  protected readonly waLink = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Hi! Can you help me with a gift idea?')}`;

  constructor() {
    inject(SeoService).set({
      title: 'About',
      description: `${BRAND.name} is a Karachi gift shop: ready-made gifts or a basket you build yourself, with a handwritten note, same-day delivery and cash on delivery.`,
      path: '/about',
      pageType: 'AboutPage',
    });
  }
}
