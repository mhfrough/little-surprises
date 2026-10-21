import { Injectable, computed, inject, signal } from '@angular/core';
import { InboxMessage, InboxService } from './inbox.service';
import { Order, OrdersService } from './orders.service';

const KEY = 'ls-customer-links';

/** One person, gathered from every order and message that shares a mobile or email with them. */
export interface Customer {
  /** stable while their contacts don't change: the first of their contact keys */
  id: string;
  name: string;
  /** every spelling they've used, most recent first */
  names: string[];
  phones: string[];
  emails: string[];
  orders: Order[];
  messages: InboxMessage[];
  spend: number;
  firstSeen: string;
  lastSeen: string;
  city: string | null;
  openComplaints: number;
  /** how they heard about us, from their survey */
  source: string | null;
  /** contact keys the operator joined by hand, so the merge can be undone */
  manual: [string, string][];
}

/** Two customers that are probably one person: same first name and surname initial, nothing in common to merge on. */
export interface DuplicateHint {
  a: Customer;
  b: Customer;
}

interface Links {
  /** contact-key pairs the operator said are the same person */
  merged: [string, string][];
  /** customer-id pairs the operator said are different people */
  distinct: [string, string][];
}

/** "+92 300 111-2233", "0300 1112233", "3001112233" → "03001112233". Empty when it isn't a Pakistani mobile-length number. */
export function phoneKey(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) d = '0' + d.slice(2);
  if (d.startsWith('3') && d.length === 10) d = '0' + d;
  return d.length >= 10 ? d : '';
}

export function formatPhone(key: string): string {
  return key.length === 11 ? `${key.slice(0, 4)} ${key.slice(4)}` : key;
}

const emailKey = (raw: string) => raw.trim().toLowerCase();

/** "Bilal A." and "Bilal Ahmed" → same first name, same initial. */
function sameishName(a: string, b: string): boolean {
  const parts = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const [fa, ...ra] = parts(a);
  const [fb, ...rb] = parts(b);
  if (!fa || fa !== fb) return false;
  if (!ra.length || !rb.length) return true;
  return ra[0][0] === rb[0][0];
}

/** One order or message, with the contact keys it carries. */
interface Touch {
  keys: string[];
  name: string;
  date: string;
  order?: Order;
  message?: InboxMessage;
}

/**
 * Customers aren't stored: they're worked out from orders and inbox messages.
 * Anything that shares a mobile number or an email is the same person, so an
 * order with a phone and an email ties that phone's and that email's histories
 * together. The operator can also join two customers by hand (kept here until the
 * backend has a customers table) or mark a suggested pair as different people.
 */
@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly orders = inject(OrdersService);
  private readonly inbox = inject(InboxService);
  private readonly links = signal<Links>(read());

  readonly all = computed<Customer[]>(() => {
    const touches: Touch[] = [
      ...this.orders.all().map((o) => ({
        keys: [phoneKey(o.phone) && `p:${phoneKey(o.phone)}`, o.email && `e:${emailKey(o.email)}`].filter(Boolean) as string[],
        name: o.name,
        date: o.date,
        order: o,
      })),
      ...this.inbox.all().map((m) => {
        const c = m.contact.trim();
        const key = c.includes('@') ? `e:${emailKey(c)}` : phoneKey(c) ? `p:${phoneKey(c)}` : '';
        return { keys: key ? [key] : [], name: m.name, date: m.date, message: m };
      }),
    ].filter((t) => t.keys.length);

    // union-find over contact keys
    const parent = new Map<string, string>();
    const find = (k: string): string => {
      if (!parent.has(k)) parent.set(k, k);
      const p = parent.get(k)!;
      if (p === k) return k;
      const root = find(p);
      parent.set(k, root);
      return root;
    };
    const join = (a: string, b: string) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(ra < rb ? rb : ra, ra < rb ? ra : rb);
    };
    for (const t of touches) for (const k of t.keys.slice(1)) join(t.keys[0], k);
    const manual = this.links().merged;
    for (const [a, b] of manual) join(a, b);

    const groups = new Map<string, Touch[]>();
    for (const t of touches) {
      const root = find(t.keys[0]);
      groups.set(root, [...(groups.get(root) ?? []), t]);
    }

    return [...groups.entries()]
      .map(([root, ts]) => {
        ts.sort((a, b) => b.date.localeCompare(a.date));
        const keys = new Set(ts.flatMap((t) => t.keys));
        const orders = ts.flatMap((t) => (t.order ? [t.order] : []));
        const messages = ts.flatMap((t) => (t.message ? [t.message] : []));
        // the name from their latest order reads best (they typed it fully); else the latest message
        const names = [...new Set([...orders.map((o) => o.name), ...messages.map((m) => m.name)])];
        return {
          id: root,
          name: names[0],
          names,
          phones: [...keys].filter((k) => k.startsWith('p:')).map((k) => k.slice(2)),
          emails: [...keys].filter((k) => k.startsWith('e:')).map((k) => k.slice(2)),
          orders,
          messages,
          spend: orders.reduce((s, o) => s + o.total, 0),
          firstSeen: ts[ts.length - 1].date,
          lastSeen: ts[0].date,
          city: orders[0]?.city ?? null,
          openComplaints: messages.filter((m) => m.type === 'complaint' && m.status !== 'resolved' && m.status !== 'archived').length,
          source: messages.find((m) => m.source)?.source ?? null,
          manual: manual.filter(([a]) => keys.has(a)),
        } satisfies Customer;
      })
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  });

  readonly duplicates = computed<DuplicateHint[]>(() => {
    const list = this.all();
    const distinct = new Set(this.links().distinct.map(([a, b]) => [a, b].sort().join('|')));
    const out: DuplicateHint[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (distinct.has([a.id, b.id].sort().join('|'))) continue;
        if (a.names.some((x) => b.names.some((y) => sameishName(x, y)))) out.push({ a, b });
      }
    }
    return out;
  });

  byId(id: string): Customer | undefined {
    return this.all().find((c) => c.id === id);
  }

  /** Join two customers: from now on their orders and messages are one history. */
  merge(a: Customer, b: Customer): void {
    this.update((l) => ({ ...l, merged: [...l.merged, [a.id, b.id]] }));
  }

  /** Undo a hand-made join. */
  unmerge(pair: [string, string]): void {
    this.update((l) => ({ ...l, merged: l.merged.filter(([a, b]) => !(a === pair[0] && b === pair[1])) }));
  }

  /** "These are different people": stop suggesting the pair. */
  keepApart(a: Customer, b: Customer): void {
    this.update((l) => ({ ...l, distinct: [...l.distinct, [a.id, b.id]] }));
  }

  reset(): void {
    this.update(() => ({ merged: [], distinct: [] }));
  }

  private update(fn: (l: Links) => Links): void {
    this.links.update(fn);
    try {
      localStorage.setItem(KEY, JSON.stringify(this.links()));
    } catch {
      /* storage blocked — lasts this visit */
    }
  }
}

function read(): Links {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return { merged: Array.isArray(v?.merged) ? v.merged : [], distinct: Array.isArray(v?.distinct) ? v.distinct : [] };
  } catch {
    return { merged: [], distinct: [] };
  }
}
