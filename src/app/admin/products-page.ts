import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminCatalogStore } from '../core/admin-catalog.store';
import { CatalogService } from '../core/catalog.service';
import { Product } from '../core/models';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';
import { Pagination } from '../shared/pagination';

type Sort = 'name' | 'price-asc' | 'price-desc' | 'rating' | 'reviews';
const PAGE = 20;

/** Every product, searchable and filterable, with quick stock toggle, edit and delete. */
@Component({
  selector: 'app-products-page',
  imports: [RouterLink, LucideAngularModule, MoneyPipe, Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Products</h1>
          <p>{{ catalog.allProducts().length }} products · {{ inStock() }} in stock</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-secondary btn-sm" (click)="exportCsv()"><lucide-icon [img]="I.Download" [size]="16" [strokeWidth]="2" /> Export CSV</button>
          <a routerLink="/admin/products/new" class="btn btn-primary btn-sm"><lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2.2" /> New product</a>
        </div>
      </header>

      <div class="adm-toolbar">
        <div class="search-field">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="p-q">Search products</label>
          <input id="p-q" class="input" type="search" placeholder="Search by name or brand" [value]="q()" (input)="q.set($any($event.target).value); page.set(1)" />
        </div>
        <label><span class="visually-hidden">Category</span>
          <select class="select" [value]="cat()" (change)="cat.set($any($event.target).value); page.set(1)">
            <option value="">All categories</option>
            @for (c of catalog.categories(); track c.id) { <option [value]="c.id">{{ c.name }} ({{ c.count }})</option> }
          </select>
        </label>
        <label><span class="visually-hidden">Stock</span>
          <select class="select" [value]="stock()" (change)="stock.set($any($event.target).value); page.set(1)">
            <option value="">Any stock</option><option value="in">In stock</option><option value="out">Sold out</option><option value="sale">On sale</option>
          </select>
        </label>
        <label><span class="visually-hidden">Sort</span>
          <select class="select" [value]="sort()" (change)="sort.set($any($event.target).value)">
            <option value="name">Name A–Z</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
            <option value="rating">Rating</option><option value="reviews">Most reviewed</option>
          </select>
        </label>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr><th scope="col" style="width:56px"><span class="visually-hidden">Picture</span></th><th scope="col">Product</th><th scope="col">Category</th>
              <th scope="col" class="num">Price</th><th scope="col">Stock</th><th scope="col" class="num">Rating</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            @for (p of shown(); track p.id) {
              <tr>
                <td><img class="thumb" [src]="p.images[0]" alt="" width="44" height="44" loading="lazy" /></td>
                <td class="name-cell">
                  <a [routerLink]="['/admin/products', p.id]" class="name clamp-1" [title]="p.name">{{ p.name }}</a>
                  <span class="sub clamp-1">{{ p.brand ?? '—' }} · {{ p.slug }}</span>
                </td>
                <td class="clamp-1">{{ catalog.categoryName(p.categoryId) || '—' }}</td>
                <td class="num">{{ p.price | money }}@if (p.compareAtPrice) { <s class="was">{{ p.compareAtPrice | money }}</s> }</td>
                <td>
                  <label class="switch mini" [title]="p.inStock ? 'In stock' : 'Sold out'">
                    <span class="visually-hidden">{{ p.name }} in stock</span>
                    <input type="checkbox" role="switch" [checked]="p.inStock" (change)="toggleStock(p)" />
                  </label>
                </td>
                <td class="num">{{ p.reviewCount ? (p.rating?.toFixed(1) + ' ★ (' + p.reviewCount + ')') : '—' }}</td>
                <td class="row-actions">
                  <a class="adm-icon-btn" [routerLink]="['/product', p.slug]" target="_blank" [attr.aria-label]="'View ' + p.name + ' in the shop'"><lucide-icon [img]="I.Eye" [size]="16" [strokeWidth]="2" /></a>
                  <a class="adm-icon-btn" [routerLink]="['/admin/products', p.id]" [attr.aria-label]="'Edit ' + p.name"><lucide-icon [img]="I.Pencil" [size]="16" [strokeWidth]="2" /></a>
                  <button type="button" class="adm-icon-btn is-danger" (click)="remove(p)" [attr.aria-label]="'Delete ' + p.name"><lucide-icon [img]="I.Trash2" [size]="16" [strokeWidth]="2" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7"><div class="adm-empty">No products match. <button type="button" class="btn btn-plain btn-sm" (click)="clear()">Clear filters</button></div></td></tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [total]="filtered().length" [pageSize]="pageSize" [(page)]="page" label="Product pages" />
    </div>
  `,
  styles: `
    .actions { display: flex; gap: 8px; }
    .name-cell { max-width: 360px; }
    .name { display: block; font-weight: 600; color: var(--ink); }
    .name:hover { color: var(--accent); }
    .sub { display: block; font-size: 0.75rem; color: var(--ink-3); }
    .was { display: block; color: var(--ink-3); font-size: 0.75rem; }
    .row-actions { white-space: nowrap; text-align: right; }
    .switch.mini { min-height: 0; }
    .switch.mini input { width: 40px; height: 24px; }
    .switch.mini input::after { width: 20px; height: 20px; }
    .switch.mini input:checked::after { transform: translateX(16px); }
  `,
})
export class ProductsPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  private readonly store = inject(AdminCatalogStore);
  private readonly bag = inject(BagStore);
  protected readonly pageSize = PAGE;

  protected readonly q = signal('');
  protected readonly cat = signal('');
  protected readonly stock = signal('');
  protected readonly sort = signal<Sort>('name');
  protected readonly page = signal(1);

  protected readonly inStock = computed(() => this.catalog.allProducts().filter((p) => p.inStock).length);
  protected readonly filtered = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    const list = this.catalog.allProducts().filter(
      (p) =>
        (!this.cat() || p.categoryId === this.cat()) &&
        (!this.stock() || (this.stock() === 'in' ? p.inStock : this.stock() === 'out' ? !p.inStock : !!p.compareAtPrice)) &&
        words.every((w) => `${p.name} ${p.brand ?? ''} ${p.slug}`.toLowerCase().includes(w)),
    );
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      reviews: (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
    };
    return [...list].sort(by[this.sort()]);
  });
  protected readonly shown = computed(() => this.filtered().slice((this.page() - 1) * PAGE, this.page() * PAGE));

  toggleStock(p: Product): void {
    this.store.saveProduct({ ...p, inStock: !p.inStock });
    this.bag.notify(`${p.name} marked ${p.inStock ? 'sold out' : 'in stock'}`);
  }

  remove(p: Product): void {
    if (!confirm(`Delete “${p.name}”? It disappears from the shop.`)) return;
    this.store.deleteProduct(p.id);
    this.bag.notify(`${p.name} deleted`);
  }

  clear(): void {
    this.q.set('');
    this.cat.set('');
    this.stock.set('');
    this.page.set(1);
  }

  exportCsv(): void {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['id', 'name', 'category', 'brand', 'price', 'compareAtPrice', 'inStock', 'rating', 'reviews'],
      ...this.filtered().map((p) => [p.id, p.name, this.catalog.categoryName(p.categoryId), p.brand, p.price, p.compareAtPrice, p.inStock, p.rating, p.reviewCount]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
