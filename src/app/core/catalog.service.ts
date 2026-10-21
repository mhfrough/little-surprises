import { httpResource } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AdminCatalogStore } from './admin-catalog.store';
import { OCCASION_DEFS, PRIMARY_CITIES } from './catalog';
import { Catalog, Category, Occasion, Product } from './models';

/** Delivery city. Karachi first; the choice is remembered on this device. */
@Injectable({ providedIn: 'root' })
export class CityStore {
  readonly city = signal(read() ?? 'karachi');
  readonly isKarachi = computed(() => this.city() === 'karachi');

  constructor() {
    effect(() => {
      try {
        localStorage.setItem('gw-city', this.city());
      } catch {
        /* storage blocked — the choice lasts this visit */
      }
    });
  }
}

function read(): string | null {
  try {
    return localStorage.getItem('gw-city');
  } catch {
    return null;
  }
}

export const cityLabel = (c: string) => c.replace(/(^|[\s-])\w/g, (m) => m.toUpperCase());

/**
 * The catalog, from public/data/catalog.json for now. When the NestJS API
 * exists, point the resource at it; nothing else needs to change.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly city = inject(CityStore).city;

  private readonly res = httpResource<Catalog>(() => 'data/catalog.json');

  readonly loading = computed(() => this.res.isLoading());
  readonly error = computed(() => this.res.error());
  private readonly data = computed(() => (this.res.hasValue() ? this.res.value() : undefined));
  private readonly admin = inject(AdminCatalogStore);

  /** Every product, with the operator's local edits applied (including other cities' and sold-out ones). */
  readonly allProducts = computed<Product[]>(() => this.admin.applyProducts(this.data()?.products ?? []));
  private readonly all = this.allProducts;

  /** Categories with live counts and a picture from their first product. */
  readonly categories = computed<Category[]>(() => {
    const products = this.allProducts();
    return this.admin.applyCategories(this.data()?.categories ?? []).map((c) => {
      const items = products.filter((p) => p.categoryId === c.id);
      return { ...c, count: items.length, image: c.image || items[0]?.images[0] || null };
    });
  });

  /** Products that deliver to the chosen city, in-stock first. */
  readonly products = computed(() => {
    const c = this.city();
    return this.all()
      .filter((p) => p.cities.length === 0 || p.cities.includes(c))
      .sort((a, b) => Number(b.inStock) - Number(a.inStock));
  });

  readonly cities = computed(() => {
    const set = new Set(this.all().flatMap((p) => p.cities));
    const rest = [...set].filter((c) => !PRIMARY_CITIES.includes(c)).sort();
    return [...PRIMARY_CITIES.filter((c) => set.has(c)), ...rest];
  });

  readonly occasions = computed<Occasion[]>(() =>
    OCCASION_DEFS.map((o) => {
      const items = this.products().filter(o.match);
      return { id: o.id, name: o.name, count: items.length, image: items[0]?.images[0] ?? '' };
    }).filter((o) => o.count > 0),
  );

  readonly ready = computed(() => this.res.hasValue());

  /** Try loading the catalog again after a failure. */
  retry(): void {
    this.res.reload();
  }

  categoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? '';
  }

  category(slug: string): Category | undefined {
    return this.categories().find((c) => c.slug === slug);
  }

  inCategory(id: string): Product[] {
    return this.products().filter((p) => p.categoryId === id);
  }

  /** Any product, even one that doesn't deliver to the chosen city (a shared link must still open). */
  bySlug(slug: string): Product | undefined {
    return this.all().find((p) => p.slug === slug);
  }

  deliversTo(p: Product, city = this.city()): boolean {
    return p.cities.length === 0 || p.cities.includes(city);
  }

  related(p: Product, limit = 4): Product[] {
    const same = this.products().filter((x) => x.id !== p.id && x.inStock && x.categoryId === p.categoryId);
    const brand = same.filter((x) => p.brand && x.brand === p.brand);
    return [...new Set([...brand, ...same])].slice(0, limit);
  }

  occasionName(id: string): string {
    return OCCASION_DEFS.find((o) => o.id === id)?.name ?? '';
  }

  inOccasion(id: string): Product[] {
    const def = OCCASION_DEFS.find((o) => o.id === id);
    return def ? this.products().filter(def.match) : [];
  }
}
