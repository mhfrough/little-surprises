import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { CatalogService, cityLabel } from '../core/catalog.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BagStore } from '../core/stores';
import { BrandMark } from '../shared/brand-mark';
import { ThemeToggle } from '../shared/theme-toggle';
import { SiteSearch } from './site-search';
import { I } from '../shared/icons';

/** Plain bar: wordmark, a few links, one action. Solid, no glass. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, BrandMark, SiteSearch, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-scrolled]': 'scrolled()' },
  template: `
    <div class="announce">
      <div class="container announce-inner">
        <label class="city">
          <lucide-icon [img]="I.MapPin" [size]="15" [strokeWidth]="2" />
          <span class="visually-hidden">Delivery city</span>
          <span aria-hidden="true">Deliver to</span>
          <select [value]="catalog.city()" (change)="catalog.city.set($any($event.target).value)">
            @for (c of cityOptions(); track c) {
              <option [value]="c" [selected]="c === catalog.city()">{{ label(c) }}</option>
            }
          </select>
          <lucide-icon [img]="I.ChevronDown" [size]="14" [strokeWidth]="2.2" />
        </label>
        <p class="msg">
          <lucide-icon [img]="I.Truck" [size]="15" [strokeWidth]="2" />
          @if (catalog.city() === 'karachi') {
            <span>Same-day delivery across Karachi before 2 pm · Cash on delivery</span>
          } @else {
            <span>Delivery to {{ label(catalog.city()) }} in 2–4 days · Cash on delivery</span>
          }
        </p>
        <div class="util">
          <a routerLink="/reviews" class="util-link">Reviews</a>
          <a routerLink="/contact" class="util-link">Help</a>
          <app-theme-toggle tone="dark" />
        </div>
      </div>
    </div>
    <header class="bar">
      <div class="container inner">
        <button type="button" class="btn-ghost-icon menu-btn" aria-label="Open menu" [attr.aria-expanded]="open()"
          (click)="open.set(true)">
          <lucide-icon [img]="I.Menu" [size]="22" [strokeWidth]="1.8" />
        </button>

        <a routerLink="/" class="brand"><app-brand-mark /></a>

        <nav class="links" aria-label="Main">
          @for (l of links; track l.link) {
            <a [routerLink]="l.link" routerLinkActive="is-active">{{ l.label }}</a>
          }
        </nav>

        <div class="tools">
          <app-site-search />
          <a routerLink="/contact" class="btn-ghost-icon hide-sm hide-mid" aria-label="Contact us">
            <lucide-icon [img]="I.Phone" [size]="20" [strokeWidth]="1.8" />
          </a>
          <a routerLink="/cart" class="btn-ghost-icon" [attr.aria-label]="'Bag, ' + bag.count() + ' items'">
            <lucide-icon [img]="I.ShoppingBag" [size]="20" [strokeWidth]="1.8" />
            @if (bag.count()) {
              <span class="badge t-num">{{ bag.count() }}</span>
            }
          </a>
          <a routerLink="/build-a-basket" class="btn btn-primary btn-sm cta">Build a basket</a>
        </div>
      </div>
    </header>

    @if (open()) {
      <div class="scrim" (click)="open.set(false)"></div>
      <nav class="sheet" aria-label="Main">
        <div class="sheet-head">
          <app-brand-mark />
          <button type="button" class="btn-ghost-icon" aria-label="Close menu" (click)="open.set(false)">
            <lucide-icon [img]="I.X" [size]="22" [strokeWidth]="1.8" />
          </button>
        </div>
        @for (l of links; track l.link) {
          <a [routerLink]="l.link" class="sheet-link" (click)="open.set(false)">{{ l.label }}</a>
        }
        <a routerLink="/reviews" class="sheet-link" (click)="open.set(false)">Reviews</a>
        <a routerLink="/contact" class="sheet-link" (click)="open.set(false)">Contact</a>
        <div class="sheet-theme"><span>Theme</span><app-theme-toggle [labels]="true" /></div>
        <a routerLink="/build-a-basket" class="btn btn-primary btn-lg btn-block" (click)="open.set(false)">Build a basket</a>
      </nav>
    }
  `,
  styles: `
    :host { display: contents; }
    .announce {
      background: var(--field-deep);
      color: var(--field-deep-ink);
      font-size: var(--text-small);
    }
    /* three columns: city | message, truly centred | links + theme */
    .announce-inner { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 16px; height: 44px; }
    .msg { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; line-height: 1; }
    .msg lucide-icon { color: var(--blush); flex: none; }
    .util { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
    .util-link { padding: 6px 10px; border-radius: var(--radius-pill); color: rgb(247 232 236 / 0.85); line-height: 1; }
    .util-link:hover { color: #fff; background: rgb(255 255 255 / 0.08); }
    .util app-theme-toggle { margin-left: 6px; }
    .city {
      position: relative; display: inline-flex; align-items: center; gap: 6px; justify-self: start;
      height: 30px; padding: 0 10px; line-height: 1; border-radius: var(--radius-pill); background: rgb(255 255 255 / 0.1); cursor: pointer;
    }
    .city:focus-within { outline: 2px solid var(--blush); outline-offset: 2px; }
    .city select {
      appearance: none; background: none; border: 0; color: inherit; font-weight: 650; cursor: pointer; padding: 0 2px;
    }
    .city select:focus { outline: none; }
    .city option { color: #1f1418; }
    @media (max-width: 760px) {
      .msg, .util-link { display: none; }
      .announce-inner { grid-template-columns: minmax(0, 1fr) auto; }
    }
    .bar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--ground);
      transition: background-color var(--dur) var(--ease-out);
    }
    :host(.is-scrolled) .bar { background: var(--surface); }
    .inner { display: flex; align-items: center; gap: 24px; height: var(--header-h); }
    .brand { flex: none; border-radius: 8px; }
    .links { display: flex; gap: 4px; margin-inline: auto; min-width: 0; }
    .links a { white-space: nowrap; flex: none; }
    .links a {
      padding: 8px 14px; border-radius: var(--radius-pill); font-size: 0.9375rem; font-weight: 520; color: var(--ink);
      transition: background-color var(--dur-fast) var(--ease-out);
    }
    .links a:hover { background: var(--surface-2); }
    .links a.is-active { background: var(--surface-2); font-weight: 620; }
    .tools { gap: 6px; }
    @media (max-width: 1440px) { .hide-mid { display: none; } .links a { padding: 8px 11px; } }
    .tools { display: flex; align-items: center; gap: 2px; }
    .cta { margin-left: 10px; }
    .badge {
      position: absolute; top: 4px; right: 2px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
      background: var(--accent); color: var(--accent-ink); font-size: 11px; font-weight: 700; line-height: 18px; text-align: center;
    }
    .menu-btn { display: none; margin-left: -10px; flex: none; }
    .tools { flex: none; }
    .brand { min-width: 0; }
    @media (max-width: 440px) {
      .brand ::ng-deep .line { display: none; }
      /* keep the bag on screen: the wordmark scales with the phone */
      .brand ::ng-deep app-brand-mark { gap: 8px; }
      .brand ::ng-deep .mark { width: 34px !important; height: 34px !important; }
      .brand ::ng-deep .word { font-size: clamp(0.875rem, 4vw, 1.5rem); }
    }
    .scrim { position: fixed; inset: 0; z-index: 60; background: var(--scrim); animation: fade var(--dur) var(--ease-out); }
    .sheet {
      position: fixed; z-index: 61; inset: 0 auto 0 0; width: min(88vw, 360px); padding: 16px 20px 24px;
      display: flex; flex-direction: column; gap: 2px; background: var(--ground); box-shadow: var(--shadow-float);
      animation: slide var(--dur) var(--ease-out);
    }
    .sheet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .sheet-link { font-size: var(--text-headline); font-weight: 600; letter-spacing: -0.015em; padding: 12px 4px; }
    .sheet-theme { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding: 12px 4px; color: var(--ink-2); }
    .sheet .btn { margin-top: auto; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes slide { from { transform: translateX(-100%); } }
    /* the full menu needs ~1280px next to the search field; below that, the menu button */
    @media (max-width: 1280px) {
      .links { display: none; }
      .menu-btn { display: inline-grid; }
      .tools { margin-left: auto; }
    }
    @media (max-width: 560px) {
      .cta, .hide-sm { display: none; }
      .inner { gap: 8px; }
      .announce { font-size: 0.8125rem; }
    }
  `,
})
export class SiteHeader {
  protected readonly I = I;
  protected readonly bag = inject(BagStore);
  protected readonly catalog = inject(CatalogService);
  protected readonly label = cityLabel;
  /** Karachi first; falls back to it alone while the catalog loads. */
  protected readonly cityOptions = computed(() => {
    const cs = this.catalog.cities();
    return cs.length ? cs : ['karachi'];
  });
  protected readonly open = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly links = [
    { label: 'All gifts', link: '/shop' },
    { label: 'Hampers', link: '/category/hampers' },
    { label: 'Chocolates', link: '/category/chocolates' },
    { label: 'Cakes', link: '/category/cakes' },
    { label: 'Flowers', link: '/category/flowers' },
    { label: 'Mithai', link: '/category/mithai' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 40);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }
}
