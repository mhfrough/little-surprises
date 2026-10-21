import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { Crumb } from '../shared/breadcrumbs';
import { BRAND } from './catalog';

const ORG_ID = `${BRAND.siteUrl}/#org`;
const SITE_ID = `${BRAND.siteUrl}/#website`;
const DEFAULT_IMAGE = 'brand/logo-full.jpeg';

/** The business and the site, on every page so any URL stands on its own. */
const SITE_GRAPH = [
  {
    '@type': 'OnlineStore',
    '@id': ORG_ID,
    name: BRAND.name,
    slogan: BRAND.line,
    url: `${BRAND.siteUrl}/`,
    logo: { '@type': 'ImageObject', url: `${BRAND.siteUrl}/brand/logo-full.jpeg`, width: 1254, height: 1254 },
    email: BRAND.email,
    telephone: BRAND.phone,
    areaServed: { '@type': 'City', name: 'Karachi' },
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash',
    sameAs: [BRAND.instagram.url, BRAND.tiktok.url],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: BRAND.email, telephone: BRAND.phone, areaServed: 'PK', availableLanguage: ['en', 'ur'] },
  },
  { '@type': 'WebSite', '@id': SITE_ID, url: `${BRAND.siteUrl}/`, name: BRAND.name, inLanguage: 'en-PK', publisher: { '@id': ORG_ID } },
];

/** Title, description, canonical link, social cards and JSON-LD for the current page. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  private page: { url: string; name: string; description: string; type: string; extra?: object } | null = null;
  private crumbs: Crumb[] = [];

  set(opts: {
    title: string;
    description?: string;
    path?: string;
    image?: string;
    /** schema.org type of the page itself, e.g. CollectionPage or ContactPage */
    pageType?: string;
    /** extra schema.org nodes about the page's subject (a Product, an ItemList…) */
    jsonLd?: object;
    /** pages a search engine shouldn't list: the bag, the 404 */
    noindex?: boolean;
  }): void {
    const full = opts.title.includes(BRAND.name) ? opts.title : `${opts.title} · ${BRAND.name}`;
    this.title.setTitle(full);
    const desc = opts.description ?? 'Gift hampers, chocolates, cakes and flowers, wrapped by hand and delivered same day across Karachi.';
    const url = BRAND.siteUrl + (opts.path ?? '');
    const image = new URL(opts.image ?? DEFAULT_IMAGE, BRAND.siteUrl + '/').href;

    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:title', content: full });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: opts.image ? opts.title : `${BRAND.name} logo` });
    // a product photo earns the big card; the square logo reads better small
    this.meta.updateTag({ name: 'twitter:card', content: opts.image ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: full });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    if (opts.noindex) this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    else this.meta.removeTag('name="robots"');

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (opts.noindex) link?.remove();
    else {
      if (!link) {
        link = this.doc.createElement('link');
        link.rel = 'canonical';
        this.doc.head.appendChild(link);
      }
      link.href = url;
    }

    this.page = opts.noindex ? null : { url, name: full, description: desc, type: opts.pageType ?? 'WebPage', extra: opts.jsonLd };
    this.render();
  }

  /** Kept in step by the breadcrumb trail on the page, so the markup and the schema match. */
  setBreadcrumbs(crumbs: Crumb[]): void {
    this.crumbs = crumbs;
    this.render();
  }

  private render(): void {
    this.doc.getElementById('page-jsonld')?.remove();
    const p = this.page;
    if (!p) return;

    const crumbId = `${p.url}#breadcrumb`;
    const trail = [{ label: 'Home', link: '/' }, ...this.crumbs];
    const graph: object[] = [
      ...SITE_GRAPH,
      {
        '@type': p.type,
        '@id': `${p.url}#webpage`,
        url: p.url,
        name: p.name,
        description: p.description,
        isPartOf: { '@id': SITE_ID },
        inLanguage: 'en-PK',
        ...(this.crumbs.length ? { breadcrumb: { '@id': crumbId } } : {}),
      },
    ];
    if (this.crumbs.length) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': crumbId,
        itemListElement: trail.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.label,
          // the last crumb is this page
          item: i === trail.length - 1 ? p.url : c.link ? BRAND.siteUrl + c.link : undefined,
        })),
      });
    }
    if (p.extra) graph.push(p.extra);

    const s = this.doc.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'page-jsonld';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    this.doc.head.appendChild(s);
  }
}
