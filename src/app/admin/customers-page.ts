import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Customer, CustomersService, formatPhone } from '../core/customers.service';
import { TYPE_LABEL } from '../core/inbox.service';
import { BagStore } from '../core/stores';
import { Drawer } from '../shared/drawer';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

type Filter = 'all' | 'buyers' | 'repeat' | 'complaints';

/** A row of a customer's history: an order or a message, newest first. */
interface Event {
  date: string;
  kind: 'order' | 'message';
  title: string;
  detail: string;
  amount?: number;
  tone?: 'bad';
  link?: unknown[];
  query?: Record<string, string>;
}

const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 30 ? `${days} days ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/**
 * Everyone who has ordered or written in, one row per person. Orders and
 * messages that share a mobile number or email are joined automatically;
 * look-alike names with nothing in common are offered for a one-click merge.
 */
@Component({
  selector: 'app-customers-page',
  imports: [RouterLink, LucideAngularModule, Drawer, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Customers</h1>
          <p>{{ people().length }} people · {{ repeatCount() }} ordered more than once · {{ totalSpend() | money }} in orders</p>
        </div>
      </header>

      @if (customers.duplicates().length) {
        <section class="adm-panel dupes" aria-labelledby="dupes-title">
          <header><h2 id="dupes-title">Possibly the same person</h2><p>Same first name and initial, but no mobile or email in common</p></header>
          <ul role="list">
            @for (d of customers.duplicates(); track d.a.id + d.b.id) {
              <li>
                <div class="pair">
                  <span class="who"><strong>{{ d.a.name }}</strong><span>{{ contactLine(d.a) }} · {{ summary(d.a) }}</span></span>
                  <lucide-icon [img]="I.ArrowRight" [size]="16" [strokeWidth]="2" class="arrow" />
                  <span class="who"><strong>{{ d.b.name }}</strong><span>{{ contactLine(d.b) }} · {{ summary(d.b) }}</span></span>
                </div>
                <div class="pair-actions">
                  <button type="button" class="btn btn-primary btn-sm" (click)="merge(d.a, d.b)">Merge</button>
                  <button type="button" class="btn btn-plain btn-sm" (click)="keepApart(d.a, d.b)">Different people</button>
                </div>
              </li>
            }
          </ul>
        </section>
      }

      <div class="adm-toolbar">
        <div class="segmented" role="group" aria-label="Show">
          @for (f of filters; track f.id) {
            <button type="button" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">{{ f.label }}</button>
          }
        </div>
        <div class="search-field">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="cu-q">Search customers</label>
          <input id="cu-q" class="input" type="search" placeholder="Search name, mobile or email" [value]="q()" (input)="q.set($any($event.target).value)" />
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr>
            <th scope="col">Customer</th><th scope="col" class="num">Orders</th><th scope="col" class="num">Spent</th>
            <th scope="col">Messages</th><th scope="col">City</th><th scope="col">Last seen</th>
          </tr></thead>
          <tbody>
            @for (c of people(); track c.id) {
              <tr class="clickable" [class.is-editing]="openId() === c.id" (click)="openId.set(c.id)">
                <td>
                  <button type="button" class="name-btn" (click)="$event.stopPropagation(); openId.set(c.id)">{{ c.name }}</button>
                  @if (c.manual.length) { <span class="tag" title="Joined by hand">merged</span> }
                  <span class="sub clamp-1">{{ contactLine(c) }}</span>
                </td>
                <td class="num t-num">{{ c.orders.length || '—' }}</td>
                <td class="num t-num">{{ c.spend ? (c.spend | money) : '—' }}</td>
                <td>
                  {{ c.messages.length || '—' }}
                  @if (c.openComplaints) { <span class="adm-pill is-bad">{{ c.openComplaints }} complaint{{ c.openComplaints > 1 ? 's' : '' }} open</span> }
                </td>
                <td>{{ c.city ?? '—' }}</td>
                <td class="when">{{ ago(c.lastSeen) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="adm-empty">No customers match.</div></td></tr>
            }
          </tbody>
        </table>
      </div>

      <app-drawer [open]="!!open()" [heading]="open()?.name ?? 'Customer'" (closed)="openId.set(null)">
        @if (open(); as c) {
          <div class="profile">
            <dl class="stats">
              <div><dt>Orders</dt><dd class="t-num">{{ c.orders.length }}</dd></div>
              <div><dt>Spent</dt><dd class="t-num">{{ c.spend | money }}</dd></div>
              <div><dt>Customer since</dt><dd>{{ day(c.firstSeen) }}</dd></div>
            </dl>

            <section>
              <h3>Contact</h3>
              <ul class="contacts" role="list">
                @for (p of c.phones; track p) {
                  <li><lucide-icon [img]="I.Phone" [size]="16" [strokeWidth]="2" /><a [href]="'tel:' + p">{{ phone(p) }}</a>
                    <a class="wa" [href]="'https://wa.me/92' + p.slice(1)" target="_blank" rel="noopener">WhatsApp</a></li>
                }
                @for (e of c.emails; track e) {
                  <li><lucide-icon [img]="I.Mail" [size]="16" [strokeWidth]="2" /><a [href]="'mailto:' + e">{{ e }}</a></li>
                }
              </ul>
              @if (c.names.length > 1) { <p class="t-small t-muted">Also wrote as {{ c.names.slice(1).join(', ') }}</p> }
              @if (c.source) { <p class="t-small t-muted">Found us through {{ c.source }}</p> }
            </section>

            <section>
              <h3>History</h3>
              <ol class="timeline" role="list">
                @for (e of history(); track e.date + e.title) {
                  <li [class.is-bad]="e.tone === 'bad'">
                    <span class="dot" aria-hidden="true"></span>
                    <div>
                      <div class="ev-head">
                        @if (e.link) { <a [routerLink]="e.link" [queryParams]="e.query">{{ e.title }}</a> } @else { <strong>{{ e.title }}</strong> }
                        @if (e.amount) { <span class="t-num amt">{{ e.amount | money }}</span> }
                      </div>
                      <span class="ev-detail">{{ e.detail }} · {{ ago(e.date) }}</span>
                    </div>
                  </li>
                }
              </ol>
            </section>

            @if (c.manual.length) {
              <section>
                <h3>Merged by hand</h3>
                <ul class="contacts" role="list">
                  @for (m of c.manual; track m[0] + m[1]) {
                    <li><span class="sub">{{ keyLabel(m[0]) }} + {{ keyLabel(m[1]) }}</span>
                      <button type="button" class="btn btn-plain btn-sm" (click)="unmerge(m)">Undo</button></li>
                  }
                </ul>
              </section>
            }
          </div>
        }
      </app-drawer>
    </div>
  `,
  styles: `
    .dupes ul { display: grid; gap: 8px; }
    .dupes li { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--ground); }
    .pair { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; min-width: 0; }
    .who { display: grid; font-size: var(--text-small); }
    .who span { color: var(--ink-3); font-size: 0.75rem; }
    .arrow { color: var(--ink-3); }
    .pair-actions { display: flex; gap: 6px; }
    tr.clickable { cursor: pointer; }
    tr.clickable:hover { background: var(--surface-2); }
    tr.is-editing { background: color-mix(in srgb, var(--accent) 6%, transparent); }
    .name-btn { font-weight: 620; color: var(--ink); text-align: left; }
    .name-btn:hover { text-decoration: underline; text-underline-offset: 3px; }
    .tag { margin-left: 6px; padding: 1px 7px; border-radius: var(--radius-pill); background: var(--surface-2); font-size: 0.6875rem; font-weight: 650; color: var(--ink-2); }
    .sub { display: block; max-width: 320px; font-size: 0.75rem; color: var(--ink-3); }
    td .adm-pill { margin-left: 6px; }
    .when { white-space: nowrap; color: var(--ink-2); }
    .profile { display: grid; gap: 24px; }
    .profile h3 { font-size: 0.8125rem; font-weight: 650; color: var(--ink-2); margin-bottom: 8px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0; }
    .stats div { padding: 12px; border-radius: var(--radius-sm); background: var(--surface); }
    .stats dt { font-size: 0.75rem; color: var(--ink-3); }
    .stats dd { margin: 2px 0 0; font-weight: 650; font-size: 1.0625rem; }
    .contacts { display: grid; gap: 8px; }
    .contacts li { display: flex; align-items: center; gap: 10px; font-size: var(--text-small); }
    .contacts lucide-icon { color: var(--ink-3); flex: none; }
    .contacts a { color: var(--ink); }
    .contacts .wa { margin-left: auto; font-weight: 600; color: var(--positive); }
    .contacts .btn { margin-left: auto; }
    .timeline { display: grid; gap: 0; }
    .timeline li { position: relative; display: grid; grid-template-columns: 14px 1fr; gap: 12px; padding-bottom: 16px; }
    .timeline li:not(:last-child)::before { content: ''; position: absolute; left: 6px; top: 14px; bottom: 0; width: 2px; background: var(--surface-2); }
    .dot { width: 14px; height: 14px; margin-top: 3px; border-radius: 50%; background: var(--surface); box-shadow: inset 0 0 0 3px var(--accent); }
    .timeline li.is-bad .dot { box-shadow: inset 0 0 0 3px var(--negative); }
    .ev-head { display: flex; justify-content: space-between; gap: 10px; font-size: var(--text-small); }
    .ev-head a { font-weight: 620; color: var(--accent); }
    .amt { font-weight: 650; }
    .ev-detail { font-size: 0.75rem; color: var(--ink-3); }
  `,
})
export class CustomersPage {
  protected readonly I = I;
  protected readonly customers = inject(CustomersService);
  private readonly bag = inject(BagStore);
  protected readonly ago = ago;
  protected readonly phone = formatPhone;
  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Everyone' },
    { id: 'buyers', label: 'Ordered' },
    { id: 'repeat', label: 'Repeat' },
    { id: 'complaints', label: 'Open complaints' },
  ];

  protected readonly filter = signal<Filter>('all');
  protected readonly q = signal('');
  protected readonly openId = signal<string | null>(null);
  protected readonly open = computed(() => (this.openId() ? (this.customers.byId(this.openId()!) ?? null) : null));

  protected readonly people = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    const digits = this.q().replace(/\D/g, '');
    return this.customers.all().filter((c) => {
      const f = this.filter();
      if (f === 'buyers' && !c.orders.length) return false;
      if (f === 'repeat' && c.orders.length < 2) return false;
      if (f === 'complaints' && !c.openComplaints) return false;
      if (!words.length) return true;
      // phones match on digits, so "0300 111" finds 03001112233
      if (digits.length >= 3 && c.phones.some((p) => p.includes(digits.replace(/^92/, '0')))) return true;
      const hay = `${c.names.join(' ')} ${c.emails.join(' ')}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  });

  protected readonly repeatCount = computed(() => this.customers.all().filter((c) => c.orders.length > 1).length);
  protected readonly totalSpend = computed(() => this.customers.all().reduce((s, c) => s + c.spend, 0));

  protected readonly history = computed<Event[]>(() => {
    const c = this.open();
    if (!c) return [];
    const events: Event[] = [
      ...c.orders.map((o) => ({
        date: o.date,
        kind: 'order' as const,
        title: `Order ${o.id}`,
        detail: [`${o.items} item${o.items > 1 ? 's' : ''} for ${o.recipient}`, o.city, o.payment, o.promo && `code ${o.promo}`].filter(Boolean).join(' · '),
        amount: o.total,
      })),
      ...c.messages.map((m) => ({
        date: m.date,
        kind: 'message' as const,
        title: `${TYPE_LABEL[m.type]}: ${m.subject}`,
        detail: m.type === 'survey' && m.rating ? `${m.rating}/5 · ${m.status}` : m.status,
        tone: m.type === 'complaint' && m.status !== 'resolved' && m.status !== 'archived' ? ('bad' as const) : undefined,
        link: ['/admin/inbox'],
        query: { id: m.id },
      })),
    ];
    return events.sort((a, b) => b.date.localeCompare(a.date));
  });

  contactLine(c: Customer): string {
    return [...c.phones.map(formatPhone), ...c.emails].join(' · ');
  }

  summary(c: Customer): string {
    const parts = [];
    if (c.orders.length) parts.push(`${c.orders.length} order${c.orders.length > 1 ? 's' : ''}`);
    if (c.messages.length) parts.push(`${c.messages.length} message${c.messages.length > 1 ? 's' : ''}`);
    return parts.join(', ');
  }

  keyLabel(key: string): string {
    return key.startsWith('p:') ? formatPhone(key.slice(2)) : key.slice(2);
  }

  day(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  merge(a: Customer, b: Customer): void {
    this.customers.merge(a, b);
    this.bag.notify(`${a.name} and ${b.name} are now one customer`);
  }

  keepApart(a: Customer, b: Customer): void {
    this.customers.keepApart(a, b);
    this.bag.notify('Kept as two customers');
  }

  unmerge(pair: [string, string]): void {
    this.customers.unmerge(pair);
    this.openId.set(null);
    this.bag.notify('Merge undone');
  }
}
