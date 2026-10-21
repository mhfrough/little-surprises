import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PIC, img } from '../core/catalog';
import { GiftTag } from '../shared/gift-tag';
import { I } from '../shared/icons';
import { RevealDirective } from '../shared/reveal.directive';

/** The business in one screen: gift it as we made it, or make it yourself. */
@Component({
  selector: 'app-two-ways-section',
  imports: [RouterLink, LucideAngularModule, GiftTag, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="field decor-gifts" appReveal aria-labelledby="two-title">
      <div class="container inner">
        <h2 id="two-title" class="t-title" data-reveal>Two ways to give</h2>
        <div class="split">
          <article class="ready" data-reveal>
            <img [src]="readyImg" alt="A premium hamper with chocolates and sparkling juice" width="900" height="1000" loading="lazy" />
            <h3 class="t-headline">Ready-made baskets</h3>
            <p>Put together by us for each occasion, wrapped and ready to go out today.</p>
            <a routerLink="/category/hampers" class="btn btn-plain">
              Shop ready-made <lucide-icon [img]="I.ArrowRight" [size]="18" [strokeWidth]="2" />
            </a>
          </article>
          <article class="own" data-reveal>
            <h3 class="t-headline">Build your own</h3>
            <p>Every part of it is your choice, and the price updates as you go.</p>
            <ol class="choices">
              <li><strong>The basket</strong><span>Kraft weave, gift box or keepsake hamper</span></li>
              <li><strong>The wrap</strong><span>Blush tissue to velvet wine</span></li>
              <li><strong>The ribbon</strong><span>Five colours, tied by hand</span></li>
              <li><strong>The treats</strong><span>Belco chocolate, mithai, perfumes and toys</span></li>
              <li><strong>The note</strong><span>Handwritten on a tag like this one</span></li>
            </ol>
            <app-gift-tag note="Thinking of you today." to="Hina" ribbon="#7a0f3d" />
            <a routerLink="/build-a-basket" class="btn btn-primary btn-lg">Start building</a>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: `
    .field { background: var(--field); color: var(--field-ink); padding-block: clamp(72px, 9vw, 128px); margin-block: calc(var(--section-gap) / 2); }
    .inner { display: grid; gap: 48px; }
    .split { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 88px); align-items: start; }
    .ready { display: grid; gap: 12px; }
    .ready img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 12px; transition: transform var(--dur-slow) var(--ease-out); }
    .ready:hover img { transform: scale(1.07) rotate(-1.5deg); }
    .ready p, .own > p { max-width: 30em; opacity: 0.85; }
    .ready .btn-plain { justify-self: start; color: var(--field-ink); font-weight: 650; }
    .own { display: grid; gap: 16px; justify-items: start; padding-top: clamp(0px, 6vw, 96px); }
    .choices { display: grid; gap: 4px; margin: 8px 0 12px; padding-left: 1.4em; }
    .choices li { padding: 10px 0 10px 6px; }
    .choices li::marker { font-weight: 650; }
    .choices strong { display: block; font-weight: 640; }
    .choices span { font-size: var(--text-small); opacity: 0.8; }
    .own .btn { margin-top: 20px; }
    @media (max-width: 860px) { .split { grid-template-columns: 1fr; } .own { padding-top: 0; } }
  `,
})
export class TwoWaysSection {
  protected readonly I = I;
  protected readonly readyImg = img(PIC.hamper, 900);
}
