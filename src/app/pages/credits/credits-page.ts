import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { img } from '../../core/catalog';
import { PHOTOS, StockPhoto } from '../../core/photos';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { I } from '../../shared/icons';

const LICENCE: Record<StockPhoto['source'], string> = {
  Unsplash: 'https://unsplash.com/license',
  Pexels: 'https://www.pexels.com/license/',
};

const TYPE = [
  { name: 'Inter', by: 'Rasmus Andersson', use: 'Everything you read', url: 'https://rsms.me/inter/', licence: 'SIL Open Font License' },
  { name: 'Cinzel', by: 'Natanael Gama', use: 'The wordmark', url: 'https://fonts.google.com/specimen/Cinzel', licence: 'SIL Open Font License' },
];

const CODE = [
  { name: 'Angular', by: 'Google', use: 'The site itself', url: 'https://angular.dev', licence: 'MIT' },
  { name: 'Lucide', by: 'Lucide contributors', use: 'Icons', url: 'https://lucide.dev', licence: 'ISC' },
  { name: 'star-rating', by: 'mhfrough', use: 'Review stars', url: 'https://www.npmjs.com/package/@mhfrough/star-rating', licence: 'MIT' },
  { name: 'Fontsource', by: 'Fontsource contributors', use: 'Self-hosted fonts', url: 'https://fontsource.org', licence: 'MIT' },
];

/** Who made the photos, type and code the site is built from. Photos come from photos.ts, so new ones appear here on their own. */
@Component({
  selector: 'app-credits-page',
  imports: [LucideAngularModule, Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Credits' }]" />
      <header class="head">
        <h1 class="t-title">Credits</h1>
        <p class="t-muted">The photographers, typefaces and open-source code behind this site. Thank you all.</p>
      </header>

      <section aria-labelledby="cr-photos">
        <h2 id="cr-photos" class="t-headline">Photography</h2>
        <p class="t-small t-muted lede">
          Free-to-use photos from <a [href]="licence.Unsplash" target="_blank" rel="noopener" class="link">Unsplash</a> and
          <a [href]="licence.Pexels" target="_blank" rel="noopener" class="link">Pexels</a>. Product photos come from the makers of the products we sell.
        </p>
        <ul class="photos" role="list">
          @for (p of photos; track p.id) {
            <li class="photo">
              <a [href]="p.page" target="_blank" rel="noopener" class="pic" [attr.aria-label]="p.title + ' on ' + p.source">
                <img [src]="thumb(p.id)" alt="" width="480" height="320" loading="lazy" />
              </a>
              <div class="cap">
                <strong>{{ p.title }}</strong>
                <span>by <a [href]="p.authorUrl" target="_blank" rel="noopener" class="link">{{ p.author }}</a> on
                  <a [href]="p.page" target="_blank" rel="noopener" class="link">{{ p.source }}</a></span>
                <span class="use">{{ p.usedFor }}</span>
              </div>
            </li>
          }
        </ul>
      </section>

      <div class="two">
        <section aria-labelledby="cr-type">
          <h2 id="cr-type" class="t-headline">Typefaces</h2>
          <ul class="list" role="list">
            @for (t of type; track t.name) {
              <li><a [href]="t.url" target="_blank" rel="noopener" class="link name">{{ t.name }}</a> by {{ t.by }}
                <span class="meta">{{ t.use }} · {{ t.licence }}</span></li>
            }
          </ul>
        </section>
        <section aria-labelledby="cr-code">
          <h2 id="cr-code" class="t-headline">Icons and code</h2>
          <ul class="list" role="list">
            @for (c of code; track c.name) {
              <li><a [href]="c.url" target="_blank" rel="noopener" class="link name">{{ c.name }}</a> by {{ c.by }}
                <span class="meta">{{ c.use }} · {{ c.licence }} licence</span></li>
            }
          </ul>
        </section>
      </div>
    </main>
  `,
  styles: `
    .page { display: grid; gap: 40px; padding-top: 28px; padding-bottom: var(--section-gap); }
    .head { display: grid; gap: 10px; max-width: 640px; }
    section { display: grid; gap: 14px; align-content: start; }
    .lede { max-width: 640px; margin-top: -6px; }
    .link { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
    .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .photo { display: grid; gap: 10px; align-content: start; }
    .pic { display: block; border-radius: var(--radius); overflow: hidden; background: var(--surface-2); }
    .pic img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; transition: transform var(--dur-slow) var(--ease-out); }
    .pic:hover img { transform: scale(1.08) rotate(2deg); }
    .cap { display: grid; gap: 2px; font-size: var(--text-small); }
    .cap strong { font-weight: 620; }
    .cap span { color: var(--ink-2); }
    .cap .use { color: var(--ink-3); font-size: 0.8125rem; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .list { display: grid; gap: 12px; }
    .list li { display: grid; gap: 2px; color: var(--ink-2); }
    .name { font-weight: 620; }
    .meta { font-size: 0.8125rem; color: var(--ink-3); }
    @media (max-width: 760px) { .two { grid-template-columns: 1fr; } }
  `,
})
export class CreditsPage {
  protected readonly I = I;
  protected readonly photos: StockPhoto[] = Object.values(PHOTOS);
  protected readonly licence = LICENCE;
  protected readonly type = TYPE;
  protected readonly code = CODE;

  constructor() {
    inject(SeoService).set({
      title: 'Credits',
      description: 'The photographers, typefaces and open-source code behind the Little Surprises website.',
      path: '/credits',
    });
  }

  thumb(id: string): string {
    return img(id, 640);
  }
}
