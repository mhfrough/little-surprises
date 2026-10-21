import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PIC, img } from '../core/catalog';
import { GiftTag } from '../shared/gift-tag';
import { I } from '../shared/icons';

interface Slide {
  id: string;
  title: string;
  lead: string;
  image: string;
  srcset: string;
  alt: string;
  primary: { label: string; link: string };
  secondary?: { label: string; link: string };
  /** where the subject sits, so the crop keeps it */
  focus?: string;
}

const pic = (id: string, alt: string) => ({
  image: img(id, 1600),
  srcset: [960, 1600, 2400].map((w) => `${img(id, w)} ${w}w`).join(', '),
  alt,
});

const SLIDES: Slide[] = [
  {
    id: 'wrapped',
    title: 'Wrapped by hand, for you.',
    lead: 'Pick a ready-made hamper, or build your own: the basket, the wrap, the ribbon, every treat and a handwritten note.',
    ...pic(PIC.giftKraft, 'A kraft wicker basket of small gifts tied with pink ribbon'),
    primary: { label: 'Build a basket', link: '/build-a-basket' },
    secondary: { label: 'Shop all gifts', link: '/shop' },
    focus: '70% 50%',
  },
  {
    id: 'hampers',
    title: 'Hampers for every Eid',
    lead: 'Belgian chocolate, mithai and keepsake baskets, ready to go out today.',
    ...pic(PIC.hamper, 'A wicker hamper of chocolates wrapped in cellophane with a gold bow'),
    primary: { label: 'Shop hampers', link: '/category/hampers' },
    secondary: { label: 'Mithai & sweets', link: '/category/mithai' },
    focus: '50% 40%',
  },
  {
    id: 'same-day',
    title: 'Same-day across Karachi',
    lead: 'Order before 2 pm and it arrives today, from Clifton to Gulshan. Cash on delivery.',
    ...pic(PIC.giftRed, 'Red wrapped gift boxes tied with white string'),
    primary: { label: 'Shop for today', link: '/shop' },
    secondary: { label: 'Delivery details', link: '/policies/delivery' },
  },
  {
    id: 'corporate',
    title: 'Corporate gifting, no minimum',
    lead: 'Your logo on the tag, one invoice, delivered to every address on your list.',
    ...pic(PIC.giftHands, 'Black gift boxes tied with gold satin ribbon'),
    primary: { label: 'Ask for a quote', link: '/contact' },
  },
];

const INTERVAL = 6500;

