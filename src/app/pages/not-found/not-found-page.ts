import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { GiftTag } from '../../shared/gift-tag';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, GiftTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-gift-tag size="lg" to="you" note="This page has been unwrapped already." />
      <h1 class="t-title">We couldn't find that page</h1>
      <p class="t-muted">The link may be old, or the gift has sold out for the season.</p>
      <div class="row">
        <a routerLink="/" class="btn btn-secondary">Go home</a>
        <a routerLink="/shop" class="btn btn-primary">Shop all gifts</a>
      </div>
    </main>
  `,
  styles: `
    .page { display: grid; justify-items: center; text-align: center; gap: 16px; padding-block: 96px 0; }
    app-gift-tag { margin-bottom: 24px; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
  `,
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', noindex: true });
  }
}
