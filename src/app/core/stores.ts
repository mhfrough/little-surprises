import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BASKET_BASES, RIBBONS, WRAPS } from './catalog';
import { CityStore } from './catalog.service';
import { BasketLine, Product } from './models';
import { VouchersService, normalise } from './vouchers.service';

/** One row of the bag: a product, or a basket the customer built. */
export interface CartItem {
  key: string;
  kind: 'product' | 'basket';
  productId?: string;
  slug?: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  /** what a custom basket is made of, in words */
  meta?: string;
  note?: string;
}

const STORAGE_KEY = 'gw-bag';
const PROMO_KEY = 'gw-promo';
const FREE_DELIVERY_FROM = 10000;

/** The bag, kept on this device until checkout (no backend yet). Also owns the toast. */
@Injectable({ providedIn: 'root' })
export class BagStore {
  private readonly city = inject(CityStore).city;

  readonly items = signal<CartItem[]>(load());
  readonly toast = signal<{ id: number; text: string } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  readonly count = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  readonly deliveryFee = computed(() => {
    if (!this.items().length || this.subtotal() >= FREE_DELIVERY_FROM) return 0;
    return this.city() === 'karachi' ? 250 : 450;
  });
  readonly freeDeliveryFrom = FREE_DELIVERY_FROM;

  /** The promo code on this bag, re-checked as the bag changes (min spend, expiry). */
  private readonly vouchers = inject(VouchersService);
  readonly promoCode = signal<string>(loadPromo());
  readonly promo = computed(() => (this.promoCode() ? this.vouchers.check(this.promoCode(), this.subtotal(), this.deliveryFee()) : null));
  readonly discount = computed(() => {
    const p = this.promo();
    return p?.ok ? p.discount : 0;
  });
  readonly total = computed(() => Math.max(0, this.subtotal() + this.deliveryFee() - this.discount()));

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
      } catch {
        /* storage blocked — the bag lasts this visit */
      }
    });
    effect(() => {
      try {
        if (this.promoCode()) localStorage.setItem(PROMO_KEY, this.promoCode());
        else localStorage.removeItem(PROMO_KEY);
      } catch {
        /* as above */
      }
    });
  }

  /**
   * Put a code on the bag. Returns the reason when it can't be used at all; a
   * real code that only needs a bigger bag stays on and starts working once it qualifies.
   */
  applyPromo(code: string): string | null {
    const c = normalise(code);
    if (!c) return 'Type a code first.';
    const check = this.vouchers.check(c, this.subtotal(), this.deliveryFee());
    if (!check.ok && !check.keep) return check.reason;
    this.promoCode.set(c);
    return null;
  }

  removePromo(): void {
    this.promoCode.set('');
  }

  add(p: Product, quantity = 1): void {
    const key = `p:${p.id}`;
    this.items.update((items) =>
      items.some((i) => i.key === key)
        ? items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        : [
            ...items,
            { key, kind: 'product', productId: p.id, slug: p.slug, name: p.name, image: p.images[0], unitPrice: p.price, quantity },
          ],
    );
    this.notify(`${p.name} added to your bag`);
  }

  addBasket(item: Omit<CartItem, 'key' | 'kind' | 'quantity'>): void {
    this.items.update((items) => [...items, { ...item, key: `b:${Date.now()}`, kind: 'basket', quantity: 1 }]);
    this.notify('Your basket is in the bag');
  }

  setQuantity(key: string, quantity: number): void {
    this.items.update((items) =>
      quantity <= 0 ? items.filter((i) => i.key !== key) : items.map((i) => (i.key === key ? { ...i, quantity } : i)),
    );
  }

  remove(key: string): void {
    this.items.update((items) => items.filter((i) => i.key !== key));
  }

  clear(): void {
    this.items.set([]);
    this.promoCode.set('');
  }

  notify(text: string): void {
    clearTimeout(this.timer);
    this.toast.set({ id: Date.now(), text });
    this.timer = setTimeout(() => this.toast.set(null), 3200);
  }
}

function loadPromo(): string {
  try {
    return localStorage.getItem(PROMO_KEY) ?? '';
  } catch {
    return '';
  }
}

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** The build-your-own basket. One instance per builder on screen. */
@Injectable()
export class BuilderStore {
  readonly bases = BASKET_BASES;
  readonly wraps = WRAPS;
  readonly ribbons = RIBBONS;

  readonly baseId = signal(BASKET_BASES[0].id);
  readonly wrapId = signal(WRAPS[0].id);
  readonly ribbonId = signal(RIBBONS[0].id);
  readonly note = signal('');
  readonly to = signal('');
  readonly from = signal('');
  readonly lines = signal<BasketLine[]>([]);

  readonly base = computed(() => this.bases.find((b) => b.id === this.baseId())!);
  readonly wrap = computed(() => this.wraps.find((w) => w.id === this.wrapId())!);
  readonly ribbon = computed(() => this.ribbons.find((r) => r.id === this.ribbonId())!);
  readonly itemCount = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  readonly isFull = computed(() => this.itemCount() >= this.base().capacity);
  readonly treatsTotal = computed(() => this.lines().reduce((s, l) => s + l.product.price * l.quantity, 0));
  readonly total = computed(() => this.base().price + this.wrap().price + this.treatsTotal());

  /** The finished basket as one bag line. */
  readonly asCartItem = computed(() => ({
    name: `Custom ${this.base().name.toLowerCase()}`,
    image: this.base().image,
    unitPrice: this.total(),
    meta: [
      `${this.wrap().name} wrap`,
      `${this.ribbon().name} ribbon`,
      ...this.lines().map((l) => `${l.product.name} × ${l.quantity}`),
    ].join(' · '),
    note: [this.to().trim() && `For ${this.to().trim()}`, this.note().trim(), this.from().trim()].filter(Boolean).join(' — ') || undefined,
  }));

  qty(productId: string): number {
    return this.lines().find((l) => l.product.id === productId)?.quantity ?? 0;
  }

  setQty(product: Product, quantity: number): void {
    const others = this.itemCount() - this.qty(product.id);
    const q = Math.max(0, Math.min(quantity, this.base().capacity - others));
    this.lines.update((lines) => {
      const rest = lines.filter((l) => l.product.id !== product.id);
      if (q === 0) return rest;
      const existing = lines.find((l) => l.product.id === product.id);
      return existing
        ? lines.map((l) => (l.product.id === product.id ? { ...l, quantity: q } : l))
        : [...rest, { product, quantity: q }];
    });
  }

  /** Start from a ready combination; anything can still be changed. */
  applyPreset(baseId: string, products: Product[]): void {
    this.baseId.set(baseId);
    const cap = this.base().capacity;
    this.lines.set(products.slice(0, cap).map((product) => ({ product, quantity: 1 })));
  }

  reset(): void {
    this.lines.set([]);
    this.note.set('');
    this.to.set('');
    this.from.set('');
  }
}
