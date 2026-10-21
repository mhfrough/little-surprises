import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminCatalogStore } from '../core/admin-catalog.store';
import { OCCASION_DEFS, PRIMARY_CITIES } from '../core/catalog';
import { CatalogService } from '../core/catalog.service';
import { Product } from '../core/models';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const OCCASIONS = ['birthday', 'eid', 'new-baby', 'kids', 'pinktober', 'teachers-day', 'corporate'];

interface Draft {
  name: string;
  slug: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  categoryId: string;
  brand: string;
  images: string;
  occasions: string[];
  cities: string[];
  inStock: boolean;
}

/** Create or edit one product, with a live preview of the shop card. */
@Component({
  selector: 'app-product-edit-page',
  imports: [RouterLink, LucideAngularModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <a routerLink="/admin/products" class="back"><lucide-icon [img]="I.ChevronLeft" [size]="16" [strokeWidth]="2" /> Products</a>
          <h1>{{ isNew() ? 'New product' : 'Edit product' }}</h1>
          @if (!isNew() && original()) { <p>{{ original()!.id }}</p> }
        </div>
        @if (!isNew()) {
          <div class="actions">
            <a class="btn btn-secondary btn-sm" [routerLink]="['/product', draft().slug]" target="_blank"><lucide-icon [img]="I.Eye" [size]="16" [strokeWidth]="2" /> View in shop</a>
            <button type="button" class="btn btn-plain btn-sm danger" (click)="remove()"><lucide-icon [img]="I.Trash2" [size]="16" [strokeWidth]="2" /> Delete</button>
          </div>
        }
      </header>

      @if (!isNew() && !original() && catalog.ready()) {
        <div class="adm-empty">This product doesn't exist (it may have been deleted). <a routerLink="/admin/products" class="btn btn-secondary btn-sm">Back to products</a></div>
      } @else {
        <form class="layout" (submit)="save($event)" novalidate>
          <div class="form">
            <section class="adm-panel">
              <header><h2>Details</h2></header>
              <div class="field">
                <label for="e-name">Name</label>
                <input id="e-name" class="input" required maxlength="120" [value]="draft().name" (input)="setName($any($event.target).value)" />
              </div>
              <div class="field">
                <label for="e-slug">Web address</label>
                <div class="slug"><span>/product/</span><input id="e-slug" class="input" required pattern="[a-z0-9-]+" [value]="draft().slug" (input)="patch({ slug: slug($any($event.target).value) }); slugTouched = true" /></div>
                @if (slugTaken()) { <span class="field-hint is-error">Another product already uses this address.</span> }
              </div>
              <div class="field">
                <label for="e-desc">Description</label>
                <textarea id="e-desc" class="textarea" rows="4" maxlength="1200" [value]="draft().description" (input)="patch({ description: $any($event.target).value })"></textarea>
              </div>
              <div class="two">
                <div class="field">
                  <label for="e-cat">Category</label>
                  <select id="e-cat" class="select" required [value]="draft().categoryId" (change)="patch({ categoryId: $any($event.target).value })">
                    <option value="" disabled>Choose…</option>
                    @for (c of catalog.categories(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
                  </select>
                </div>
                <div class="field">
                  <label for="e-brand">Brand <span class="t-note">(optional)</span></label>
                  <input id="e-brand" class="input" maxlength="60" [value]="draft().brand" (input)="patch({ brand: $any($event.target).value })" list="brands" />
                  <datalist id="brands">@for (b of brands(); track b) { <option [value]="b"></option> }</datalist>
                </div>
              </div>
            </section>

            <section class="adm-panel">
              <header><h2>Price and stock</h2></header>
              <div class="two">
                <div class="field">
                  <label for="e-price">Price (Rs)</label>
                  <input id="e-price" class="input" type="number" min="1" step="1" required [value]="draft().price ?? ''" (input)="patch({ price: num($any($event.target).value) })" />
                </div>
                <div class="field">
                  <label for="e-was">Was (Rs) <span class="t-note">(shows a sale)</span></label>
                  <input id="e-was" class="input" type="number" min="1" step="1" [value]="draft().compareAtPrice ?? ''" (input)="patch({ compareAtPrice: num($any($event.target).value) })" />
                  @if (draft().compareAtPrice && draft().price && draft().compareAtPrice! <= draft().price!) { <span class="field-hint is-error">"Was" must be higher than the price.</span> }
                </div>
              </div>
              <label class="switch"><span>In stock</span><input type="checkbox" role="switch" [checked]="draft().inStock" (change)="patch({ inStock: $any($event.target).checked })" /></label>
            </section>

            <section class="adm-panel">
              <header><h2>Pictures</h2><p>One web address per line. The first is the main picture.</p></header>
              <textarea class="textarea mono" rows="3" aria-label="Picture addresses" [value]="draft().images" (input)="patch({ images: $any($event.target).value })"
                placeholder="images/catalog/my-product-1.webp"></textarea>
              <div class="pics">
                @for (src of imageList(); track src; let i = $index) {
                  <figure><img [src]="src" alt="" width="96" height="96" /><figcaption>{{ i === 0 ? 'Main' : i + 1 }}</figcaption></figure>
                } @empty { <p class="t-small t-note">No pictures yet — the shop will show the placeholder.</p> }
              </div>
            </section>

            <section class="adm-panel">
              <header><h2>Occasions and delivery</h2></header>
              <fieldset>
                <legend class="t-small t-strong">Occasions</legend>
                <div class="chip-row wrap">
                  @for (o of occasions; track o) {
                    <button type="button" class="chip" [attr.aria-pressed]="draft().occasions.includes(o)" (click)="toggle('occasions', o)">{{ occasionName(o) }}</button>
                  }
                </div>
              </fieldset>
              <fieldset>
                <legend class="t-small t-strong">Delivers to <span class="t-note">(none selected = everywhere)</span></legend>
                <div class="chip-row wrap">
                  @for (c of cities; track c) {
                    <button type="button" class="chip" [attr.aria-pressed]="draft().cities.includes(c)" (click)="toggle('cities', c)">{{ cityName(c) }}</button>
                  }
                </div>
              </fieldset>
            </section>
          </div>

          <aside class="side">
            <section class="adm-panel">
              <header><h2>Shop preview</h2></header>
              <div class="preview">
                <img [src]="imageList()[0] || 'brand/placeholder.svg'" alt="" width="320" height="320" />
                <span class="cat">{{ draft().brand ? draft().brand + ' · ' : '' }}{{ catalog.categoryName(draft().categoryId) }}</span>
                <strong class="clamp-2">{{ draft().name || 'Product name' }}</strong>
                <span class="price">{{ (draft().price ?? 0) | money }}@if (draft().compareAtPrice) { <s>{{ draft().compareAtPrice! | money }}</s> }</span>
                @if (!draft().inStock) { <span class="adm-pill is-bad">Sold out</span> }
              </div>
            </section>
            @if (error()) { <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p> }
            <button class="btn btn-primary btn-block"><lucide-icon [img]="I.Save" [size]="18" [strokeWidth]="2" /> {{ isNew() ? 'Create product' : 'Save changes' }}</button>
            <a routerLink="/admin/products" class="btn btn-plain btn-block">Cancel</a>
          </aside>
        </form>
      }
    </div>
  `,
  styles: `
    .back { display: inline-flex; align-items: center; gap: 4px; font-size: var(--text-small); color: var(--ink-2); margin-bottom: 6px; }
    .back:hover { color: var(--accent); }
    .actions { display: flex; gap: 8px; }
    .danger { color: var(--negative); }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
    .form { display: grid; gap: 12px; min-width: 0; }
    .form .input, .form .textarea, .form .select { background: var(--ground); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slug { display: flex; align-items: center; gap: 0; border-radius: var(--radius-sm); background: var(--ground); }
    .slug span { padding-left: 14px; color: var(--ink-3); font-size: var(--text-small); white-space: nowrap; }
    .slug .input { padding-left: 2px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.8125rem; }
    .pics { display: flex; gap: 10px; flex-wrap: wrap; }
    .pics figure { margin: 0; display: grid; gap: 4px; justify-items: center; font-size: 0.75rem; color: var(--ink-3); }
    .pics img { width: 96px; height: 96px; border-radius: 12px; object-fit: cover; background: var(--surface-2); }
    fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 8px; }
    legend { padding: 0; margin-bottom: 4px; }
    .wrap { flex-wrap: wrap; overflow: visible; }
    .side { display: grid; gap: 12px; position: sticky; top: 72px; }
    .preview { display: grid; gap: 4px; }
    .preview img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius); background: var(--surface-2); margin-bottom: 8px; }
    .preview .cat { font-size: 0.8125rem; color: var(--ink-3); }
    .preview strong { font-weight: 600; }
    .preview .price { font-weight: 620; }
    .preview s { margin-left: 8px; color: var(--ink-3); font-weight: 400; }
    .preview .adm-pill { justify-self: start; }
    @media (max-width: 1000px) { .layout { grid-template-columns: minmax(0, 1fr); } .side { position: static; } }
    @media (max-width: 560px) { .two { grid-template-columns: 1fr; } }
  `,
})
export class ProductEditPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  private readonly store = inject(AdminCatalogStore);
  private readonly bag = inject(BagStore);
  private readonly router = inject(Router);

  /** route param; absent on /admin/products/new */
  readonly id = input<string>();
  protected readonly isNew = computed(() => !this.id());
  protected readonly original = computed(() => this.catalog.allProducts().find((p) => p.id === this.id()));
  protected readonly occasions = OCCASIONS;
  protected readonly cities = PRIMARY_CITIES;
  protected slugTouched = false;

  protected readonly draft = signal<Draft>(blank());
  protected readonly error = signal('');
  protected readonly imageList = computed(() => this.draft().images.split(/\s*\n\s*/).map((s) => s.trim()).filter(Boolean));
  protected readonly brands = computed(() => [...new Set(this.catalog.allProducts().map((p) => p.brand).filter((b): b is string => !!b))].sort());
  protected readonly slugTaken = computed(() => {
    const s = this.draft().slug;
    return !!s && this.catalog.allProducts().some((p) => p.slug === s && p.id !== this.id());
  });

  constructor() {
    // load the product into the form once the catalog is there
    effect(() => {
      const p = this.original();
      if (p) {
        this.slugTouched = true;
        this.draft.set({
          name: p.name, slug: p.slug, description: p.description, price: p.price, compareAtPrice: p.compareAtPrice,
          categoryId: p.categoryId, brand: p.brand ?? '', images: p.images.join('\n'), occasions: [...p.occasions],
          cities: [...p.cities], inStock: p.inStock,
        });
      }
    });
  }

  patch(p: Partial<Draft>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  setName(name: string): void {
    this.patch(this.slugTouched ? { name } : { name, slug: slugify(name) });
  }

  slug(v: string): string {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  num(v: string): number | null {
    const n = Number(v);
    return v === '' || Number.isNaN(n) ? null : Math.round(n);
  }

  toggle(key: 'occasions' | 'cities', v: string): void {
    this.draft.update((d) => ({ ...d, [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] }));
  }

  occasionName(id: string): string {
    return OCCASION_DEFS.find((o) => o.id === id)?.name ?? id.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  }

  cityName(c: string): string {
    return c.replace(/^\w/, (x) => x.toUpperCase());
  }

  save(e: SubmitEvent): void {
    e.preventDefault();
    const d = this.draft();
    const problems = [
      !d.name.trim() && 'a name',
      !d.slug && 'a web address',
      this.slugTaken() && 'a web address no other product uses',
      !d.categoryId && 'a category',
      !(d.price && d.price > 0) && 'a price',
      d.compareAtPrice && d.price && d.compareAtPrice <= d.price && 'a "was" price higher than the price',
    ].filter(Boolean);
    if (problems.length) {
      this.error.set(`Please add ${problems.join(', ')}.`);
      return;
    }
    this.error.set('');
    const base = this.original();
    const product: Product = {
      ...(base ?? { rating: 0, reviewCount: 0, tags: [], source: 'giftwifts' as const }),
      id: base?.id ?? d.slug,
      slug: d.slug,
      name: d.name.trim(),
      description: d.description.trim(),
      price: d.price!,
      compareAtPrice: d.compareAtPrice || null,
      images: this.imageList(),
      zoom: base && base.images.join() === this.imageList().join() ? base.zoom : undefined,
      categoryId: d.categoryId,
      brand: d.brand.trim() || null,
      occasions: d.occasions,
      cities: d.cities,
      inStock: d.inStock,
    };
    this.store.saveProduct(product);
    this.bag.notify(this.isNew() ? `${product.name} created` : 'Changes saved');
    if (this.isNew()) this.router.navigate(['/admin/products', product.id]);
  }

  remove(): void {
    const p = this.original();
    if (!p || !confirm(`Delete “${p.name}”? It disappears from the shop.`)) return;
    this.store.deleteProduct(p.id);
    this.bag.notify(`${p.name} deleted`);
    this.router.navigate(['/admin/products']);
  }
}

function blank(): Draft {
  return { name: '', slug: '', description: '', price: null, compareAtPrice: null, categoryId: '', brand: '', images: '', occasions: [], cities: ['karachi'], inStock: true };
}