/** Full-screen hero carousel: autoplay that pauses for people, swipe, keys, dots. */
@Component({
  selector: 'app-hero-slider',
  imports: [RouterLink, LucideAngularModule, GiftTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'hover.set(true)',
    '(mouseleave)': 'hover.set(false)',
    '(focusin)': 'focus.set(true)',
    '(focusout)': 'focus.set(false)',
    '(keydown.arrowLeft)': 'go(-1)',
    '(keydown.arrowRight)': 'go(1)',
  },
  template: `
    <section class="hero" aria-roledescription="carousel" aria-label="Featured" (pointerdown)="down($event)" (pointerup)="up($event)">
      @for (s of slides; track s.id; let i = $index) {
        <div class="slide" [class.is-active]="i === index()" [attr.aria-hidden]="i !== index()" [attr.inert]="i !== index() ? '' : null"
          role="group" aria-roledescription="slide" [attr.aria-label]="i + 1 + ' of ' + slides.length">
          <img [src]="s.image" [attr.srcset]="s.srcset" sizes="100vw" [alt]="s.alt" [style.object-position]="s.focus ?? 'center'"
            [attr.fetchpriority]="i === 0 ? 'high' : null" [attr.loading]="i === 0 ? 'eager' : 'lazy'" />
          <div class="scrim"></div>
          <div class="container content">
            @if (i === 0 && primary()) {
              <h1 class="title">{{ s.title }}</h1>
            } @else {
              <h2 class="title">{{ s.title }}</h2>
            }
            <p class="lead">{{ s.lead }}</p>
            <div class="actions">
              <a [routerLink]="s.primary.link" class="btn btn-on-dark btn-lg">{{ s.primary.label }}</a>
              @if (s.secondary) {
                <a [routerLink]="s.secondary.link" class="btn btn-lg btn-glass">{{ s.secondary.label }}</a>
              }
            </div>
          </div>
          @if (i === 0) {
            <app-gift-tag class="tag" size="lg" to="Ammi" note="Happy birthday. Thank you for everything." from="Love, Sara" />
          }
        </div>
      }

      <div class="container controls">
        <div class="dots" role="tablist" aria-label="Choose slide">
          @for (s of slides; track s.id; let i = $index) {
            <button type="button" role="tab" class="dot" [attr.aria-selected]="i === index()" [attr.aria-label]="s.title"
              (click)="select(i)">
              <span [class.run]="i === index() && playing()" [style.animation-duration.ms]="interval"></span>
            </button>
          }
        </div>
        <div class="arrows">
          <button type="button" class="ctl" (click)="paused.set(!paused())" [attr.aria-label]="paused() ? 'Play slides' : 'Pause slides'">
            <lucide-icon [img]="paused() ? I.Play : I.Pause" [size]="18" [strokeWidth]="2" />
          </button>
          <button type="button" class="ctl" (click)="go(-1)" aria-label="Previous slide">
            <lucide-icon [img]="I.ChevronLeft" [size]="20" [strokeWidth]="2" />
          </button>
          <button type="button" class="ctl" (click)="go(1)" aria-label="Next slide">
            <lucide-icon [img]="I.ChevronRight" [size]="20" [strokeWidth]="2" />
          </button>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .hero {
      position: relative;
      height: clamp(560px, calc(100svh - var(--header-h) - 40px), 940px);
      overflow: hidden;
      background: #1a0b12;
      color: #fff;
      touch-action: pan-y;
    }
    .slide {
      position: absolute; inset: 0;
      opacity: 0; visibility: hidden;
      transition: opacity 900ms var(--ease-out), visibility 0s linear 900ms;
    }
    .slide.is-active { opacity: 1; visibility: visible; transition: opacity 900ms var(--ease-out), visibility 0s; z-index: 1; }
    .slide img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.08); }
    .slide.is-active img { transform: scale(1); transition: transform 8s var(--ease-out); }
    .scrim {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, rgb(20 6 12 / 0.86) 0%, rgb(20 6 12 / 0.62) 45%, rgb(20 6 12 / 0.08) 80%),
                  linear-gradient(0deg, rgb(20 6 12 / 0.55), rgb(20 6 12 / 0) 35%);
    }
    .content {
      position: relative; height: 100%;
      display: grid; align-content: center; justify-items: start; gap: 24px;
      padding-bottom: 72px;
    }
    .title {
      font-size: clamp(2.5rem, 1.2rem + 4.4vw, 5rem);
      line-height: 0.98; letter-spacing: -0.038em; font-weight: 700;
      max-width: 15ch; text-wrap: balance; text-shadow: 0 2px 24px rgb(0 0 0 / 0.25);
    }
    .lead { font-size: clamp(1.0625rem, 0.95rem + 0.5vw, 1.375rem); line-height: 1.5; max-width: 30em; opacity: 0.92; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
    .btn-glass { background: rgb(255 255 255 / 0.16); color: #fff; }
    .btn-glass:hover { background: rgb(255 255 255 / 0.26); }
    .is-active .title, .is-active .lead, .is-active .actions { animation: rise 800ms var(--ease-out) both; }
    .is-active .lead { animation-delay: 90ms; }
    .is-active .actions { animation-delay: 180ms; }
    @keyframes rise { from { opacity: 0; transform: translateY(28px); } }
    .tag { position: absolute; right: max(var(--gutter), calc((100vw - var(--page-max)) / 2)); bottom: 110px; z-index: 2; }

    .controls {
      position: absolute; left: 0; right: 0; bottom: 28px; z-index: 3;
      display: flex; align-items: center; gap: 24px; /* kept left: the WhatsApp bubble owns the bottom-right corner */
    }
    .dots { display: flex; gap: 8px; }
    .dot { width: 44px; height: 32px; display: grid; align-items: center; }
    .dot span { display: block; height: 4px; border-radius: 2px; background: rgb(255 255 255 / 0.35); position: relative; overflow: hidden; }
    .dot[aria-selected='true'] span { background: rgb(255 255 255 / 0.45); }
    .dot[aria-selected='true'] span::after { content: ''; position: absolute; inset: 0; background: #fff; transform-origin: left; }
    .dot span.run::after { animation: fill linear both; animation-duration: inherit; }
    @keyframes fill { from { transform: scaleX(0); } }
    .arrows { display: flex; gap: 8px; }
    .ctl {
      width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
      background: rgb(255 255 255 / 0.16); color: #fff; transition: background-color var(--dur-fast);
    }
    .ctl:hover { background: rgb(255 255 255 / 0.28); }
    @media (max-width: 900px) {
      .tag { display: none; }
      .scrim { background: linear-gradient(0deg, rgb(20 6 12 / 0.85) 0%, rgb(20 6 12 / 0.45) 55%, rgb(20 6 12 / 0.15) 100%); }
      .content { align-content: end; padding-bottom: 96px; }
    }
    @media (max-width: 560px) { .arrows .ctl:not(:first-child) { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      .slide.is-active img { transition: none; }
    }
  `,
})
export class HeroSlider implements OnInit, OnDestroy {
  protected readonly I = I;
  /** false where another heading is the page title (e.g. the design page) */
  readonly primary = input(true);
  protected readonly slides = SLIDES;
  protected readonly interval = INTERVAL;
  protected readonly index = signal(0);
  protected readonly paused = signal(matchMedia('(prefers-reduced-motion: reduce)').matches);
  protected readonly hover = signal(false);
  protected readonly focus = signal(false);
  protected readonly playing = computed(() => !this.paused() && !this.hover() && !this.focus());

  private timer?: ReturnType<typeof setInterval>;
  private startX = 0;
  private lastTick = Date.now();

  ngOnInit(): void {
    // One ticker; it only advances while playing, so pausing never loses the place.
    this.timer = setInterval(() => {
      if (!this.playing() || document.hidden) {
        this.lastTick = Date.now();
        return;
      }
      if (Date.now() - this.lastTick >= INTERVAL) this.go(1);
    }, 250);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  go(dir: number): void {
    this.select((this.index() + dir + SLIDES.length) % SLIDES.length);
  }

  select(i: number): void {
    this.index.set(i);
    this.lastTick = Date.now();
  }

  down(e: PointerEvent): void {
    this.startX = e.clientX;
  }

  up(e: PointerEvent): void {
    const dx = e.clientX - this.startX;
    if (Math.abs(dx) > 50 && e.pointerType !== 'mouse') this.go(dx < 0 ? 1 : -1);
  }
}
