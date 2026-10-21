import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService } from '../../core/catalog.service';
import { PoliciesService } from '../../core/policies.service';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { I } from '../../shared/icons';

interface Entry {
  path: string;
  label: string;
  lastmod: string;
  image?: string;
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/shop': 'All gifts',
  '/build-a-basket': 'Build a basket',
  '/contact': 'Contact us',
  '/reviews': 'Customer reviews',
};

const titleFromSlug = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bAnd\b/g, '&');

/** The site map, read from /sitemap.xml so it always matches what search engines see. */
@Component({
  selector: 'app-sitemap-page',
  imports: [RouterLink, LucideAngularModule, Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Sitemap' }]" />
      <header class="head">
        <h1 class="t-title">Sitemap</h1>
        <p class="t-muted">
          Every page on the site, read from our <a href="sitemap.xml" class="link">sitemap.xml</a>.
          @if (updated()) { Last updated {{ updated() }}. }
        </p>
      </header>

      @if (xml.isLoading()) {
        <p class="t-muted">Loading the sitemap…</p>
      } @else if (xml.error()) {
        <p class="notice is-negative"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> The sitemap could not be loaded. <a href="sitemap.xml" class="link">Open the XML</a></p>
      } @else {
        <div class="summary">
          @for (g of groups(); track g.id) {
            <a [href]="'sitemap#' + g.id" (click)="jump($event, g.id)" class="stat"><strong class="t-num">{{ g.items.length }}</strong><span>{{ g.title }}</span></a>
          }
        </div>

        <div class="grid">
          @for (g of groups(); track g.id) {
            @if (g.id !== 'products') {
              <section [id]="g.id" class="group">
                <h2 class="t-headline">{{ g.title }}</h2>
                <ul role="list">
                  @for (e of g.items; track e.path) {
                    <li><a [routerLink]="e.path">{{ e.label }}</a></li>
                  }
                </ul>
              </section>
            }
          }
        </div>

        <section id="products" class="products">
          <div class="p-head">
            <h2 class="t-headline">Gifts <span class="t-muted t-num">{{ products().length }}</span></h2>
            <div class="search-field">
              <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
              <label class="visually-hidden" for="sm-q">Filter gifts</label>
              <input id="sm-q" class="input" type="search" placeholder="Filter gifts" [value]="q()" (input)="q.set($any($event.target).value)" />
            </div>
          </div>
          <nav class="letters" aria-label="Jump to letter">
            @for (l of letters(); track l.letter) {
              <a [href]="'sitemap#l-' + l.letter" (click)="jump($event, 'l-' + l.letter)">{{ l.letter }}</a>
            }
          </nav>
          @for (l of letters(); track l.letter) {
            <div class="letter" [id]="'l-' + l.letter">
              <h3>{{ l.letter }}</h3>
              <ul role="list">
                @for (e of l.items; track e.path) {
                  <li><a [routerLink]="e.path">{{ e.label }}</a></li>
                }
              </ul>
            </div>
          } @empty {
            <p class="t-muted">No gifts match “{{ q() }}”.</p>
          }
        </section>
      }
    </main>
  `,
  styles: `
    .page { display: grid; gap: 32px; padding-top: 32px; }
    .head { display: grid; gap: 10px; }
    .link { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .stat { display: grid; gap: 2px; padding: 18px 20px; border-radius: var(--radius); background: var(--surface); transition: background-color var(--dur-fast); }
    .stat:hover { background: var(--surface-2); }
    .stat strong { font-size: var(--text-title); font-weight: 680; letter-spacing: -0.03em; line-height: 1; color: var(--accent); }
    .stat span { color: var(--ink-2); font-size: var(--text-small); }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px; }
    .group, .letter, .letter ul { min-width: 0; }
    .group { display: grid; gap: 12px; align-content: start; scroll-margin-top: calc(var(--header-h) + 16px); }
    .group ul, .letter ul { display: grid; gap: 2px; }
    .group a, .letter a { display: inline-block; padding: 5px 0; color: var(--ink-2); }
    .group a:hover, .letter a:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
    .products { display: grid; gap: 20px; scroll-margin-top: calc(var(--header-h) + 16px); }
    .p-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .p-head .search-field { width: min(320px, 100%); }
    .letters { display: flex; flex-wrap: wrap; gap: 6px; }
    .letters a { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; background: var(--surface-2); font-weight: 600; font-size: var(--text-small); }
    .letters a:hover { background: var(--ink); color: var(--ground); }
    .letter { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 16px; padding: 16px 0; scroll-margin-top: calc(var(--header-h) + 16px); }
    .letter h3 { font-size: var(--text-headline); font-weight: 680; color: var(--rose); }
    .letter ul { grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 24px; }
    @media (max-width: 960px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .letter ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .letter ul { grid-template-columns: 1fr; }
    }
  `,
})
export class SitemapPage {
  protected readonly I = I;
  protected readonly xml = httpResource.text(() => 'sitemap.xml');
  protected readonly q = signal('');

  private readonly entries = computed<Entry[]>(() => {
    const text = this.xml.value();
    // No DOMParser while prerendering; the list fills in once the page boots.
    if (!text || typeof DOMParser === 'undefined') return [];
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    return [...doc.getElementsByTagName('url')].map((u) => {
      const loc = u.getElementsByTagName('loc')[0]?.textContent ?? '';
      const path = safePath(loc);
      const imageTitle = u.getElementsByTagNameNS('*', 'title')[0]?.textContent ?? undefined;
      const slug = path.split('/').filter(Boolean).pop() ?? '';
      return {
        path,
        label: PAGE_LABELS[path] ?? imageTitle ?? this.nameFor(path, slug),
        lastmod: u.getElementsByTagName('lastmod')[0]?.textContent ?? '',
        image: u.getElementsByTagNameNS('*', 'loc')[1]?.textContent ?? undefined,
      };
    });
  });

  protected readonly updated = computed(() => {
    const d = this.entries().map((e) => e.lastmod).sort().pop();
    return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  });

  protected readonly groups = computed(() => {
    const by = (prefix: string) => this.entries().filter((e) => e.path.startsWith(prefix));
    return [
      { id: 'pages', title: 'Pages', items: this.entries().filter((e) => e.path in PAGE_LABELS) },
      { id: 'categories', title: 'Categories', items: by('/category/') },
      { id: 'occasions', title: 'Occasions', items: by('/occasion/') },
      { id: 'policies', title: 'Policies', items: by('/policies/') },
      { id: 'products', title: 'Gifts', items: by('/product/') },
    ].filter((g) => g.items.length);
  });

  protected readonly products = computed(() =>
    this.entries()
      .filter((e) => e.path.startsWith('/product/'))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  protected readonly letters = computed(() => {
    const q = this.q().trim().toLowerCase();
    const map = new Map<string, Entry[]>();
    for (const e of this.products()) {
      if (q && !e.label.toLowerCase().includes(q)) continue;
      const l = /[a-z]/i.test(e.label[0]) ? e.label[0].toUpperCase() : '#';
      map.set(l, [...(map.get(l) ?? []), e]);
    }
    return [...map.entries()].map(([letter, items]) => ({ letter, items }));
  });

  private readonly catalog = inject(CatalogService);
  private readonly policies = inject(PoliciesService);

  /** The list comes from sitemap.xml; names come from the data where we have them. */
  private nameFor(path: string, slug: string): string {
    if (path.startsWith('/category/')) return this.catalog.category(slug)?.name ?? titleFromSlug(slug);
    if (path.startsWith('/occasion/')) return this.catalog.occasionName(slug) || titleFromSlug(slug);
    if (path.startsWith('/policies/')) return this.policies.bySlug(slug)?.title ?? titleFromSlug(slug);
    return titleFromSlug(slug);
  }

  constructor() {
    inject(SeoService).set({ title: 'Sitemap', description: 'Every page and gift on Little Surprises.', path: '/sitemap' });
  }

  jump(e: Event, id: string): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function safePath(loc: string): string {
  try {
    return new URL(loc).pathname || '/';
  } catch {
    return loc;
  }
}
