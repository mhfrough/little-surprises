import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CatalogService, cityLabel } from '../core/catalog.service';
import { BagStore } from '../core/stores';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../shared/cards/product-card';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-favourites-section',
  imports: [RouterLink, ProductCard, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section container" appReveal aria-labelledby="fav-title">
      <div class="section-head">
        <div>
          <h2 id="fav-title" class="t-title" data-reveal>Our favourites</h2>
          <p class="t-muted" data-reveal>Ready to send on their own, delivered in {{ cityName() }}.</p>
        </div>
        <div class="segmented" role="group" aria-label="Filter favourites" data-reveal>
          @for (f of filters(); track f.id) {
            <button type="button" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">{{ f.label }}</button>
          }
        </div>
      </div>
      <div class="grid">
        @if (catalog.loading()) {
          @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) {
            <div class="sk" aria-hidden="true"><span class="skeleton sk-img"></span><span class="skeleton sk-line"></span><span class="skeleton sk-line short"></span></div>
          }
        } @else {
          @for (p of shown(); track p.id; let i = $index) {
            <app-product-card [product]="p" (add)="bag.add($event)" data-reveal [style.--i]="i" />
          }
        }
      </div>
      <div class="more">
        <a routerLink="/shop" class="btn btn-secondary">See all {{ catalog.products().length }} gifts</a>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px 20px; }
    .more { display: flex; justify-content: center; margin-top: 48px; }
    .sk { display: grid; gap: 10px; }
    .sk-img { aspect-ratio: 1; border-radius: var(--radius); }
    .sk-line { height: 14px; }
    .short { width: 50%; }
    @media (max-width: 1000px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 760px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
      :host ::ng-deep .section-head { flex-direction: column; align-items: flex-start; }
      .segmented { max-width: 100%; overflow-x: auto; scrollbar-width: none; }
      .segmented button { flex: none; }
    }
  `,
})
export class FavouritesSection {
  protected readonly bag = inject(BagStore);
  protected readonly catalog = inject(CatalogService);
  protected readonly filter = signal('');
  protected readonly cityName = computed(() => cityLabel(this.catalog.city()));

  protected readonly filters = computed(() => [
    { id: '', label: 'All' },
    ...this.catalog.categories().slice(0, 5).map((c) => ({ id: c.id, label: c.name })),
  ]);

  /** A mix across categories for "All", so one big category doesn't take every slot. */
  protected readonly shown = computed(() => {
    const ps = this.catalog.products().filter((p) => p.inStock);
    if (this.filter()) return ps.filter((p) => p.categoryId === this.filter()).slice(0, 8);
    const cats = this.catalog.categories().map((c) => ps.filter((p) => p.categoryId === c.id));
    const mix = [];
    for (let i = 0; mix.length < 8 && i < 8; i++) for (const list of cats) if (list[i] && mix.length < 8) mix.push(list[i]);
    return mix;
  });
}
