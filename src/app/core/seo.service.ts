import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BRAND } from './catalog';

/** Title, description, canonical link and JSON-LD for the current page. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  set(opts: { title: string; description?: string; path?: string; image?: string; jsonLd?: object }): void {
    const full = opts.title.includes(BRAND.name) ? opts.title : `${opts.title} · ${BRAND.name}`;
    this.title.setTitle(full);
    const desc = opts.description ?? 'Gift hampers, chocolates, cakes and flowers, wrapped by hand and delivered same day across Karachi.';
    this.meta.updateTag({ name: 'description', content: desc });
    this.meta.updateTag({ property: 'og:title', content: full });
    this.meta.updateTag({ property: 'og:description', content: desc });
    if (opts.image) this.meta.updateTag({ property: 'og:image', content: new URL(opts.image, BRAND.siteUrl + '/').href });

    const url = BRAND.siteUrl + (opts.path ?? '');
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;

    this.doc.getElementById('page-jsonld')?.remove();
    if (opts.jsonLd) {
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'page-jsonld';
      s.textContent = JSON.stringify(opts.jsonLd);
      this.doc.head.appendChild(s);
    }
  }
}
