import { Injectable, computed, signal } from '@angular/core';

const KEY = 'ls-orders';

/** An order as it left checkout for WhatsApp. The backend's orders table replaces this. */
export interface Order {
  /** "LS-1042": quoted in the WhatsApp message so both sides can refer to it */
  id: string;
  date: string; // ISO
  name: string;
  phone: string;
  email?: string;
  recipient: string;
  city: string;
  items: number;
  total: number;
  payment: string;
  promo?: string;
  sample?: boolean;
}

const daysAgo = (d: number, h = 13) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(h, (d * 23) % 60, 0, 0);
  return x.toISOString();
};

/**
 * Sample orders, written the way people actually type: the same mobile with and
 * without +92, dashes or spaces, and names spelled two ways, so the Customers
 * page has merging to do.
 */
const SAMPLE: Order[] = [
  { id: 'LS-1049', date: daysAgo(0, 15), name: 'Hassan Butt', phone: '0334 1112223', recipient: 'Ammi', city: 'Lahore', items: 2, total: 8900, payment: 'Cash on delivery' },
  { id: 'LS-1047', date: daysAgo(1, 12), name: 'Bilal Ahmed', phone: '0301-9090909', recipient: 'Client gifts (40)', city: 'Karachi', items: 40, total: 240000, payment: 'Bank transfer or Raast' },
  { id: 'LS-1045', date: daysAgo(2, 18), name: 'Fatima Rizvi', phone: '03127788990', recipient: 'Sara', city: 'Karachi', items: 1, total: 6100, payment: 'JazzCash or Easypaisa', promo: 'GIFT500' },
  { id: 'LS-1042', date: daysAgo(3, 9), name: 'Sana M.', phone: '+92 300 1112233', recipient: 'Hina', city: 'Karachi', items: 1, total: 5400, payment: 'Cash on delivery' },
  { id: 'LS-1039', date: daysAgo(4, 16), name: 'Ayesha K.', phone: '0321-4455667', recipient: 'Zainab', city: 'Karachi', items: 3, total: 7800, payment: 'Debit or credit card', promo: 'WELCOME10' },
  { id: 'LS-1036', date: daysAgo(6, 11), name: 'Omar Farooq', phone: '0302 1234500', email: 'omar.f@example.com', recipient: 'Maryam', city: 'Islamabad', items: 2, total: 4650, payment: 'Cash on delivery' },
  { id: 'LS-1031', date: daysAgo(8, 14), name: 'Komal Yousuf', phone: '0322 5550001', email: 'Komal.Y@example.com', recipient: 'Ammi', city: 'Karachi', items: 1, total: 3900, payment: 'Cash on delivery' },
  { id: 'LS-1028', date: daysAgo(12, 10), name: 'Fatima R.', phone: '0312 7788990', recipient: 'Husband', city: 'Karachi', items: 1, total: 3200, payment: 'Cash on delivery' },
  { id: 'LS-1022', date: daysAgo(15, 17), name: 'Rabia Q.', phone: '0300 5566778', recipient: 'Nani', city: 'Karachi', items: 1, total: 2750, payment: 'JazzCash or Easypaisa', promo: 'FREEDELIVERY' },
].map((o) => ({ ...o, sample: true }));

/** Orders placed from checkout in this browser, newest first, on top of the samples. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly added = signal<Order[]>(read());
  readonly all = computed(() => [...this.added(), ...SAMPLE].sort((a, b) => b.date.localeCompare(a.date)));

  /** Record an order and hand back its reference. */
  add(o: Omit<Order, 'id' | 'date'>): Order {
    const order: Order = { ...o, id: this.nextId(), date: new Date().toISOString() };
    this.added.update((list) => [order, ...list]);
    this.save();
    return order;
  }

  reset(): void {
    this.added.set([]);
    this.save();
  }

  private nextId(): string {
    const top = Math.max(...this.all().map((o) => Number(o.id.replace(/\D/g, '')) || 0));
    return `LS-${top + 1}`;
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.added()));
    } catch {
      /* storage blocked — the log lasts this visit */
    }
  }
}

function read(): Order[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
