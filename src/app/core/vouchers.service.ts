import { Injectable, computed, signal } from '@angular/core';

const KEY = 'ls-vouchers';

/** What a code takes off: a share of the items, a fixed amount, or the delivery fee. */
export type VoucherKind = 'percent' | 'amount' | 'delivery';

export interface Voucher {
  /** what shoppers type; stored upper case, unique */
  code: string;
  /** shown to the shopper when the code is applied, e.g. "10% off your first order" */
  description: string;
  kind: VoucherKind;
  /** percent (1–100) or rupees; unused for free delivery */
  value: number;
  /** cap on a percent discount, in rupees */
  maxDiscount: number | null;
  /** items subtotal needed before the code works */
  minSpend: number;
  /** YYYY-MM-DD, local; null = no limit */
  startsOn: string | null;
  endsOn: string | null;
  /** total redemptions allowed; null = unlimited */
  limit: number | null;
  used: number;
  active: boolean;
  /** advertised in the announcement bar across the shop (one at a time) */
  featured: boolean;
  createdAt: string;
}

export type VoucherStatus = 'active' | 'scheduled' | 'ended' | 'used-up' | 'off';

export type VoucherCheck =
  | { ok: true; voucher: Voucher; discount: number; freeDelivery: boolean }
  /** `keep` = the code is real and may work later in this order (spend more); leave it applied */
  | { ok: false; voucher: Voucher | null; reason: string; keep: boolean };

const fmt = (n: number) => `Rs ${n.toLocaleString('en-PK')}`;
const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Today as YYYY-MM-DD in the shopper's time zone. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function voucherStatus(v: Voucher, on = today()): VoucherStatus {
  if (!v.active) return 'off';
  if (v.startsOn && v.startsOn > on) return 'scheduled';
  if (v.endsOn && v.endsOn < on) return 'ended';
  if (v.limit !== null && v.used >= v.limit) return 'used-up';
  return 'active';
}

/** "10% off (up to Rs 1,500)", "Rs 500 off", "Free delivery". */
export function voucherOffer(v: Pick<Voucher, 'kind' | 'value' | 'maxDiscount'>): string {
  if (v.kind === 'delivery') return 'Free delivery';
  if (v.kind === 'amount') return `${fmt(v.value)} off`;
  return `${v.value}% off` + (v.maxDiscount ? ` (up to ${fmt(v.maxDiscount)})` : '');
}

const seed = (): Voucher[] => {
  const t = today();
  const plus = (days: number) => {
    const d = new Date(`${t}T00:00:00`);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const base = { maxDiscount: null, minSpend: 0, startsOn: null, endsOn: null, limit: null, used: 0, active: true, featured: false, createdAt: t };
  return [
    { ...base, code: 'WELCOME10', description: '10% off your first order', kind: 'percent', value: 10, maxDiscount: 1500, minSpend: 3000, used: 38 },
    { ...base, code: 'FREEDELIVERY', description: 'Free delivery on orders over Rs 5,000', kind: 'delivery', value: 0, minSpend: 5000, used: 112 },
    { ...base, code: 'GIFT500', description: 'Rs 500 off gifts over Rs 6,000', kind: 'amount', value: 500, minSpend: 6000, endsOn: plus(30), limit: 200, used: 61, featured: true },
  ];
};

/**
 * Promo codes. Kept on this device until the NestJS API exists: the operator's
 * list lives in localStorage and the shop reads the same list, so a code made
 * in the portal works at checkout in this browser. Replace with API calls later
 * (and check codes on the server: anything client-side can be edited).
 */
@Injectable({ providedIn: 'root' })
export class VouchersService {
  private readonly state = signal<Voucher[]>(read());
  readonly all = this.state.asReadonly();
  readonly featured = computed(() => this.all().find((v) => v.featured && voucherStatus(v) === 'active') ?? null);

  find(code: string): Voucher | undefined {
    const c = normalise(code);
    return this.all().find((v) => v.code === c);
  }

  /** Whether `code` works on a bag with this items subtotal and delivery fee, and how much it takes off. */
  check(code: string, subtotal: number, deliveryFee: number): VoucherCheck {
    const v = this.find(code);
    if (!v) return { ok: false, voucher: null, reason: 'We don’t recognise that code. Check the spelling?', keep: false };
    switch (voucherStatus(v)) {
      case 'off':
        return { ok: false, voucher: v, reason: 'That code isn’t active right now.', keep: false };
      case 'scheduled':
        return { ok: false, voucher: v, reason: `That code starts on ${day(v.startsOn!)}.`, keep: false };
      case 'ended':
        return { ok: false, voucher: v, reason: `That code ended on ${day(v.endsOn!)}.`, keep: false };
      case 'used-up':
        return { ok: false, voucher: v, reason: 'That code has been fully used, sorry.', keep: false };
    }
    if (subtotal < v.minSpend) {
      return { ok: false, voucher: v, reason: `Add ${fmt(v.minSpend - subtotal)} more to use ${v.code}.`, keep: true };
    }
    if (v.kind === 'delivery') return { ok: true, voucher: v, discount: deliveryFee, freeDelivery: true };
    const raw = v.kind === 'percent' ? Math.round((subtotal * v.value) / 100) : v.value;
    const discount = Math.min(raw, v.maxDiscount ?? Infinity, subtotal);
    return { ok: true, voucher: v, discount, freeDelivery: false };
  }

  /** Count one use when an order goes out with the code. */
  redeem(code: string): void {
    const c = normalise(code);
    this.update((list) => list.map((v) => (v.code === c ? { ...v, used: v.used + 1 } : v)));
  }

  /** Create or replace; `previousCode` when an edit renamed it. Only one voucher can be featured. */
  save(v: Voucher, previousCode?: string): void {
    const next = { ...v, code: normalise(v.code) };
    const old = normalise(previousCode ?? v.code);
    this.update((list) => {
      const others = next.featured ? list.map((x) => ({ ...x, featured: false })) : list;
      const at = others.findIndex((x) => x.code === old);
      return at < 0 ? [next, ...others] : others.map((x, i) => (i === at ? next : x));
    });
  }

  setActive(code: string, active: boolean): void {
    this.update((list) => list.map((v) => (v.code === code ? { ...v, active } : v)));
  }

  remove(code: string): void {
    this.update((list) => list.filter((v) => v.code !== code));
  }

  /** Back to the starter codes (part of "Reset demo data"). */
  reset(): void {
    this.update(() => seed());
  }

  private update(fn: (list: Voucher[]) => Voucher[]): void {
    this.state.update(fn);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state()));
    } catch {
      /* storage blocked — changes last this visit */
    }
  }
}

/** Codes are case- and space-insensitive: " welcome 10" finds WELCOME10. */
export function normalise(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '');
}

function read(): Voucher[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return Array.isArray(v) ? v : seed();
  } catch {
    return seed();
  }
}
