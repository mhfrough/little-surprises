import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND } from '../core/catalog';
import { CatalogService } from '../core/catalog.service';
import { I } from '../shared/icons';
import { MhLogo } from '../shared/mh-logo';
import { TiktokIcon } from '../shared/tiktok-icon';
import { WhatsappIcon } from '../shared/whatsapp-icon';


/**
 * The close of every page: what we promise, how to reach us, every category
 * and occasion (live from the catalog), help, and a slim close: who made it,
 * then the small print.
 */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, LucideAngularModule, TiktokIcon, WhatsappIcon, MhLogo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer>
      <div class="aura" aria-hidden="true"></div>

      <!-- promises -->
      <div class="container promises">
        <div><lucide-icon [img]="I.Truck" [size]="22" [strokeWidth]="1.6" /><p><strong>Same day in Karachi</strong><span>Order before 2 pm</span></p></div>
        <div><lucide-icon [img]="I.Gift" [size]="22" [strokeWidth]="1.6" /><p><strong>Wrapped by hand</strong><span>With a handwritten note</span></p></div>
        <div><lucide-icon [img]="I.Wallet" [size]="22" [strokeWidth]="1.6" /><p><strong>Cash on delivery</strong><span>Or JazzCash, Easypaisa, card</span></p></div>
        <div><lucide-icon [img]="I.ShieldCheck" [size]="22" [strokeWidth]="1.6" /><p><strong>Arrives perfect</strong><span>Or we replace it</span></p></div>
      </div>

      <div class="container main">
        <!-- brand -->
        <section class="brand" aria-label="Little Surprises">
          <a routerLink="/" class="lockup">
            <span class="mark"><img src="brand/mark.webp" alt="" width="56" height="56" /></span>
            <span><span class="word">Little Surprises</span><span class="line">Personalized with love · Delivered with care</span></span>
          </a>
          <p class="about">Gift hampers, Belgian chocolate, cakes, flowers and mithai, wrapped by hand in Karachi and delivered across Pakistan.</p>
          <ul class="reach" role="list">
            <li><a [href]="'https://wa.me/' + brand.whatsapp" target="_blank" rel="noopener"><app-whatsapp-icon [size]="18" /> {{ brand.phone }} <span>WhatsApp</span></a></li>
            <li><a [href]="'tel:+' + brand.whatsapp"><lucide-icon [img]="I.Phone" [size]="18" [strokeWidth]="1.8" /> {{ brand.phone }}</a></li>
            <li><a [href]="'mailto:' + brand.email"><lucide-icon [img]="I.Mail" [size]="18" [strokeWidth]="1.8" /> {{ brand.email }}</a></li>
            <li><span class="plain"><lucide-icon [img]="I.Clock" [size]="18" [strokeWidth]="1.8" /> {{ brand.hours }}</span></li>
          </ul>
          <div class="social">
            <a [href]="brand.instagram.url" target="_blank" rel="noopener" aria-label="Instagram"><lucide-icon [img]="I.Instagram" [size]="20" [strokeWidth]="1.8" /></a>
            <a [href]="brand.tiktok.url" target="_blank" rel="noopener" aria-label="TikTok"><app-tiktok-icon [size]="20" /></a>
            <a [href]="'https://wa.me/' + brand.whatsapp" target="_blank" rel="noopener" aria-label="WhatsApp"><app-whatsapp-icon [size]="20" /></a>
          </div>
        </section>

        <!-- links -->
        <nav class="col" aria-label="Shop by category">
          <h2>Shop</h2>
          <a routerLink="/shop">All gifts <span class="n">{{ catalog.products().length || '' }}</span></a>
          @for (c of catalog.categories(); track c.id) {
            <a [routerLink]="['/category', c.slug]">{{ c.name }} <span class="n">{{ c.count }}</span></a>
          }
        </nav>
        <nav class="col" aria-label="Shop by occasion">
          <h2>Occasions</h2>
          @for (o of catalog.occasions(); track o.id) {
            <a [routerLink]="['/occasion', o.id]">{{ o.name }}</a>
          }
          <a routerLink="/build-a-basket" class="accent">Build a basket</a>
        </nav>
        <nav class="col" aria-label="Help">
          <h2>Help</h2>
          <a routerLink="/contact">Contact us</a>
          <a routerLink="/reviews">Customer reviews</a>
          <a routerLink="/policies/delivery">Delivery</a>
          <a routerLink="/policies/refunds">Refunds & cancellations</a>
          <a routerLink="/policies/faq">FAQ</a>
          <a routerLink="/contact">Corporate gifting</a>
          <a routerLink="/cart">Your bag</a>
        </nav>
      </div>

      <!-- the close: who made it, then the small print -->
      <div class="container close">
        <div class="row credit">
          <p class="idea">
            <svg class="heart" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.5C9.2 18 3.5 13.6 3.5 8.9 3.5 6.3 5.5 4.5 7.8 4.5c1.7 0 3.2.9 4.2 2.4 1-1.5 2.5-2.4 4.2-2.4 2.3 0 4.3 1.8 4.3 4.4 0 4.7-5.7 9.1-8.5 11.6Z" />
            </svg>
            <span class="by">An original idea by</span>
            <span class="name">Shazra Akbar</span>
          </p>
          <a class="maker" href="https://mhfrough.dev" target="_blank" rel="noopener"
             aria-label="Designed and built by Mohammad Hamza (opens mhfrough.dev in a new tab)">
            <span class="by">Designed &amp; built by</span>
            <app-mh-logo [size]="24" />
            <span class="who">Mohammad Hamza</span>
          </a>
        </div>

        <div class="row small">
          <p class="legal">
            <span>© {{ year }} Little Surprises. All rights reserved.</span>
            <span class="links">
              <a routerLink="/policies/privacy">Privacy</a>
              <a routerLink="/policies/terms">Terms</a>
              <a routerLink="/sitemap">Sitemap</a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: `
    footer {
      position: relative; overflow: hidden; margin-top: var(--section-gap);
      background: var(--field-deep); color: var(--field-deep-ink);
      --soft: rgb(247 232 236 / 0.72);
      --tile: rgb(255 255 255 / 0.06);
    }
    /* the rose glow of the ribbon, low behind the brand */
    .aura {
      position: absolute; width: 900px; height: 900px; left: -300px; top: -420px; pointer-events: none;
      background: radial-gradient(circle, rgb(216 107 138 / 0.28), rgb(216 107 138 / 0) 62%);
    }
    footer > .container { position: relative; }

    .promises { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding-block: 40px 8px; }
    .promises > div { display: flex; gap: 14px; align-items: center; padding: 18px; border-radius: var(--radius); background: var(--tile); }
    .promises lucide-icon { color: var(--blush); flex: none; }
    .promises p { display: grid; font-size: var(--text-small); }
    .promises strong { font-size: 0.9375rem; font-weight: 620; }
    .promises span { color: var(--soft); }

    .main { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)); gap: 40px 40px; padding-block: 64px 56px; }
    .lockup { display: inline-flex; align-items: center; gap: 12px; }
    .mark { width: 56px; height: 56px; border-radius: 16px; background: #fbf1f4; display: grid; place-items: center; padding: 4px; }
    .mark img { width: 100%; height: 100%; object-fit: contain; }
    .word { display: block; font-family: var(--font-brand); font-size: 1.5rem; letter-spacing: 0.06em; line-height: 1; }
    .line { display: block; margin-top: 6px; font-size: 0.625rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--soft); }
    .brand { display: grid; gap: 20px; align-content: start; }
    .about { color: var(--soft); font-size: 0.9375rem; max-width: 30em; }
    .reach { display: grid; gap: 10px; font-size: 0.9375rem; }
    .reach a, .reach .plain { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; color: var(--field-deep-ink); max-width: 100%; }
    .reach a:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
    .reach lucide-icon, .reach app-whatsapp-icon { color: var(--blush); }
    .reach span span { color: var(--soft); font-size: var(--text-small); }
    .social { display: flex; gap: 8px; }
    .social a { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--tile); color: var(--field-deep-ink); transition: background-color var(--dur-fast), transform var(--dur-fast); }
    .social a:hover { background: rgb(255 255 255 / 0.16); transform: translateY(-2px); }

    .col { display: grid; gap: 2px; align-content: start; }
    h2 { font-size: var(--text-small); font-weight: 650; letter-spacing: 0.02em; color: #fff; margin-bottom: 10px; }
    .col a { display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; font-size: 0.9375rem; color: var(--soft); transition: color var(--dur-fast); }
    .col a:hover { color: #fff; }
    .col .n { font-size: 0.75rem; color: rgb(247 232 236 / 0.66); font-variant-numeric: tabular-nums; }
    .col .accent { color: var(--blush); font-weight: 600; margin-top: 6px; }

    /* the close: one slim strip. Founder's dedication left, maker's mark right; small print beneath. */
    .close { padding-block: 0 96px; } /* room for the WhatsApp bubble */
    .close::before { content: ''; display: block; height: 1px; background: rgb(247 232 236 / 0.14); }
    .row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 32px; }
    .credit { padding-block: 22px 0; }
    .by { font-size: var(--text-small); color: var(--soft); }

    .idea { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin: 0; }
    .heart { width: 18px; height: 18px; flex: none; fill: none; stroke: var(--blush); stroke-width: 1.6; stroke-linejoin: round; }
    .name { font-family: var(--font-brand); font-size: 1.125rem; font-weight: 500; letter-spacing: 0.06em; line-height: 1; color: var(--blush); }

    .maker {
      display: inline-flex; align-items: center; gap: 10px; min-height: 44px; margin-block: -6px;
      color: var(--field-deep-ink); border-radius: 8px;
    }
    .maker app-mh-logo { transition: transform var(--dur-fast); }
    .who { font-size: 0.9375rem; font-weight: 600; letter-spacing: -0.005em; text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 4px; transition: text-decoration-color var(--dur-fast); }
    .maker:hover .who { text-decoration-color: currentColor; }
    .maker:hover app-mh-logo { transform: rotate(-6deg); }

    .legal { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 24px; margin: 0; font-size: 0.8125rem; color: var(--soft); }
    .links { display: flex; gap: 4px; margin-inline: -10px; }
    .links a { display: inline-flex; align-items: center; min-height: 36px; padding-inline: 10px; border-radius: 8px; color: var(--soft); transition: color var(--dur-fast); }
    .links a:hover { color: #fff; }

    footer :focus-visible { outline: 2px solid var(--blush); outline-offset: 3px; }

    @media (max-width: 1100px) {
      .main { grid-template-columns: 1fr 1fr 1fr; }
      .brand { grid-column: 1 / -1; }
    }
    @media (max-width: 760px) {
      .promises { grid-template-columns: 1fr 1fr; }
      .main { grid-template-columns: 1fr 1fr; }
      .row { flex-direction: column; justify-content: center; text-align: center; }
      .credit { padding-block: 24px 0; gap: 8px; }
      .idea, .legal { justify-content: center; }
      .legal { flex-direction: column; gap: 0; }
      .links a { min-height: 44px; }
    }
    @media (max-width: 480px) {
      .promises { grid-template-columns: 1fr; }
    }
  `,
})
export class SiteFooter {
  protected readonly I = I;
  protected readonly brand = BRAND;
  protected readonly catalog = inject(CatalogService);
  protected readonly year = new Date().getFullYear();
}
