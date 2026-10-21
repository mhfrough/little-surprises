import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BASKET_CATEGORIES } from '../core/catalog';
import { CatalogService } from '../core/catalog.service';
import { Product } from '../core/models';
import { BagStore, BuilderStore } from '../core/stores';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';
import { BaseOptions, RibbonPicker, WrapOptions } from './builder-options';
import { BasketSummary } from './basket-summary';
import { TreatCard } from './treat-card';

type StepId = 'basket' | 'wrap' | 'treats' | 'note' | 'review';

const STEPS: { id: StepId; label: string; title: string; lead: string }[] = [
  { id: 'basket', label: 'Basket', title: 'Choose a basket', lead: 'The size decides how many treats fit.' },
  { id: 'wrap', label: 'Wrap', title: 'Wrap and ribbon', lead: 'Pick the paper and tie the ribbon. Watch the picture change.' },
  { id: 'treats', label: 'Treats', title: 'Fill it with treats', lead: 'Belco chocolate, mithai, perfume and toys. Add as many as fit.' },
  { id: 'note', label: 'Note', title: 'Write the note', lead: 'We handwrite it on the tag, free.' },
  { id: 'review', label: 'Review', title: 'Check your basket', lead: 'Everything in one place. Change anything before it goes in the bag.' },
];

const NOTES = [
  { occasion: 'Birthday', text: 'Happy birthday! Wishing you a year as sweet as this basket.' },
  { occasion: 'Eid', text: 'Eid Mubarak! Sending love and something sweet your way.' },
  { occasion: 'Thank you', text: 'Thank you for everything. This is just a little something.' },
  { occasion: 'New baby', text: 'Welcome to the world, little one! Congratulations to you all.' },
  { occasion: 'Get well', text: 'Thinking of you. Get well soon.' },
];

const PAGE = 12;

/**
 * Build-a-basket as a guided flow: one decision per step, a progress bar you
 * can jump around in, a live picture and running total beside it, quick
 * starting points, and a review before anything goes in the bag.
 */
