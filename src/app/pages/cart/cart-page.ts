import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BRAND } from '../../core/catalog';
import { CatalogService, cityLabel } from '../../core/catalog.service';
import { SeoService } from '../../core/seo.service';
import { BagStore, CartItem } from '../../core/stores';
import { BrandMark } from '../../shared/brand-mark';
import { Breadcrumbs } from '../../shared/breadcrumbs';
import { I } from '../../shared/icons';
import { MoneyPipe } from '../../shared/money.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { WhatsappIcon } from '../../shared/whatsapp-icon';
import { StarInput } from '../../shared/reviews/star-input';
import { InboxService } from '../../core/inbox.service';

const SLOTS = ['10 am – 2 pm', '2 pm – 6 pm', '6 pm – 10 pm'];
const SAME_DAY_CUTOFF = 14; // 2 pm

interface PayMethod {
  id: string;
  label: string;
  hint: string;
  detail: string;
}

/** Cash first: it is how most Pakistani shoppers pay; wallets next. */
const PAYMENTS: PayMethod[] = [
  { id: 'cod', label: 'Cash on delivery', hint: 'Pay the rider', detail: 'Pay in cash when the gift arrives. Surprise delivery? We can collect from you instead — say so in the note.' },
  { id: 'wallet', label: 'JazzCash or Easypaisa', hint: 'Mobile wallet', detail: 'We send our wallet number on WhatsApp when we confirm; your order is prepared as soon as the payment shows.' },
  { id: 'card', label: 'Debit or credit card', hint: 'Visa, Mastercard', detail: 'We send a secure card payment link on WhatsApp. No card details are entered on this page.' },
  { id: 'bank', label: 'Bank transfer or Raast', hint: 'IBAN or Raast ID', detail: 'Our account details come with the confirmation. Send the receipt on WhatsApp.' },
];

/**
 * One-page checkout. Left: who it's from, who it's for, when. Right, sticky:
 * the items, every cost, payment and the button — so the total is always in
 * view (Baymard: show the full cost before payment, keep the summary visible).
 * No backend yet: placing the order writes it to the shop on WhatsApp.
 */
