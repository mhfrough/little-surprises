import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { InboxMessage, InboxService, MessageStatus, MessageType, TYPE_LABEL } from '../core/inbox.service';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';
import { Rating } from '../shared/rating';

type Tab = 'all' | MessageType;
type StatusFilter = 'open' | 'new' | 'resolved' | 'archived' | 'any';

/** Contact messages, complaints, feedback and surveys: read, reply, resolve. */
@Component({
  selector: 'app-inbox-page',
  imports: [LucideAngularModule, Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Inbox</h1>
          <p>{{ inbox.unread() }} new · contact form, complaints, feedback and after-order surveys</p>
        </div>
      </header>

      <div class="adm-toolbar">
        <div class="segmented" role="group" aria-label="Type">
          @for (t of tabs(); track t.id) {
            <button type="button" [attr.aria-pressed]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }} <span class="n">{{ t.count }}</span></button>
          }
        </div>
        <label><span class="visually-hidden">Status</span>
          <select class="select" [value]="status()" (change)="status.set($any($event.target).value)">
            <option value="open">Open (new and read)</option><option value="new">New only</option><option value="resolved">Resolved</option>
            <option value="archived">Archived</option><option value="any">Everything</option>
          </select>
        </label>
        <div class="search-field">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="ib-q">Search messages</label>
          <input id="ib-q" class="input" type="search" placeholder="Search name, subject, order" [value]="q()" (input)="q.set($any($event.target).value)" />
        </div>
      </div>

      <div class="split">
        <ul class="list" role="listbox" aria-label="Messages">
          @for (m of filtered(); track m.id) {
            <li role="option" [attr.aria-selected]="selected()?.id === m.id">
              <button type="button" class="item" [class.is-new]="m.status === 'new'" (click)="open(m.id)">
                <span class="top">
                  <span class="adm-pill" [class.is-bad]="m.type === 'complaint'" [class.is-good]="m.type === 'survey'" [class.is-new]="m.type === 'contact'">{{ typeLabel[m.type] }}</span>
                  <span class="date">{{ when(m.date) }}</span>
                </span>
                <strong class="clamp-1">{{ m.subject }}</strong>
                <span class="from clamp-1">{{ m.name }}{{ m.orderRef ? ' · ' + m.orderRef : '' }}</span>
                <span class="snip clamp-2">{{ m.body }}</span>
              </button>
            </li>
          } @empty {
            <li class="adm-empty">Nothing here. Try another tab or status.</li>
          }
        </ul>

        <article class="detail adm-panel" aria-live="polite">
          @if (selected(); as m) {
            <header class="d-head">
              <div>
                <span class="adm-pill" [class.is-bad]="m.type === 'complaint'" [class.is-good]="m.type === 'survey'" [class.is-new]="m.type === 'contact'">{{ typeLabel[m.type] }}</span>
                <h2>{{ m.subject }}</h2>
                <p class="meta">{{ m.name }} · {{ m.contact }} · {{ full(m.date) }}</p>
              </div>
              <span class="adm-pill" [class.is-new]="m.status === 'new'" [class.is-good]="m.status === 'resolved'">{{ statusLabel[m.status] }}</span>
            </header>

            @if (m.type === 'survey') {
              <dl class="facts">
                <div><dt>Rating</dt><dd><app-rating [value]="m.rating ?? 0" [showValue]="true" [size]="16" /></dd></div>
                <div><dt>Heard about us</dt><dd>{{ m.source ?? '—' }}</dd></div>
                @if (m.orderRef) { <div><dt>Order</dt><dd>{{ m.orderRef }}</dd></div> }
              </dl>
            } @else if (m.orderRef) {
              <dl class="facts"><div><dt>Order</dt><dd>{{ m.orderRef }}</dd></div></dl>
            }

            <p class="body">{{ m.body }}</p>

            <div class="reply">
              @if (isPhone(m.contact)) {
                <a class="btn btn-primary btn-sm" [href]="wa(m)" target="_blank" rel="noopener"><lucide-icon [img]="I.MessageCircle" [size]="16" [strokeWidth]="2" /> Reply on WhatsApp</a>
                <a class="btn btn-secondary btn-sm" [href]="'tel:' + m.contact.replace(' ', '')"><lucide-icon [img]="I.Phone" [size]="16" [strokeWidth]="2" /> Call</a>
              } @else {
                <a class="btn btn-primary btn-sm" [href]="mail(m)"><lucide-icon [img]="I.Mail" [size]="16" [strokeWidth]="2" /> Reply by email</a>
              }
            </div>

            <footer class="d-actions">
              @if (m.status !== 'resolved') {
                <button type="button" class="btn btn-secondary btn-sm" (click)="set(m, 'resolved')"><lucide-icon [img]="I.CircleCheck" [size]="16" [strokeWidth]="2" /> Mark resolved</button>
              } @else {
                <button type="button" class="btn btn-secondary btn-sm" (click)="set(m, 'read')"><lucide-icon [img]="I.RotateCcw" [size]="16" [strokeWidth]="2" /> Reopen</button>
              }
              @if (m.status !== 'archived') {
                <button type="button" class="btn btn-plain btn-sm" (click)="set(m, 'archived')"><lucide-icon [img]="I.Archive" [size]="16" [strokeWidth]="2" /> Archive</button>
              }
              <button type="button" class="btn btn-plain btn-sm" (click)="set(m, 'new')">Mark unread</button>
              <button type="button" class="adm-icon-btn is-danger del" (click)="remove(m)" aria-label="Delete message"><lucide-icon [img]="I.Trash2" [size]="16" [strokeWidth]="2" /></button>
            </footer>
          } @else {
            <div class="adm-empty"><lucide-icon [img]="I.Inbox" [size]="32" [strokeWidth]="1.5" /> Choose a message to read it.</div>
          }
        </article>
      </div>
    </div>
  `,
  styles: `
    .n { margin-left: 4px; font-size: 0.75rem; color: var(--ink-3); }
    .split { display: grid; grid-template-columns: minmax(280px, 400px) minmax(0, 1fr); gap: 12px; align-items: start; }
    .list { display: grid; gap: 4px; list-style: none; margin: 0; padding: 0; max-height: calc(100vh - 220px); overflow: auto; }
    .item { width: 100%; display: grid; gap: 4px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--surface); text-align: left; transition: background-color var(--dur-fast); }
    .item:hover { background: var(--surface-2); }
    [aria-selected='true'] .item { background: var(--ground); box-shadow: inset 0 0 0 2px var(--accent); }
    .item.is-new strong::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 8px; border-radius: 50%; background: var(--accent); vertical-align: middle; }
    .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .date { font-size: 0.75rem; color: var(--ink-3); }
    .item strong { font-size: 0.9375rem; font-weight: 600; }
    .from { font-size: 0.8125rem; color: var(--ink-2); }
    .snip { font-size: 0.8125rem; color: var(--ink-3); }
    .detail { position: sticky; top: 72px; min-height: 360px; }
    .d-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .d-head > div { display: grid; gap: 6px; justify-items: start; }
    .d-head h2 { font-size: 1.25rem !important; font-weight: 650; letter-spacing: -0.015em; }
    .meta { font-size: var(--text-small) !important; color: var(--ink-2) !important; }
    .facts { display: flex; gap: 24px; flex-wrap: wrap; margin: 0; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--ground); }
    .facts div { display: grid; gap: 2px; }
    .facts dt { font-size: 0.75rem; color: var(--ink-3); }
    .facts dd { margin: 0; font-weight: 600; }
    .body { white-space: pre-wrap; line-height: 1.65; max-width: 70ch; }
    .reply { display: flex; gap: 8px; flex-wrap: wrap; }
    .d-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding-top: 12px; border-top: 1px solid var(--surface-2); }
    .del { margin-left: auto; }
    @media (max-width: 1000px) { .split { grid-template-columns: minmax(0, 1fr); } .list { max-height: none; } .detail { position: static; } }
  `,
})
export class InboxPage {
  protected readonly I = I;
  protected readonly inbox = inject(InboxService);
  private readonly bag = inject(BagStore);
  private readonly router = inject(Router);
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly statusLabel: Record<MessageStatus, string> = { new: 'New', read: 'Open', resolved: 'Resolved', archived: 'Archived' };

  /** ?id= from the dashboard opens that message */
  readonly id = input<string>();
  protected readonly tab = signal<Tab>('all');
  protected readonly status = signal<StatusFilter>('open');
  protected readonly q = signal('');
  private readonly selectedId = signal<string | null>(null);

  protected readonly tabs = computed(() => {
    const all = this.inbox.all();
    return [
      { id: 'all' as Tab, label: 'All', count: all.length },
      ...(Object.keys(TYPE_LABEL) as MessageType[]).map((t) => ({ id: t as Tab, label: TYPE_LABEL[t] + (t === 'complaint' || t === 'survey' ? 's' : ''), count: all.filter((m) => m.type === t).length })),
    ];
  });

  protected readonly filtered = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    return this.inbox.all().filter((m) => {
      if (this.tab() !== 'all' && m.type !== this.tab()) return false;
      const s = this.status();
      if (s === 'open' && !(m.status === 'new' || m.status === 'read')) return false;
      if ((s === 'new' || s === 'resolved' || s === 'archived') && m.status !== s) return false;
      const hay = `${m.name} ${m.subject} ${m.body} ${m.orderRef ?? ''} ${m.contact}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  });

  protected readonly selected = computed(() => this.inbox.all().find((m) => m.id === this.selectedId()) ?? null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        this.status.set('any');
        this.open(id);
      }
    });
  }

  open(id: string): void {
    this.selectedId.set(id);
    const m = this.inbox.all().find((x) => x.id === id);
    if (m?.status === 'new') this.inbox.setStatus(id, 'read');
  }

  set(m: InboxMessage, status: MessageStatus): void {
    this.inbox.setStatus(m.id, status);
    this.bag.notify(status === 'resolved' ? 'Marked resolved' : status === 'archived' ? 'Archived' : status === 'new' ? 'Marked unread' : 'Reopened');
  }

  remove(m: InboxMessage): void {
    if (!confirm(`Delete the message from ${m.name}?`)) return;
    this.inbox.remove(m.id);
    this.selectedId.set(null);
    this.router.navigate([], { queryParams: { id: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  isPhone(c: string): boolean {
    return /^[+\d][\d\s-]{6,}$/.test(c.trim());
  }

  wa(m: InboxMessage): string {
    const digits = m.contact.replace(/\D/g, '').replace(/^0/, '92');
    return `https://wa.me/${digits}?text=${encodeURIComponent(`Assalam o Alaikum ${m.name.split(' ')[0]}, this is Little Surprises about “${m.subject}”. `)}`;
  }

  mail(m: InboxMessage): string {
    return `mailto:${m.contact}?subject=${encodeURIComponent('Re: ' + m.subject)}&body=${encodeURIComponent(`Dear ${m.name.split(' ')[0]},\n\n`)}`;
  }

  when(iso: string): string {
    const d = new Date(iso);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    return days <= 0 ? d.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' }) : days === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  full(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