@Component({
  selector: 'app-basket-builder',
  imports: [LucideAngularModule, MoneyPipe, BaseOptions, WrapOptions, RibbonPicker, TreatCard, BasketSummary],
  providers: [BuilderStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- starting points -->
    @if (step() === 'basket' && !started()) {
      <section class="starts" aria-labelledby="starts-title">
        <h2 id="starts-title" class="t-headline">Start from an idea, or from scratch</h2>
        <div class="start-grid">
          @for (p of presets(); track p.id) {
            <button type="button" class="start" (click)="usePreset(p.id)">
              <span class="start-imgs">
                @for (src of p.images; track src) { <img [src]="src" alt="" width="120" height="120" /> }
              </span>
              <strong>{{ p.name }}</strong>
              <span class="t-small t-muted">{{ p.blurb }}</span>
              <span class="t-small from">From {{ p.total | money }}</span>
            </button>
          }
          <button type="button" class="start scratch" (click)="started.set(true)">
            <lucide-icon [img]="I.Plus" [size]="28" [strokeWidth]="1.6" />
            <strong>Start from scratch</strong>
            <span class="t-small t-muted">Choose every part yourself</span>
          </button>
        </div>
      </section>
    }

    <!-- progress -->
    <nav class="stepper" aria-label="Basket steps">
      <ol>
        @for (s of steps; track s.id; let i = $index) {
          <li>
            <button type="button" (click)="go(s.id)" [attr.aria-current]="step() === s.id ? 'step' : null"
              [class.is-done]="i < stepIndex()" [class.is-now]="step() === s.id">
              <span class="mark" aria-hidden="true">
                @if (i < stepIndex()) { <lucide-icon [img]="I.Check" [size]="14" [strokeWidth]="3" /> } @else { {{ i + 1 }} }
              </span>
              <span class="lbl">{{ s.label }}</span>
            </button>
          </li>
        }
      </ol>
      <div class="bar" aria-hidden="true"><span [style.width.%]="(stepIndex() / (steps.length - 1)) * 100"></span></div>
    </nav>

    <div class="layout">
      <section class="panel" aria-live="polite" tabindex="-1" #panel>
        <header class="panel-head">
          <p class="t-small t-muted">Step {{ stepIndex() + 1 }} of {{ steps.length }}</p>
          <h2 class="t-title">{{ current().title }}</h2>
          <p class="t-muted">{{ current().lead }}</p>
        </header>

        @switch (step()) {
          @case ('basket') {
            <app-base-options />
          }
          @case ('wrap') {
            <div class="sub"><h3 class="t-headline">Wrapping</h3><app-wrap-options /></div>
            <div class="sub"><h3 class="t-headline">Ribbon</h3><app-ribbon-picker /></div>
          }
          @case ('treats') {
            <div class="capacity" [class.is-full]="store.isFull()">
              <div class="cap-row">
                <strong>{{ store.itemCount() }} of {{ store.base().capacity }} spaces filled</strong>
                <span class="t-small">{{ store.isFull() ? 'Full — remove one to swap, or choose a bigger basket' : (store.base().capacity - store.itemCount()) + ' left' }}</span>
              </div>
              <div class="meter"><span [style.width.%]="(store.itemCount() / store.base().capacity) * 100"></span></div>
            </div>
            <div class="filters">
              <div class="chip-row" role="toolbar" aria-label="Filter treats">
                <button type="button" class="chip" [attr.aria-pressed]="cat() === ''" (click)="setCat('')">All</button>
                @for (c of categories(); track c.id) {
                  <button type="button" class="chip" [attr.aria-pressed]="cat() === c.id" (click)="setCat(c.id)">{{ c.name }}</button>
                }
              </div>
              <div class="filter-row">
                <div class="search-field">
                  <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
                  <label class="visually-hidden" for="treat-q">Search treats</label>
                  <input id="treat-q" class="input" type="search" placeholder="Search treats" [value]="q()" (input)="setQ($any($event.target).value)" />
                </div>
                <label class="visually-hidden" for="treat-price">Price</label>
                <select id="treat-price" class="select" [value]="maxPrice()" (change)="setMax(+$any($event.target).value)">
                  <option value="0">Any price</option>
                  <option value="1500">Under Rs 1,500</option>
                  <option value="3000">Under Rs 3,000</option>
                  <option value="6000">Under Rs 6,000</option>
                </select>
              </div>
            </div>
            @if (treats().length) {
              <div class="treats">
                @for (p of treats(); track p.id) { <app-treat-card [product]="p" /> }
              </div>
              @if (hidden() > 0) {
                <button type="button" class="btn btn-secondary more" (click)="limit.set(limit() + page)">Show {{ hidden() > page ? page : hidden() }} more</button>
              }
            } @else {
              <p class="empty t-muted">No treats match. Try another category or price.</p>
            }
          }
          @case ('note') {
            <div class="note-grid">
              <div class="field"><label for="n-to">For</label><input id="n-to" class="input" maxlength="30" placeholder="Ammi" [value]="store.to()" (input)="store.to.set($any($event.target).value)" /></div>
              <div class="field"><label for="n-from">From</label><input id="n-from" class="input" maxlength="40" placeholder="Love, Sara" [value]="store.from()" (input)="store.from.set($any($event.target).value)" /></div>
            </div>
            <div class="field">
              <label for="n-msg">Message</label>
              <textarea id="n-msg" class="textarea" rows="4" maxlength="160" placeholder="Write it in your own words, or start from one below."
                [value]="store.note()" (input)="store.note.set($any($event.target).value)"></textarea>
              <span class="field-hint t-num">{{ store.note().length }} / 160 · English or Roman Urdu</span>
            </div>
            <div class="ideas">
              <p class="t-small t-strong">Need a start?</p>
              <div class="chip-row wrap">
                @for (n of notes; track n.occasion) {
                  <button type="button" class="chip" (click)="store.note.set(n.text)">{{ n.occasion }}</button>
                }
              </div>
            </div>
          }
          @case ('review') {
            <dl class="review">
              <div><dt>Basket</dt><dd>{{ store.base().name }} · holds {{ store.base().capacity }}</dd><button type="button" class="btn btn-plain btn-sm" (click)="go('basket')">Change</button></div>
              <div><dt>Wrap & ribbon</dt><dd>{{ store.wrap().name }}, {{ store.ribbon().name.toLowerCase() }} ribbon</dd><button type="button" class="btn btn-plain btn-sm" (click)="go('wrap')">Change</button></div>
              <div><dt>Treats</dt>
                <dd>
                  @if (store.lines().length) {
                    <ul role="list" class="rev-list">
                      @for (l of store.lines(); track l.product.id) {
                        <li><img [src]="l.product.images[0]" alt="" width="40" height="40" /> {{ l.quantity }} × {{ l.product.name }}</li>
                      }
                    </ul>
                  } @else { <span class="warn">No treats yet — add at least one.</span> }
                </dd>
                <button type="button" class="btn btn-plain btn-sm" (click)="go('treats')">Change</button></div>
              <div><dt>Note</dt><dd>{{ store.note() ? '“' + store.note() + '”' : 'No note' }}</dd><button type="button" class="btn btn-plain btn-sm" (click)="go('note')">Change</button></div>
            </dl>
            <ul class="promise t-small" role="list">
              <li><lucide-icon [img]="I.PenLine" [size]="16" [strokeWidth]="2" /> Wrapped and tied by hand in Karachi</li>
              <li><lucide-icon [img]="I.Truck" [size]="16" [strokeWidth]="2" /> Same day across Karachi before 2 pm</li>
              <li><lucide-icon [img]="I.ShieldCheck" [size]="16" [strokeWidth]="2" /> Replaced if anything arrives damaged</li>
            </ul>
          }
        }

        <footer class="panel-nav">
          @if (stepIndex() > 0) {
            <button type="button" class="btn btn-secondary btn-lg" (click)="move(-1)">
              <lucide-icon [img]="I.ChevronLeft" [size]="18" [strokeWidth]="2" /> Back
            </button>
          }
          @if (step() !== 'review') {
            <button type="button" class="btn btn-primary btn-lg next" (click)="move(1)" [disabled]="step() === 'treats' && store.itemCount() === 0">
              Continue to {{ steps[stepIndex() + 1].label.toLowerCase() }} <lucide-icon [img]="I.ChevronRight" [size]="18" [strokeWidth]="2" />
            </button>
          } @else {
            <button type="button" class="btn btn-primary btn-lg next" (click)="addToBag(false)" [disabled]="store.itemCount() === 0">
              <lucide-icon [img]="I.ShoppingBag" [size]="18" [strokeWidth]="2" /> Add to bag · {{ store.total() | money }}
            </button>
          }
        </footer>
        @if (step() === 'review') {
          <button type="button" class="btn btn-plain checkout-now" (click)="addToBag(true)" [disabled]="store.itemCount() === 0">Add to bag and check out now</button>
        }
      </section>

      <aside class="preview" aria-label="Your basket so far">
        <app-basket-summary [showCta]="false" />
      </aside>
    </div>

    <!-- phones: running total always in reach -->
    <div class="mobile-bar">
      <div><span class="t-small t-muted">{{ store.itemCount() }} treats · {{ current().label }}</span><strong class="t-num">{{ store.total() | money }}</strong></div>
      @if (step() !== 'review') {
        <button type="button" class="btn btn-primary" (click)="move(1)" [disabled]="step() === 'treats' && store.itemCount() === 0">Continue</button>
      } @else {
        <button type="button" class="btn btn-primary" (click)="addToBag(false)" [disabled]="store.itemCount() === 0">Add to bag</button>
      }
    </div>
  `,
  styles: `
    :host { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; min-width: 0; }

    .starts { display: grid; gap: 16px; }
    .start-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .start {
      display: grid; gap: 6px; align-content: start; justify-items: start; text-align: left; padding: 14px; border-radius: var(--radius);
      background: var(--surface); transition: background-color var(--dur-fast), transform var(--dur) var(--ease-out);
    }
    .start:hover { background: var(--surface-2); transform: translateY(-2px); }
    .start-imgs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 100%; margin-bottom: 6px; }
    .start-imgs img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; }
    .start strong { font-weight: 640; }
    .from { color: var(--accent); font-weight: 600; }
    .scratch { place-content: center; justify-items: center; text-align: center; background: var(--field); color: var(--field-ink); }
    .scratch lucide-icon { margin-bottom: 4px; }

    .stepper { position: sticky; top: var(--header-h); z-index: 20; background: var(--ground); padding-block: 12px 0; }
    .stepper ol { display: grid; grid-template-columns: repeat(5, 1fr); list-style: none; margin: 0; padding: 0; gap: 4px; }
    .stepper button { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-radius: var(--radius-sm); color: var(--ink-3); font-weight: 560; }
    .stepper button:hover { background: var(--surface); color: var(--ink); }
    .mark { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--surface-2); font-size: 0.8125rem; font-weight: 700; }
    .stepper .is-done { color: var(--ink-2); }
    .stepper .is-done .mark { background: var(--positive); color: #fff; }
    .stepper .is-now { color: var(--ink); }
    .stepper .is-now .mark { background: var(--accent); color: var(--accent-ink); }
    .bar { height: 3px; margin-top: 10px; background: var(--surface-2); border-radius: 2px; overflow: hidden; }
    .bar span { display: block; height: 100%; background: var(--accent); transition: width var(--dur-slow) var(--ease-out); }

    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: clamp(24px, 4vw, 56px); align-items: start; }
    .panel { display: grid; gap: 24px; outline: none; animation: panel-in var(--dur-slow) var(--ease-out); }
    @keyframes panel-in { from { opacity: 0; transform: translateY(12px); } }
    .panel-head { display: grid; gap: 6px; }
    .sub { display: grid; gap: 14px; }
    .preview { position: sticky; top: calc(var(--header-h) + 84px); }

    .capacity { display: grid; gap: 8px; padding: 14px 16px; border-radius: var(--radius); background: var(--surface); }
    .capacity.is-full { background: var(--field); }
    .cap-row { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .filters { display: grid; gap: 12px; }
    .filter-row { display: grid; grid-template-columns: 1fr 200px; gap: 10px; }
    .treats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 22px 14px; }
    .more { justify-self: center; }
    .empty { padding: 32px; text-align: center; border-radius: var(--radius); background: var(--surface); }

    .note-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ideas { display: grid; gap: 8px; }
    .wrap { flex-wrap: wrap; overflow: visible; }

    .review { display: grid; gap: 4px; margin: 0; }
    .review > div { display: grid; grid-template-columns: 140px 1fr auto; gap: 12px; align-items: start; padding: 16px 18px; border-radius: var(--radius); background: var(--surface); }
    .review dt { font-weight: 640; }
    .review dd { margin: 0; color: var(--ink-2); }
    .rev-list { display: grid; gap: 6px; }
    .rev-list li { display: flex; align-items: center; gap: 10px; }
    .rev-list img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
    .warn { color: var(--negative); font-weight: 560; }
    .promise { display: grid; gap: 8px; color: var(--ink-2); }
    .promise li { display: flex; align-items: center; gap: 10px; }
    .promise lucide-icon { color: var(--positive); }

    .panel-nav { display: flex; gap: 10px; justify-content: space-between; padding-top: 8px; }
    .panel-nav .next { margin-left: auto; }
    .checkout-now { justify-self: end; margin-top: -12px; }

    .mobile-bar { display: none; }

    @media (max-width: 1080px) {
      .start-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 980px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .preview { position: static; order: -1; }
      .panel-nav { display: none; }
      .checkout-now { justify-self: center; margin: 0; }
      .mobile-bar {
        position: sticky; bottom: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin: 0 calc(var(--gutter) * -1); padding: 12px var(--gutter) calc(12px + env(safe-area-inset-bottom));
        background: var(--ground); box-shadow: 0 -8px 24px rgb(0 0 0 / 0.08);
      }
      .mobile-bar > div { display: grid; }
      .mobile-bar strong { font-size: var(--text-headline); }
      .stepper .lbl { display: none; }
      .stepper button { justify-content: center; }
    }
    @media (max-width: 560px) {
      .start-grid, .note-grid, .filter-row { grid-template-columns: 1fr; }
      .review > div { grid-template-columns: 1fr auto; }
      .review dd { grid-column: 1 / -1; grid-row: 2; }
    }
  `,
})
export class BasketBuilder {
  protected readonly I = I;
  protected readonly store = inject(BuilderStore);
  private readonly bag = inject(BagStore);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected readonly steps = STEPS;
  protected readonly notes = NOTES;
  protected readonly page = PAGE;
  protected readonly step = signal<StepId>('basket');
  protected readonly started = signal(false);
  protected readonly stepIndex = computed(() => STEPS.findIndex((s) => s.id === this.step()));
  protected readonly current = computed(() => STEPS[this.stepIndex()]);

  // treats step
  protected readonly cat = signal('');
  protected readonly q = signal('');
  protected readonly maxPrice = signal(0);
  protected readonly limit = signal(PAGE);
  protected readonly categories = computed(() => this.catalog.categories().filter((c) => BASKET_CATEGORIES.includes(c.id)));
  private readonly eligible = computed(() => this.catalog.products().filter((p) => p.inStock && BASKET_CATEGORIES.includes(p.categoryId)));
  private readonly filtered = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    return this.eligible().filter(
      (p) =>
        (!this.cat() || p.categoryId === this.cat()) &&
        (!this.maxPrice() || p.price <= this.maxPrice()) &&
        words.every((w) => `${p.name} ${p.brand ?? ''}`.toLowerCase().includes(w)),
    );
  });
  protected readonly treats = computed(() => this.filtered().slice(0, this.limit()));
  protected readonly hidden = computed(() => this.filtered().length - this.treats().length);

  /** Starting points made from what's actually in stock. */
  protected readonly presets = computed(() => {
    const pick = (cat: string, n: number, max = Infinity) =>
      this.eligible().filter((p) => p.categoryId === cat && p.price <= max).slice(0, n);
    const ideas = [
      { id: 'choc', name: 'Chocolate lover', blurb: 'Belgian bars and a Belco box', baseId: 'b2', items: pick('chocolates', 4, 4000) },
      { id: 'eid', name: 'Eid sweets', blurb: 'Mithai with chocolate on the side', baseId: 'b3', items: [...pick('mithai', 3), ...pick('chocolates', 2, 2000)] },
      { id: 'kids', name: 'For little ones', blurb: 'A toy and chocolate treats', baseId: 'b1', items: [...pick('toys', 1), ...pick('chocolates', 3, 1500)] },
    ];
    return ideas
      .filter((p) => p.items.length)
      .map((p) => {
        const base = this.store.bases.find((b) => b.id === p.baseId)!;
        return { ...p, images: p.items.slice(0, 3).map((i) => i.images[0]), total: base.price + p.items.reduce((s, i) => s + i.price, 0) };
      });
  });

  usePreset(id: string): void {
    const p = this.presets().find((x) => x.id === id);
    if (!p) return;
    this.store.applyPreset(p.baseId, p.items as Product[]);
    this.started.set(true);
    this.go('review');
  }

  go(id: StepId): void {
    this.started.set(true);
    this.step.set(id);
    // bring the step's heading into view without jumping past the progress bar
    const top = (this.el.nativeElement as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
  }

  move(dir: number): void {
    const next = STEPS[this.stepIndex() + dir];
    if (next) this.go(next.id);
  }

  setCat(c: string): void {
    this.cat.set(c);
    this.limit.set(PAGE);
  }

  setQ(q: string): void {
    this.q.set(q);
    this.limit.set(PAGE);
  }

  setMax(n: number): void {
    this.maxPrice.set(n);
    this.limit.set(PAGE);
  }

  addToBag(checkout: boolean): void {
    this.bag.addBasket(this.store.asCartItem());
    this.store.reset();
    this.step.set('basket');
    this.started.set(false);
    if (checkout) this.router.navigate(['/cart']);
  }
}