@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, LucideAngularModule, MoneyPipe, QtyStepper, Breadcrumbs, BrandMark, WhatsappIcon, StarInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Bag', link: '/cart' }, { label: 'Checkout' }]" />

      @if (sent()) {
        <section class="state">
          <app-brand-mark [size]="64" [wordmark]="false" />
          <h1 class="t-title">Almost done — send the message</h1>
          <p class="t-muted">WhatsApp opened with your order written out. Send it, and we'll confirm the delivery time within minutes.</p>
          <div class="row">
            <a class="btn btn-primary" [href]="waUrl()" target="_blank" rel="noopener"><app-whatsapp-icon [size]="18" /> Open WhatsApp again</a>
            <button type="button" class="btn btn-secondary" (click)="startOver()">Start a new order</button>
          </div>

          @if (!surveyDone()) {
            <form class="survey" (submit)="sendSurvey($event)">
              <h2 class="t-headline">How was ordering? <span class="t-note t-small">(optional, 20 seconds)</span></h2>
              <div class="field">
                <span class="field-label">Your rating</span>
                <app-star-input [(value)]="surveyStars" name="survey-stars" label="How easy was ordering?" />
              </div>
              <div class="two">
                <div class="field">
                  <label for="sv-source">How did you hear about us?</label>
                  <select id="sv-source" name="source" class="select">
                    @for (s of sources; track s) { <option>{{ s }}</option> }
                  </select>
                </div>
                <div class="field">
                  <label for="sv-note">Anything we could do better?</label>
                  <input id="sv-note" name="note" class="input" maxlength="300" placeholder="Optional" />
                </div>
              </div>
              <button class="btn btn-secondary" [disabled]="!surveyStars()">Send</button>
            </form>
          } @else {
            <p class="notice is-positive survey-done" role="status"><lucide-icon [img]="I.CircleCheck" [size]="18" [strokeWidth]="2" /> Thank you, that helps us a lot.</p>
          }
        </section>
      } @else if (bag.items().length === 0) {
        <section class="state">
          <app-brand-mark [size]="64" [wordmark]="false" />
          <h1 class="t-title">Your bag is empty</h1>
          <p class="t-muted">Start with an occasion, or build a basket from scratch.</p>
          <div class="row">
            <a routerLink="/shop" class="btn btn-secondary">Shop all gifts</a>
            <a routerLink="/build-a-basket" class="btn btn-primary">Build a basket</a>
          </div>
        </section>
      } @else {
        <form class="checkout" (submit)="place($event)" novalidate>
          <!-- ===================================== left: details -->
          <div class="details">
            <h1 class="t-title">Checkout</h1>

            <!-- phones: the summary, folded, above the form -->
            <details class="mini">
              <summary>
                <span>{{ bag.count() }} {{ bag.count() === 1 ? 'item' : 'items' }} · show summary</span>
                <strong class="t-num">{{ bag.total() | money }}</strong>
              </summary>
              <ul role="list">
                @for (i of bag.items(); track i.key) {
                  <li><img [src]="imageFor(i)" alt="" width="48" height="48" /><span class="clamp-1">{{ i.quantity }} × {{ i.name }}</span><span class="t-num">{{ i.unitPrice * i.quantity | money }}</span></li>
                }
              </ul>
            </details>

            <fieldset class="block">
              <legend class="t-headline">Your details</legend>
              <p class="t-small t-muted">We'll send the confirmation here. No account needed.</p>
              <div class="two">
                <div class="field"><label for="c-name">Full name</label><input id="c-name" name="name" class="input" required autocomplete="name" /></div>
                <div class="field"><label for="c-phone">Mobile number</label>
                  <input id="c-phone" name="phone" class="input" required type="tel" inputmode="tel" [pattern]="phonePattern" placeholder="0300 1234567" autocomplete="tel" />
                  <span class="field-hint">WhatsApp number if you have one</span></div>
              </div>
            </fieldset>

            <fieldset class="block">
              <legend class="t-headline">Who it's for</legend>
              <div class="two">
                <div class="field"><label for="r-name">Recipient's name</label><input id="r-name" name="rname" class="input" required /></div>
                <div class="field"><label for="r-phone">Recipient's mobile</label>
                  <input id="r-phone" name="rphone" class="input" required type="tel" inputmode="tel" [pattern]="phonePattern" placeholder="0300 1234567" />
                  <span class="field-hint">The rider calls before arriving</span></div>
              </div>
              <div class="field"><label for="r-addr">Delivery address in {{ city() }}</label>
                <textarea id="r-addr" name="address" class="textarea" rows="2" required placeholder="House, street, block, area — e.g. House 12, Street 4, Block 5, Clifton"></textarea>
                <span class="field-hint">Not {{ city() }}? Change the city at the top of the page; prices and delivery update.</span></div>
              <label class="check"><input type="checkbox" name="surprise" value="yes" /> It's a surprise — don't say who it's from until it's opened</label>
            </fieldset>

            <fieldset class="block">
              <legend class="t-headline">When</legend>
              <div class="choices" role="radiogroup" aria-label="Delivery day">
                @for (d of days(); track d.id) {
                  <label class="choice" [class.is-off]="d.disabled">
                    <input type="radio" name="day" [value]="d.id" [checked]="day() === d.id" [disabled]="d.disabled" (change)="day.set(d.id)" />
                    <span class="c-title">{{ d.label }}</span>
                    <span class="c-hint">{{ d.hint }}</span>
                  </label>
                }
              </div>
              @if (day() === 'later') {
                <div class="field narrow"><label for="d-date">Date</label><input id="d-date" name="date" class="input" type="date" required [min]="dates.after" /></div>
              }
              <div class="slots" role="radiogroup" aria-label="Delivery time">
                @for (s of slots; track s; let first = $first) {
                  <label class="slot"><input type="radio" name="slot" [value]="s" [checked]="first" /><span>{{ s }}</span></label>
                }
              </div>
            </fieldset>

            <fieldset class="block">
              <legend class="t-headline">Gift note</legend>
              <div class="field"><label for="g-note">We handwrite it on our tag <span class="t-note">(free, optional)</span></label>
                <textarea id="g-note" name="note" class="textarea" rows="3" maxlength="200" placeholder="Happy birthday, Ammi. Thank you for everything."
                  (input)="noteLen.set($any($event.target).value.length)"></textarea>
                <span class="field-hint t-num">{{ noteLen() }} / 200</span></div>
              <label class="check"><input type="checkbox" name="hidePrice" value="yes" checked /> Keep prices and receipts out of the gift</label>
            </fieldset>
          </div>

          <!-- ===================================== right: sticky summary -->
          <aside class="summary" aria-label="Order summary">
            <div class="sum-head">
              <h2 class="t-headline">Your order</h2>
              <a routerLink="/shop" class="btn btn-plain btn-sm">Add more</a>
            </div>

            <ul class="items" role="list">
              @for (i of bag.items(); track i.key) {
                <li class="item">
                  <img [src]="imageFor(i)" alt="" width="64" height="64" />
                  <div class="i-body">
                    @if (i.slug) {
                      <a [routerLink]="['/product', i.slug]" class="i-name clamp-2" [title]="i.name">{{ i.name }}</a>
                    } @else {
                      <span class="i-name clamp-2">{{ i.name }}</span>
                    }
                    @if (meta(i); as m) { <span class="i-meta">{{ m }}</span> }
                    <div class="i-ctl">
                      <app-qty-stepper [value]="i.quantity" (valueChange)="bag.setQuantity(i.key, $event)" [min]="0" [max]="20" [label]="i.name" />
                      <span class="i-price t-num">{{ i.unitPrice * i.quantity | money }}</span>
                    </div>
                  </div>
                </li>
              }
            </ul>

            <dl class="totals">
              <div><dt>Subtotal</dt><dd class="t-num">{{ bag.subtotal() | money }}</dd></div>
              <div><dt>Delivery · {{ city() }}</dt><dd class="t-num">{{ bag.deliveryFee() ? (bag.deliveryFee() | money) : 'Free' }}</dd></div>
              <div><dt>Gift wrap & handwritten note</dt><dd>Free</dd></div>
              @if (toFree() > 0) {
                <div class="nudge"><dt>Add {{ toFree() | money }} more for free delivery</dt><dd></dd></div>
              }
              <div class="grand"><dt>Total</dt><dd class="t-num">{{ bag.total() | money }}</dd></div>
            </dl>

            <fieldset class="pay">
              <legend class="t-headline">Payment</legend>
              <div class="methods" role="radiogroup" aria-label="Payment method">
                @for (m of payments; track m.id) {
                  <label class="method">
                    <input type="radio" name="pay" [value]="m.label" [checked]="pay() === m.id" (change)="pay.set(m.id)" />
                    <span class="m-text"><strong>{{ m.label }}</strong><span>{{ m.hint }}</span></span>
                    <span class="m-dot" aria-hidden="true"></span>
                  </label>
                }
              </div>
              <p class="m-detail t-small">{{ payDetail() }}</p>
            </fieldset>

            @if (error()) {
              <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p>
            }
            <button class="btn btn-primary btn-lg btn-block place">Place order · {{ bag.total() | money }}</button>
            <p class="after t-small">Nothing is charged now. We confirm your order on WhatsApp before it goes out.</p>

            <ul class="trust" role="list">
              <li><lucide-icon [img]="I.ShieldCheck" [size]="18" [strokeWidth]="1.8" /> Damaged on arrival? Replaced or refunded. <a routerLink="/policies/refunds">Refunds</a></li>
              <li><lucide-icon [img]="I.Truck" [size]="18" [strokeWidth]="1.8" /> {{ catalog.city() === 'karachi' ? 'Same day across Karachi before 2 pm.' : 'Delivered in 2–4 days.' }} <a routerLink="/policies/delivery">Delivery</a></li>
              <li><app-whatsapp-icon [size]="18" /> Questions? <a [href]="'https://wa.me/' + brand.whatsapp" target="_blank" rel="noopener">WhatsApp us</a> — we reply in minutes.</li>
            </ul>
          </aside>
        </form>
      }
    </main>
  `,
  styles: `
    .page { display: grid; gap: 20px; padding-top: 28px; }
    .checkout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 440px); gap: clamp(24px, 4vw, 64px); align-items: start; }

    /* ---- left */
    .details { display: grid; gap: 28px; }
    .block { border: 0; margin: 0; padding: 0 0 28px; display: grid; gap: 14px; }
    .block + .block { padding-top: 4px; }
    legend { padding: 0; margin-bottom: 4px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .narrow { max-width: 260px; }
    .input:user-invalid, .textarea:user-invalid { border-color: var(--negative); }
    .mini { display: none; }

    .choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .choice {
      position: relative; display: grid; gap: 2px; padding: 14px 16px; border-radius: var(--radius); background: var(--surface);
      cursor: pointer; box-shadow: inset 0 0 0 2px transparent; transition: box-shadow var(--dur) var(--ease-out), background-color var(--dur);
    }
    .choice input, .slot input, .method input { position: absolute; opacity: 0; pointer-events: none; }
    .choice:has(input:checked) { box-shadow: inset 0 0 0 2px var(--accent); background: var(--ground); }
    .choice:has(input:focus-visible), .slot:has(input:focus-visible), .method:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
    .choice.is-off { opacity: 0.45; cursor: not-allowed; }
    .c-title { font-weight: 620; }
    .c-hint { font-size: var(--text-small); color: var(--ink-2); }
    .slots { display: flex; flex-wrap: wrap; gap: 8px; }
    .slot span {
      display: inline-flex; align-items: center; min-height: var(--control-sm); padding: 0 16px; border-radius: var(--radius-pill);
      background: var(--surface-2); font-size: var(--text-small); font-weight: 560; cursor: pointer;
    }
    .slot:has(input:checked) span { background: var(--ink); color: var(--ground); }

    /* ---- right, sticky */
    .summary {
      position: sticky; top: calc(var(--header-h) + 16px);
      display: grid; gap: 18px; padding: 24px; border-radius: var(--radius-lg); background: var(--surface);
      max-height: calc(100svh - var(--header-h) - 32px); overflow: auto; overscroll-behavior: contain; scrollbar-width: thin;
    }
    .sum-head { display: flex; justify-content: space-between; align-items: center; }
    .items { display: grid; gap: 14px; max-height: 300px; overflow: auto; padding-right: 4px; scrollbar-width: thin; }
    .item { display: grid; grid-template-columns: 64px 1fr; gap: 12px; }
    .item img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background: var(--surface-2); }
    .i-body { display: grid; gap: 4px; min-width: 0; }
    .i-name { font-weight: 600; font-size: 0.9375rem; line-height: 1.3; }
    a.i-name:hover { text-decoration: underline; text-underline-offset: 3px; }
    .i-meta { font-size: 0.8125rem; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .i-ctl { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .i-ctl app-qty-stepper { background: var(--ground); }
    .i-price { font-weight: 620; }

    .totals { display: grid; gap: 8px; margin: 0; padding-top: 14px; border-top: 0; font-size: 0.9375rem; }
    .totals div { display: flex; justify-content: space-between; gap: 12px; color: var(--ink-2); }
    .totals dd { margin: 0; }
    .totals .nudge { font-size: var(--text-small); color: var(--positive); font-weight: 560; }
    .totals .grand { color: var(--ink); font-size: var(--text-headline); font-weight: 650; letter-spacing: -0.015em; padding-top: 6px; }

    .pay { border: 0; margin: 0; padding: 0; display: grid; gap: 10px; }
    .methods { display: grid; gap: 8px; }
    .method {
      position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-sm);
      background: var(--ground); cursor: pointer; box-shadow: inset 0 0 0 2px transparent; transition: box-shadow var(--dur) var(--ease-out);
    }
    .method:has(input:checked) { box-shadow: inset 0 0 0 2px var(--accent); }
    .m-text { display: grid; flex: 1; }
    .m-text strong { font-weight: 600; font-size: 0.9375rem; }
    .m-text span { font-size: 0.8125rem; color: var(--ink-3); }
    .m-dot { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--surface-3); flex: none; transition: box-shadow var(--dur) var(--ease-spring); }
    .method:has(input:checked) .m-dot { box-shadow: inset 0 0 0 6px var(--accent); }
    .m-detail { color: var(--ink-2); padding: 0 2px; }

    .place { margin-top: 2px; }
    .after { text-align: center; color: var(--ink-2); margin-top: -8px; }
    .trust { display: grid; gap: 10px; font-size: 0.8125rem; color: var(--ink-2); }
    .trust li { display: flex; gap: 10px; align-items: flex-start; }
    .trust lucide-icon, .trust app-whatsapp-icon { color: var(--positive); flex: none; margin-top: 1px; }
    .trust a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }

    .survey { display: grid; gap: 14px; width: min(560px, 100%); margin-top: 28px; padding: 22px; border-radius: var(--radius); background: var(--ground); text-align: left; }
    .survey .two { grid-template-columns: 1fr 1fr; }
    .survey .btn { justify-self: start; }
    .survey-done { margin-top: 20px; }
    .state { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 72px 24px; border-radius: var(--radius-lg); background: var(--surface); }
    .row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }

    @media (max-width: 980px) {
      .checkout { grid-template-columns: 1fr; }
      .summary { position: static; max-height: none; overflow: visible; }
      .items { max-height: none; }
      .mini { display: block; border-radius: var(--radius); background: var(--surface); padding: 4px 16px; }
      .mini summary { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; cursor: pointer; font-size: var(--text-small); }
      .mini ul { display: grid; gap: 8px; padding-bottom: 12px; font-size: var(--text-small); }
      .mini li { display: grid; grid-template-columns: 48px 1fr auto; gap: 10px; align-items: center; }
      .mini img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
    }
    @media (max-width: 560px) {
      .two, .choices { grid-template-columns: 1fr; }
    }
  `,
})
export class CartPage {
  protected readonly I = I;
  protected readonly bag = inject(BagStore);
  protected readonly catalog = inject(CatalogService);
  protected readonly brand = BRAND;
  protected readonly slots = SLOTS;
  protected readonly payments = PAYMENTS;
  protected readonly phonePattern = '^(\\+92|0)3[0-9]{2}[ \\-]?[0-9]{7}$';

  protected readonly city = computed(() => cityLabel(this.catalog.city()));
  protected readonly pay = signal('cod');
  protected readonly payDetail = computed(() => PAYMENTS.find((p) => p.id === this.pay())?.detail ?? '');
  protected readonly noteLen = signal(0);
  protected readonly error = signal('');
  protected readonly sent = signal(false);
  protected readonly waUrl = signal('');
  protected readonly toFree = computed(() => (this.bag.subtotal() ? Math.max(0, this.bag.freeDeliveryFrom - this.bag.subtotal()) : 0));

  protected readonly dates = (() => {
    const d = (offset: number) => {
      const x = new Date();
      x.setDate(x.getDate() + offset);
      return x.toISOString().slice(0, 10);
    };
    return { today: d(0), tomorrow: d(1), after: d(2) };
  })();

  /** Same day only in Karachi and only before the 2 pm cut-off. */
  protected readonly days = computed(() => {
    const karachi = this.catalog.city() === 'karachi';
    const beforeCutoff = new Date().getHours() < SAME_DAY_CUTOFF;
    const sameDay = karachi && beforeCutoff;
    return [
      { id: 'today', label: 'Today', hint: sameDay ? 'Order before 2 pm' : karachi ? 'Closed after 2 pm' : 'Karachi only', disabled: !sameDay },
      { id: 'tomorrow', label: 'Tomorrow', hint: karachi ? 'Any time slot' : 'Earliest in 2–4 days', disabled: !karachi },
      { id: 'later', label: 'Pick a date', hint: 'Up to 30 days ahead', disabled: false },
    ];
  });
  protected readonly day = signal<string>('');

  constructor() {
    inject(SeoService).set({ title: 'Checkout', path: '/cart' });
    const first = this.days().find((d) => !d.disabled);
    this.day.set(first?.id ?? 'later');
  }

  /** The current picture for a product line (files are renamed when the catalog is re-imported). */
  imageFor(i: CartItem): string {
    return (i.slug && this.catalog.bySlug(i.slug)?.images[0]) || i.image;
  }

  meta(i: CartItem): string {
    return [i.meta, i.note ? `Note: “${i.note}”` : ''].filter(Boolean).join(' · ');
  }

  place(e: SubmitEvent): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      this.error.set('A few details are missing. Mobile numbers look like 0300 1234567.');
      form.reportValidity();
      return;
    }
    this.error.set('');
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const when =
      this.day() === 'today' ? `Today (${this.dates.today})` : this.day() === 'tomorrow' ? `Tomorrow (${this.dates.tomorrow})` : f['date'];
    const fmt = (n: number) => `Rs ${n.toLocaleString('en-PK')}`;
    const text = [
      `New order from ${BRAND.siteUrl}`,
      '',
      ...this.bag.items().map((i) => `• ${i.quantity} × ${i.name} — ${fmt(i.unitPrice * i.quantity)}${i.meta ? `\n   ${i.meta}` : ''}`),
      '',
      `Subtotal: ${fmt(this.bag.subtotal())}`,
      `Delivery: ${this.bag.deliveryFee() ? fmt(this.bag.deliveryFee()) : 'Free'}`,
      `Total: ${fmt(this.bag.total())}`,
      `Payment: ${f['pay']}`,
      '',
      `From: ${f['name']} (${f['phone']})`,
      `To: ${f['rname']} (${f['rphone']})`,
      `Address: ${f['address']}, ${this.city()}`,
      `When: ${when}, ${f['slot']}`,
      f['note'] ? `Gift note: ${f['note']}` : '',
      f['surprise'] ? 'Surprise delivery — keep the sender secret' : '',
      f['hidePrice'] ? 'No prices in the gift' : '',
    ]
      .filter((l, idx, all) => l !== '' || all[idx - 1] !== '')
      .join('\n');
    this.lastOrder = { name: f['name'], phone: f['phone'] };
    const url = `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
    this.waUrl.set(url);
    window.open(url, '_blank', 'noopener,noreferrer');
    this.sent.set(true);
  }

  // ---- after-order survey → operator inbox
  private readonly inbox = inject(InboxService);
  protected readonly sources = ['Instagram', 'TikTok', 'Facebook', 'Google search', 'Friend or family', 'Other'];
  protected readonly surveyStars = signal(0);
  protected readonly surveyDone = signal(false);
  private lastOrder: { name: string; phone: string } = { name: '', phone: '' };

  sendSurvey(e: SubmitEvent): void {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target as HTMLFormElement)) as Record<string, string>;
    this.inbox.add({
      type: 'survey',
      name: this.lastOrder.name || 'Customer',
      contact: this.lastOrder.phone,
      subject: 'After-order survey',
      body: f['note']?.trim() || '(no comment)',
      rating: this.surveyStars(),
      source: f['source'],
    });
    this.surveyDone.set(true);
  }

  startOver(): void {
    this.bag.clear();
    this.sent.set(false);
  }
}
