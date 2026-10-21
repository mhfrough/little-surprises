import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BasketBuilder } from '../../builder/basket-builder';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';

@Component({
  selector: 'app-builder-page',
  imports: [BasketBuilder, Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Build a basket' }]" />
      <header class="head">
        <h1 class="t-title">Build a basket</h1>
        <p class="t-lead">Choose the basket, the wrap and the ribbon, fill it with treats and write a note. We wrap it by hand and the price updates as you go.</p>
      </header>
      <app-basket-builder />
    </main>
  `,
  styles: `
    .page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 32px; padding-top: 32px; }
    .head { display: grid; gap: 12px; }
  `,
})
export class BuilderPage {
  constructor() {
    inject(SeoService).set({
      title: 'Build a gift basket',
      description: 'Build your own gift basket: pick the basket, wrap, ribbon and treats, add a handwritten note. Same-day delivery in Karachi.',
      path: '/build-a-basket',
    });
  }
}
