import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND } from '../core/catalog';
import { BagStore } from '../core/stores';
import { Voucher, VoucherKind, VoucherStatus, VouchersService, normalise, today, voucherOffer, voucherStatus } from '../core/vouchers.service';
import { Drawer } from '../shared/drawer';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

type Filter = 'all' | 'active' | 'scheduled' | 'over' | 'off';

interface Draft {
  original: string | null;
  code: string;
  description: string;
  kind: VoucherKind;
  value: number | null;
  maxDiscount: number | null;
  minSpend: number | null;
  startsOn: string;
  endsOn: string;
  limit: number | null;
  active: boolean;
  featured: boolean;
}

const STATUS_LABEL: Record<VoucherStatus, string> = {
  active: 'Live',
  scheduled: 'Scheduled',
  ended: 'Ended',
  'used-up': 'Used up',
  off: 'Off',
};

const KINDS: { id: VoucherKind; label: string }[] = [
  { id: 'percent', label: '% off' },
  { id: 'amount', label: 'Rs off' },
  { id: 'delivery', label: 'Free delivery' },
];

const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Promo codes: make, schedule, cap, feature in the shop's announcement bar, share as a link. */
@Component({
  selector: 'app-vouchers-page',
  imports: [LucideAngularModule, Drawer, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Vouchers</h1>
          <p>{{ counts().active }} live · {{ counts().scheduled }} scheduled · {{ totalUses().toLocaleString('en-PK') }} uses in all</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" (click)="startNew()"><lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2.2" /> New voucher</button>
      </header>

      <div class="adm-toolbar">
        <div class="segmented" role="group" aria-label="Status">
          @for (f of filters; track f.id) {
            <button type="button" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">{{ f.label }}</button>
          }
        </div>
        <div class="search-field">
          <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
          <label class="visually-hidden" for="v-q">Search vouchers</label>
          <input id="v-q" class="input" type="search" placeholder="Search code or description" [value]="q()" (input)="q.set($any($event.target).value)" />
        </div>
      </div>

      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr>
            <th scope="col">Code</th><th scope="col">Offer</th><th scope="col">Valid</th><th scope="col">Uses</th><th scope="col">Status</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr></thead>
          <tbody>
            @for (v of shown(); track v.code) {
              <tr [class.is-editing]="draft()?.original === v.code">
                <td>
                  <span class="code">{{ v.code }}</span>
                  @if (v.featured) { <span class="feat" title="Shown in the shop's announcement bar">In site banner</span> }
                  <span class="sub clamp-1" [title]="v.description">{{ v.description }}</span>
                </td>
                <td><strong class="offer">{{ offer(v) }}</strong>
                  <span class="sub">{{ v.minSpend ? 'Over ' + (v.minSpend | money) : 'Any order' }}</span></td>
                <td class="when">{{ validity(v) }}</td>
                <td class="uses">
                  <span class="t-num">{{ v.used.toLocaleString('en-PK') }}{{ v.limit !== null ? ' / ' + v.limit.toLocaleString('en-PK') : '' }}</span>
                  @if (v.limit) { <span class="meter" aria-hidden="true"><span [style.width.%]="(v.used / v.limit) * 100"></span></span> }
                </td>
                <td><span class="adm-pill" [class.is-good]="status(v) === 'active'" [class.is-warn]="status(v) === 'scheduled'" [class.is-bad]="status(v) === 'ended' || status(v) === 'used-up'">{{ label[status(v)] }}</span></td>
                <td class="row-actions">
                  <label class="switch mini" [title]="v.active ? 'Switch off' : 'Switch on'">
                    <span class="visually-hidden">{{ v.code }} on</span>
                    <input type="checkbox" role="switch" [checked]="v.active" (change)="toggle(v, $any($event.target).checked)" />
                  </label>
                  <button type="button" class="adm-icon-btn" (click)="copyLink(v)" [attr.aria-label]="'Copy share link for ' + v.code" title="Copy a link that applies this code"><lucide-icon [img]="I.Link" [size]="16" [strokeWidth]="2" /></button>
                  <button type="button" class="adm-icon-btn" (click)="edit(v)" [attr.aria-label]="'Edit ' + v.code"><lucide-icon [img]="I.Pencil" [size]="16" [strokeWidth]="2" /></button>
                  <button type="button" class="adm-icon-btn is-danger" (click)="remove(v)" [attr.aria-label]="'Delete ' + v.code"><lucide-icon [img]="I.Trash2" [size]="16" [strokeWidth]="2" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="adm-empty">No vouchers match.</div></td></tr>
            }
          </tbody>
        </table>
      </div>

      <app-drawer [open]="!!draft()" [heading]="draft()?.original ? 'Edit voucher' : 'New voucher'" (closed)="draft.set(null)">
        @if (draft(); as d) {
          <form class="editor" (submit)="save($event)" novalidate>
            <div class="field"><label for="v-code">Code</label>
              <input id="v-code" class="input code-input" required maxlength="20" autofocus autocomplete="off" spellcheck="false"
                [value]="d.code" (input)="patch({ code: clean($any($event.target).value) })" />
              <span class="field-hint">Letters and numbers. Shoppers can type it in any case.</span></div>

            <div class="field"><label for="v-desc">What shoppers see</label>
              <input id="v-desc" class="input" required maxlength="70" [value]="d.description" placeholder="e.g. 10% off your first order"
                (input)="patch({ description: $any($event.target).value })" /></div>

            <div class="field"><span class="field-label" id="v-kind">Discount</span>
              <div class="segmented" role="radiogroup" aria-labelledby="v-kind">
                @for (k of kinds; track k.id) {
                  <button type="button" role="radio" [attr.aria-checked]="d.kind === k.id" [attr.aria-pressed]="d.kind === k.id" (click)="patch({ kind: k.id })">{{ k.label }}</button>
                }
              </div></div>

            @if (d.kind !== 'delivery') {
              <div class="two">
                <div class="field"><label for="v-value">{{ d.kind === 'percent' ? 'Percent off' : 'Rupees off' }}</label>
                  <input id="v-value" class="input" type="number" inputmode="numeric" required [min]="1" [max]="d.kind === 'percent' ? 100 : 100000"
                    [value]="d.value ?? ''" (input)="patch({ value: num($any($event.target).value) })" /></div>
                @if (d.kind === 'percent') {
                  <div class="field"><label for="v-cap">Up to (Rs) <span class="t-note">optional</span></label>
                    <input id="v-cap" class="input" type="number" inputmode="numeric" min="1" [value]="d.maxDiscount ?? ''"
                      (input)="patch({ maxDiscount: num($any($event.target).value) })" /></div>
                }
              </div>
            }

            <div class="two">
              <div class="field"><label for="v-min">Minimum spend (Rs) <span class="t-note">optional</span></label>
                <input id="v-min" class="input" type="number" inputmode="numeric" min="0" [value]="d.minSpend ?? ''"
                  (input)="patch({ minSpend: num($any($event.target).value) })" /></div>
              <div class="field"><label for="v-limit">Total uses <span class="t-note">optional</span></label>
                <input id="v-limit" class="input" type="number" inputmode="numeric" min="1" [value]="d.limit ?? ''" placeholder="Unlimited"
                  (input)="patch({ limit: num($any($event.target).value) })" /></div>
            </div>

            <div class="two">
              <div class="field"><label for="v-start">Starts <span class="t-note">optional</span></label>
                <input id="v-start" class="input" type="date" [value]="d.startsOn" (input)="patch({ startsOn: $any($event.target).value })" /></div>
              <div class="field"><label for="v-end">Ends <span class="t-note">optional</span></label>
                <input id="v-end" class="input" type="date" [min]="d.startsOn || null" [value]="d.endsOn" (input)="patch({ endsOn: $any($event.target).value })" /></div>
            </div>

            <label class="switch"><span>On</span><input type="checkbox" role="switch" [checked]="d.active" (change)="patch({ active: $any($event.target).checked })" /></label>
            <label class="check"><input type="checkbox" [checked]="d.featured" (change)="patch({ featured: $any($event.target).checked })" />
              <span>Show in the shop's announcement bar <span class="t-note">(replaces any other)</span></span></label>

            <p class="preview t-small"><lucide-icon [img]="I.TicketPercent" [size]="16" [strokeWidth]="2" /> {{ preview() }}</p>

            @if (error()) { <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p> }
            <div class="row drawer-actions">
              <button class="btn btn-primary"><lucide-icon [img]="I.Save" [size]="16" [strokeWidth]="2" /> {{ d.original ? 'Save' : 'Create' }}</button>
              <button type="button" class="btn btn-plain" (click)="draft.set(null)">Cancel</button>
            </div>
          </form>
        }
      </app-drawer>
    </div>
  `,
  styles: `
    .code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; letter-spacing: 0.04em; }
    .feat { margin-left: 8px; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--surface-2); font-size: 0.6875rem; font-weight: 650; color: var(--accent); white-space: nowrap; }
    .sub { display: block; max-width: 300px; font-size: 0.75rem; color: var(--ink-3); }
    .offer { font-weight: 620; }
    .when { white-space: nowrap; color: var(--ink-2); }
    .uses { min-width: 90px; }
    .meter { display: block; width: 80px; height: 4px; margin-top: 6px; border-radius: 2px; background: var(--surface-2); overflow: hidden; }
    .meter span { display: block; height: 100%; max-width: 100%; border-radius: 2px; background: var(--accent); }
    .row-actions { white-space: nowrap; text-align: right; }
    .row-actions .switch.mini { min-height: 0; display: inline-flex; vertical-align: middle; margin-right: 6px; }
    tr.is-editing { background: color-mix(in srgb, var(--accent) 6%, transparent); }
    .editor { display: grid; gap: 18px; }
    /* inputs line up along the bottom even when one label wraps to two lines */
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: end; }
    .code-input { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .field-label { font-size: var(--text-small); font-weight: 600; }
    .preview { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--surface); color: var(--ink-2); }
  `,
})
export class VouchersPage {
  protected readonly I = I;
  protected readonly label = STATUS_LABEL;
  protected readonly kinds = KINDS;
  protected readonly offer = voucherOffer;
  protected readonly status = (v: Voucher) => voucherStatus(v);
  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Live' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'over', label: 'Ended' },
    { id: 'off', label: 'Off' },
  ];
  private readonly vouchers = inject(VouchersService);
  private readonly bag = inject(BagStore);

  protected readonly filter = signal<Filter>('all');
  protected readonly q = signal('');
  protected readonly draft = signal<Draft | null>(null);
  protected readonly error = signal('');

  protected readonly counts = computed(() => {
    const s = this.vouchers.all().map((v) => voucherStatus(v));
    return { active: s.filter((x) => x === 'active').length, scheduled: s.filter((x) => x === 'scheduled').length };
  });
  protected readonly totalUses = computed(() => this.vouchers.all().reduce((n, v) => n + v.used, 0));

  protected readonly shown = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    return this.vouchers.all().filter((v) => {
      const s = voucherStatus(v);
      const f = this.filter();
      if (f === 'active' && s !== 'active') return false;
      if (f === 'scheduled' && s !== 'scheduled') return false;
      if (f === 'over' && s !== 'ended' && s !== 'used-up') return false;
      if (f === 'off' && s !== 'off') return false;
      const hay = `${v.code} ${v.description}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  });

  /** The line a shopper would read, built from the form as it stands. */
  protected readonly preview = computed(() => {
    const d = this.draft();
    if (!d) return '';
    const offer = voucherOffer({ kind: d.kind, value: d.value ?? 0, maxDiscount: d.maxDiscount });
    const parts = [`${d.code || 'CODE'}: ${offer}`];
    if (d.minSpend) parts.push(`on orders over Rs ${d.minSpend.toLocaleString('en-PK')}`);
    if (d.endsOn) parts.push(`until ${shortDate(d.endsOn)}`);
    return parts.join(' ');
  });

  validity(v: Voucher): string {
    if (!v.startsOn && !v.endsOn) return 'Always';
    if (v.startsOn && v.endsOn) return `${shortDate(v.startsOn)} – ${shortDate(v.endsOn)}`;
    return v.endsOn ? `Until ${shortDate(v.endsOn)}` : `From ${shortDate(v.startsOn!)}`;
  }

  clean(s: string): string {
    return normalise(s).replace(/[^A-Z0-9]/g, '');
  }

  num(s: string): number | null {
    const n = Math.round(Number(s));
    return s.trim() === '' || !Number.isFinite(n) ? null : n;
  }

  startNew(): void {
    this.error.set('');
    this.draft.set({
      original: null, code: '', description: '', kind: 'percent', value: 10, maxDiscount: null, minSpend: null,
      startsOn: '', endsOn: '', limit: null, active: true, featured: false,
    });
  }

  edit(v: Voucher): void {
    this.error.set('');
    this.draft.set({
      original: v.code, code: v.code, description: v.description, kind: v.kind, value: v.value, maxDiscount: v.maxDiscount,
      minSpend: v.minSpend || null, startsOn: v.startsOn ?? '', endsOn: v.endsOn ?? '', limit: v.limit, active: v.active, featured: v.featured,
    });
  }

  patch(p: Partial<Draft>): void {
    this.error.set('');
    this.draft.update((d) => (d ? { ...d, ...p } : d));
  }

  save(e: SubmitEvent): void {
    e.preventDefault();
    const d = this.draft();
    if (!d) return;
    const fail = this.problem(d);
    if (fail) return this.error.set(fail);
    const existing = d.original ? this.vouchers.find(d.original) : undefined;
    this.vouchers.save(
      {
        code: d.code,
        description: d.description.trim(),
        kind: d.kind,
        value: d.kind === 'delivery' ? 0 : d.value!,
        maxDiscount: d.kind === 'percent' ? d.maxDiscount : null,
        minSpend: d.minSpend ?? 0,
        startsOn: d.startsOn || null,
        endsOn: d.endsOn || null,
        limit: d.limit,
        used: existing?.used ?? 0,
        active: d.active,
        featured: d.featured,
        createdAt: existing?.createdAt ?? today(),
      },
      d.original ?? undefined,
    );
    this.bag.notify(d.original ? `${d.code} saved` : `${d.code} created`);
    this.draft.set(null);
  }

  private problem(d: Draft): string {
    if (!d.code) return 'Give the voucher a code.';
    if (d.code !== d.original && this.vouchers.find(d.code)) return `${d.code} already exists. Pick another code.`;
    if (!d.description.trim()) return 'Add the line shoppers will see.';
    if (d.kind !== 'delivery' && !d.value) return 'Say how much it takes off.';
    if (d.kind === 'percent' && d.value! > 100) return 'A percentage can’t be more than 100.';
    if (d.startsOn && d.endsOn && d.endsOn < d.startsOn) return 'The end date is before the start date.';
    return '';
  }

  toggle(v: Voucher, on: boolean): void {
    this.vouchers.setActive(v.code, on);
    this.bag.notify(on ? `${v.code} switched on` : `${v.code} switched off`);
  }

  async copyLink(v: Voucher): Promise<void> {
    const url = `${BRAND.siteUrl.replace(/\/$/, '')}/?promo=${encodeURIComponent(v.code)}`;
    try {
      await navigator.clipboard.writeText(url);
      this.bag.notify('Share link copied: it applies the code when opened');
    } catch {
      prompt('Copy this link', url);
    }
  }

  remove(v: Voucher): void {
    if (!confirm(`Delete the voucher ${v.code}? Shoppers who saved it will see it no longer works.`)) return;
    this.vouchers.remove(v.code);
    this.bag.notify(`${v.code} deleted`);
  }
}
