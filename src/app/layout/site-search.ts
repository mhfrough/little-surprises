import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CatalogService, cityLabel } from '../core/catalog.service';
import { SearchService, Suggestion } from '../core/search.service';
import { I } from '../shared/icons';
import { MoneyPipe } from '../shared/money.pipe';

interface Option {
  id: string;
  label: string;
  run: () => void;
}

const MAX_PRODUCTS = 6;

/**
 * Header search. A real field to click into (not a bare icon), opening a
 * sheet under the bar with the page dimmed behind: recent and popular
 * searches before typing; then completions, categories and product matches
 * (with picture and price) that update as you type, typo-tolerant, keyboard
 * driven (↑ ↓ Enter Esc, "/" or Ctrl+K to open). Full screen on phones.
 */
@Component({
  selector: 'app-site-search',
  imports: [RouterLink, LucideAngularModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- trigger: looks and reads like a field on wide screens, an icon on narrow -->
    <button type="button" class="trigger" (click)="openSheet()" aria-haspopup="dialog" [attr.aria-expanded]="open()">
      <lucide-icon [img]="I.Search" [size]="18" [strokeWidth]="2" />
      <span class="ph">Search gifts, cakes, Belco…</span>
      <kbd aria-hidden="true">/</kbd>
      <span class="visually-hidden">Search</span>
    </button>

    @if (open()) {
      <div class="scrim" (click)="close()" aria-hidden="true"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Search">
        <div class="container bar">
          <div class="field" role="combobox" [attr.aria-expanded]="hasResults()" aria-haspopup="listbox" aria-owns="search-list">
            <lucide-icon [img]="I.Search" [size]="22" [strokeWidth]="2" />
            <label class="visually-hidden" for="site-search">Search gifts</label>
            <input #input id="site-search" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search"
              placeholder="Search gifts, cakes, Belco, mithai…" [value]="q()" (input)="type($any($event.target).value)"
              (keydown)="keys($event)" aria-autocomplete="list" aria-controls="search-list"
              [attr.aria-activedescendant]="active() >= 0 ? options()[active()]?.id : null" />
            @if (q()) {
              <button type="button" class="clear" (click)="type(''); focus()" aria-label="Clear search">
                <lucide-icon [img]="I.X" [size]="18" [strokeWidth]="2" />
              </button>
            }
          </div>
          <button type="button" class="cancel" (click)="close()">Cancel</button>
        </div>

        <div class="container body" id="search-list" role="listbox" aria-label="Search suggestions">
          @if (!q().trim()) {
            <!-- before typing -->
            <div class="cols">
              <div class="col">
                @if (search.recent().length) {
                  <div class="head"><h2>Recent</h2><button type="button" class="link" (click)="search.forget(null)">Clear</button></div>
                  <ul class="list" role="presentation">
                    @for (r of search.recent(); track r; let i = $index) {
                      <li role="presentation" class="row-with-x">
                        <button type="button" role="option" [id]="'opt-r' + i" [attr.aria-selected]="optIndex('opt-r' + i) === active()"
                          class="opt" (click)="submit(r)">
                          <lucide-icon [img]="I.Clock" [size]="16" [strokeWidth]="2" /> {{ r }}
                        </button>
                        <button type="button" class="x" (click)="search.forget(r)" [attr.aria-label]="'Remove ' + r">
                          <lucide-icon [img]="I.X" [size]="14" [strokeWidth]="2" />
                        </button>
                      </li>
                    }
                  </ul>
                }
                <h2>Popular right now</h2>
                <div class="chips">
                  @for (p of search.popular; track p; let i = $index) {
                    <button type="button" role="option" class="chip" [id]="'opt-p' + i" [attr.aria-selected]="optIndex('opt-p' + i) === active()"
                      (click)="submit(p)">{{ p }}</button>
                  }
                </div>
              </div>
              <div class="col wide">
                <h2>Browse</h2>
                <div class="cats">
                  @for (c of catalog.categories(); track c.id; let i = $index) {
                    <a [routerLink]="['/category', c.slug]" role="option" class="cat" [id]="'opt-c' + i"
                      [attr.aria-selected]="optIndex('opt-c' + i) === active()" (click)="close()">
                      <img [src]="c.image ?? ''" alt="" width="64" height="64" />
                      <span><strong>{{ c.name }}</strong><span>{{ c.count }} gifts</span></span>
                    </a>
                  }
                </div>
              </div>
            </div>
          } @else {
            <!-- while typing -->
            @if (fix(); as f) {
              <p class="fix">Showing results for <button type="button" class="link" (click)="type(f)">{{ f }}</button>
                @if (!results().length) { — nothing matched “{{ q() }}” }</p>
            }
            <div class="cols">
              <div class="col">
                @if (sugs().length) {
                  <h2>Suggestions</h2>
                  <ul class="list" role="presentation">
                    @for (s of sugs(); track s.kind + s.text; let i = $index) {
                      <li role="presentation">
                        <button type="button" role="option" class="opt" [id]="'opt-s' + i" [attr.aria-selected]="optIndex('opt-s' + i) === active()"
                          (click)="pick(s)">
                          <lucide-icon [img]="s.kind === 'term' ? I.Search : I.ArrowUpRight" [size]="16" [strokeWidth]="2" />
                          <span class="s-text">
                            @for (part of highlight(s.text); track $index) {
                              @if (part.hit) { <span class="typed">{{ part.text }}</span> } @else { <strong>{{ part.text }}</strong> }
                            }
                          </span>
                          <span class="kind">{{ kindLabel(s) }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                }
                @if (!results().length) {
                  <div class="none">
                    <p><strong>No gifts match “{{ q() }}” in {{ city() }}.</strong></p>
                    <p class="t-small">Try a shorter word, or one of these:</p>
                    <div class="chips">
                      @for (p of search.popular.slice(0, 4); track p) {
                        <button type="button" class="chip" (click)="type(p)">{{ p }}</button>
                      }
                    </div>
                  </div>
                }
              </div>
              @if (results().length) {
                <div class="col wide">
                  <h2>Gifts <span class="n">{{ results().length }}</span></h2>
                  <ul class="products" role="presentation">
                    @for (r of results().slice(0, maxProducts); track r.product.id; let i = $index) {
                      <li role="presentation">
                        <a [routerLink]="['/product', r.product.slug]" role="option" class="prod" [id]="'opt-g' + i"
                          [attr.aria-selected]="optIndex('opt-g' + i) === active()" (click)="remember(); close()">
                          <img [src]="r.product.images[0]" alt="" width="64" height="64" />
                          <span class="p-text">
                            <span class="p-name">
                              @for (part of highlight(r.product.name); track $index) {
                                @if (part.hit) { <mark>{{ part.text }}</mark> } @else { {{ part.text }} }
                              }
                            </span>
                            <span class="p-meta">{{ r.product.brand ? r.product.brand + ' · ' : '' }}{{ catalog.categoryName(r.product.categoryId) }}{{ r.product.inStock ? '' : ' · Sold out' }}</span>
                          </span>
                          <span class="p-price t-num">{{ r.product.price | money }}</span>
                        </a>
                      </li>
                    }
                  </ul>
                  <button type="button" role="option" class="all btn btn-secondary btn-block" [id]="'opt-all'"
                    [attr.aria-selected]="optIndex('opt-all') === active()" (click)="submit(q())">
                    See all {{ results().length }} results for “{{ q() }}”
                  </button>
                </div>
              }
            </div>
          }
          <p class="foot t-small">
            <span>Showing gifts that deliver to {{ city() }}</span>
            <span class="keys" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close</span>
          </p>
        </div>
      </div>
    }
  `,
  styles: `
    :host { display: contents; }
    .trigger {
      display: inline-flex; align-items: center; gap: 10px; height: 42px; width: clamp(200px, 20vw, 290px);
      padding: 0 8px 0 14px; border-radius: var(--radius-pill); background: var(--surface-2); color: var(--ink-3);
      font-size: 0.9375rem; transition: background-color var(--dur-fast);
    }
    .trigger:hover { background: var(--surface-3); }
    .trigger lucide-icon { color: var(--ink-2); flex: none; }
    .ph { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    kbd {
      display: inline-grid; place-items: center; min-width: 24px; height: 24px; padding: 0 6px; border-radius: 6px;
      background: var(--ground); color: var(--ink-2); font: 600 0.75rem var(--font-text); box-shadow: inset 0 -1px 0 var(--surface-3);
    }
    @media (max-width: 1240px) {
      .trigger { width: 44px; height: 44px; padding: 0; justify-content: center; background: none; color: var(--ink); }
      .trigger:hover { background: var(--surface-2); }
      .trigger lucide-icon { color: var(--ink); }
      .ph, .trigger kbd { display: none; }
    }

    .scrim { position: fixed; inset: 0; z-index: 90; background: var(--scrim); animation: fade var(--dur) var(--ease-out); }
    .sheet {
      position: fixed; left: 0; right: 0; top: 0; z-index: 91; max-height: min(86vh, 760px); overflow: auto;
      background: var(--ground); box-shadow: var(--shadow-float); border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      animation: drop var(--dur) var(--ease-out); overscroll-behavior: contain;
    }
    @keyframes fade { from { opacity: 0; } }
    @keyframes drop { from { opacity: 0; transform: translateY(-16px); } }

    .bar { display: flex; align-items: center; gap: 12px; padding-block: 18px 10px; position: sticky; top: 0; background: var(--ground); z-index: 1; }
    .field { flex: 1; display: flex; align-items: center; gap: 12px; height: 60px; padding: 0 12px 0 20px; border-radius: var(--radius-pill); background: var(--surface-2); }
    .field:focus-within { box-shadow: 0 0 0 2px var(--accent); background: var(--ground); }
    .field lucide-icon { color: var(--ink-2); flex: none; }
    .field input { flex: 1; min-width: 0; height: 100%; border: 0; background: none; outline: none; font-size: 1.25rem; letter-spacing: -0.01em; color: var(--ink); }
    .field input::placeholder { color: var(--ink-3); }
    .field input::-webkit-search-cancel-button { display: none; }
    .clear { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-3); color: var(--ink); }
    .cancel { font-weight: 600; color: var(--accent); padding: 10px 6px; }

    .body { padding-block: 12px 20px; }
    .cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: 40px; }
    .col { display: grid; gap: 10px; align-content: start; }
    h2 { font-size: 0.8125rem; font-weight: 650; color: var(--ink-3); margin-top: 8px; }
    .n { color: var(--ink-3); font-weight: 500; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .link { color: var(--accent); font-weight: 600; font-size: var(--text-small); text-decoration: underline; text-underline-offset: 3px; }
    ul { list-style: none; margin: 0; padding: 0; }
    .list { display: grid; gap: 2px; }
    .opt, .prod, .cat {
      width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-sm); text-align: left;
      color: var(--ink); transition: background-color var(--dur-fast);
    }
    .opt lucide-icon { color: var(--ink-3); flex: none; }
    .opt:hover, .prod:hover, .cat:hover, [aria-selected='true'] { background: var(--surface-2); }
    [aria-selected='true'].chip { background: var(--ink); color: var(--ground); }
    .row-with-x { display: flex; align-items: center; }
    .row-with-x .opt { flex: 1; }
    .x { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--ink-3); }
    .x:hover { background: var(--surface-2); color: var(--ink); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .s-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .s-text .typed { color: var(--ink-2); }
    .s-text strong { font-weight: 650; }
    .kind { font-size: 0.75rem; color: var(--ink-3); padding: 2px 8px; border-radius: var(--radius-pill); background: var(--surface); }

    .cats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
    .cat img { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; flex: none; }
    .cat span { display: grid; }
    .cat strong { font-weight: 600; }
    .cat span span { font-size: var(--text-small); color: var(--ink-3); }

    .products { display: grid; gap: 2px; }
    .prod img { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; flex: none; background: var(--surface-2); }
    .p-text { flex: 1; display: grid; min-width: 0; }
    .p-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    mark { background: var(--field); color: var(--field-ink); border-radius: 3px; padding: 0 1px; }
    .p-meta { font-size: var(--text-small); color: var(--ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .p-price { font-weight: 620; }
    .all { margin-top: 8px; }

    .fix { padding: 8px 12px; border-radius: var(--radius-sm); background: var(--surface); margin-bottom: 8px; }
    .none { display: grid; gap: 8px; padding: 16px; border-radius: var(--radius); background: var(--surface); }
    .foot { display: flex; justify-content: space-between; gap: 12px; color: var(--ink-3); margin-top: 18px; }
    .foot kbd { min-width: 20px; height: 20px; font-size: 0.6875rem; margin: 0 2px; }

    @media (max-width: 760px) {
      .sheet { bottom: 0; max-height: none; border-radius: 0; }
      .cols { grid-template-columns: 1fr; gap: 16px; }
      .field { height: 52px; }
      .field input { font-size: 1.0625rem; }
      .keys { display: none; }
      .cats { grid-template-columns: 1fr; }
    }
  `,
})
export class SiteSearch {
  protected readonly I = I;
  protected readonly search = inject(SearchService);
  protected readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly maxProducts = MAX_PRODUCTS;
  protected readonly open = signal(false);
  protected readonly q = signal('');
  protected readonly active = signal(-1);
  protected readonly city = computed(() => cityLabel(this.catalog.city()));

  protected readonly results = computed(() => {
    const r = this.search.products(this.q());
    if (r.length) return r;
    const f = this.search.correction(this.q());
    return f ? this.search.products(f) : [];
  });
  protected readonly fix = computed(() => (this.q().trim() && !this.search.products(this.q()).length ? this.search.correction(this.q()) : null));
  protected readonly sugs = computed(() => this.search.suggestions(this.q(), 5));
  protected readonly hasResults = computed(() => !!this.q().trim() && (this.results().length > 0 || this.sugs().length > 0));

  /** Every choosable row, in screen order, for the arrow keys. */
  protected readonly options = computed<Option[]>(() => {
    if (!this.q().trim()) {
      return [
        ...this.search.recent().map((r, i) => ({ id: 'opt-r' + i, label: r, run: () => this.submit(r) })),
        ...this.search.popular.map((p, i) => ({ id: 'opt-p' + i, label: p, run: () => this.submit(p) })),
        ...this.catalog.categories().map((c, i) => ({ id: 'opt-c' + i, label: c.name, run: () => this.go(['/category', c.slug]) })),
      ];
    }
    return [
      ...this.sugs().map((s, i) => ({ id: 'opt-s' + i, label: s.text, run: () => this.pick(s) })),
      ...this.results().slice(0, MAX_PRODUCTS).map((r, i) => ({ id: 'opt-g' + i, label: r.product.name, run: () => { this.remember(); this.go(['/product', r.product.slug]); } })),
      ...(this.results().length ? [{ id: 'opt-all', label: 'all', run: () => this.submit(this.q()) }] : []),
    ];
  });

  optIndex(id: string): number {
    return this.options().findIndex((o) => o.id === id);
  }

  @HostListener('document:keydown', ['$event'])
  shortcut(e: KeyboardEvent): void {
    const t = e.target as HTMLElement;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      this.openSheet();
    }
  }

  openSheet(): void {
    // keep the last query in the box (people refine rather than retype)
    const url = this.router.parseUrl(this.router.url);
    if (!this.q() && url.queryParams['q']) this.q.set(url.queryParams['q']);
    this.open.set(true);
    this.active.set(-1);
    this.doc.body.style.overflow = 'hidden';
    // the field renders on the next change-detection pass
    setTimeout(() => this.focus(true));
  }

  close(): void {
    this.open.set(false);
    this.doc.body.style.overflow = '';
  }

  focus(select = false): void {
    const el = this.input()?.nativeElement;
    el?.focus();
    if (select) el?.select();
  }

  type(v: string): void {
    this.q.set(v);
    this.active.set(-1);
  }

  keys(e: KeyboardEvent): void {
    const n = this.options().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.active.set(n ? (this.active() + 1) % n : -1);
      this.scrollActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.set(n ? (this.active() - 1 + n) % n : -1);
      this.scrollActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = this.options()[this.active()];
      if (opt) opt.run();
      else this.submit(this.q());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (this.q()) this.type('');
      else this.close();
    }
  }

  private scrollActive(): void {
    const id = this.options()[this.active()]?.id;
    if (id) queueMicrotask(() => this.doc.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
  }

  pick(s: Suggestion): void {
    if (s.link) {
      this.remember(s.text);
      this.router.navigateByUrl(s.link);
      this.close();
    } else {
      this.type(s.text + ' ');
      this.focus();
    }
  }

  submit(q: string): void {
    const t = q.trim();
    if (!t) return;
    this.search.remember(t);
    this.q.set(t);
    this.router.navigate(['/shop'], { queryParams: { q: t } });
    this.close();
  }

  remember(text = this.q()): void {
    this.search.remember(text);
  }

  private go(commands: string[]): void {
    this.router.navigate(commands);
    this.close();
  }

  kindLabel(s: Suggestion): string {
    return s.kind === 'term' ? `${s.count}` : `${s.kind === 'category' ? 'Category' : s.kind === 'occasion' ? 'Occasion' : 'Brand'} · ${s.count}`;
  }

  /** Split a label into parts matching what was typed, for highlighting. */
  highlight(text: string): { text: string; hit: boolean }[] {
    const ws = this.q().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!ws.length) return [{ text, hit: false }];
    const re = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(re).filter(Boolean).map((part) => ({ text: part, hit: ws.includes(part.toLowerCase()) }));
  }
}
