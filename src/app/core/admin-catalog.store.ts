import { Injectable, computed, signal } from '@angular/core';
import { Category, Product } from './models';

const KEY = 'ls-admin-catalog';

interface Overrides {
  products: Record<string, Product>;
  deletedProducts: string[];
  categories: Record<string, Category>;
  deletedCategories: string[];
}

const EMPTY: Overrides = { products: {}, deletedProducts: [], categories: {}, deletedCategories: [] };

/**
 * Operator edits to the catalog, kept on this device until the NestJS API
 * exists. CatalogService applies them on top of catalog.json, so the shop
 * shows what the operator saved. Replace with API calls later.
 */
@Injectable({ providedIn: 'root' })
export class AdminCatalogStore {
  private readonly state = signal<Overrides>(read());
  readonly overrides = this.state.asReadonly();
  readonly changeCount = computed(() => {
    const s = this.state();
    return Object.keys(s.products).length + s.deletedProducts.length + Object.keys(s.categories).length + s.deletedCategories.length;
  });

  applyProducts(base: Product[]): Product[] {
    const s = this.state();
    const deleted = new Set(s.deletedProducts);
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of base) {
      if (deleted.has(p.id)) continue;
      out.push(s.products[p.id] ?? p);
      seen.add(p.id);
    }
    // new products go first, newest first
    const added = Object.values(s.products).filter((p) => !seen.has(p.id) && !deleted.has(p.id));
    return [...added.reverse(), ...out];
  }

  applyCategories(base: Category[]): Category[] {
    const s = this.state();
    const deleted = new Set(s.deletedCategories);
    const seen = new Set<string>();
    const out: Category[] = [];
    for (const c of base) {
      if (deleted.has(c.id)) continue;
      out.push(s.categories[c.id] ?? c);
      seen.add(c.id);
    }
    return [...out, ...Object.values(s.categories).filter((c) => !seen.has(c.id) && !deleted.has(c.id))];
  }

  saveProduct(p: Product): void {
    this.update((s) => ({ ...s, products: { ...s.products, [p.id]: p }, deletedProducts: s.deletedProducts.filter((x) => x !== p.id) }));
  }

  deleteProduct(id: string): void {
    this.update((s) => {
      const { [id]: _, ...rest } = s.products;
      return { ...s, products: rest, deletedProducts: [...new Set([...s.deletedProducts, id])] };
    });
  }

  saveCategory(c: Category): void {
    this.update((s) => ({ ...s, categories: { ...s.categories, [c.id]: c }, deletedCategories: s.deletedCategories.filter((x) => x !== c.id) }));
  }

  deleteCategory(id: string): void {
    this.update((s) => {
      const { [id]: _, ...rest } = s.categories;
      return { ...s, categories: rest, deletedCategories: [...new Set([...s.deletedCategories, id])] };
    });
  }

  /** Throw away every local edit and go back to catalog.json. */
  reset(): void {
    this.update(() => EMPTY);
  }

  private update(fn: (s: Overrides) => Overrides): void {
    this.state.update(fn);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state()));
    } catch {
      /* storage full or blocked — edits last this visit */
    }
  }
}

function read(): Overrides {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v === 'object' ? { ...EMPTY, ...v } : EMPTY;
  } catch {
    return EMPTY;
  }
}
