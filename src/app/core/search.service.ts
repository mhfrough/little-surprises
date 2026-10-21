import { Injectable, computed, inject, signal } from '@angular/core';
import { OCCASION_DEFS } from './catalog';
import { CatalogService } from './catalog.service';
import { Product } from './models';

export interface ScoredProduct {
  product: Product;
  score: number;
}

export interface Suggestion {
  /** what goes in the box when chosen */
  text: string;
  /** where it lives, e.g. "Category", "Brand" */
  kind: 'term' | 'category' | 'occasion' | 'brand';
  link?: string;
  count: number;
}

const RECENT_KEY = 'gw-recent-searches';
const MAX_RECENT = 6;

/** Words people type for things the catalog names differently. */
const SYNONYMS: Record<string, string[]> = {
  chocolate: ['choc', 'chocolates', 'choco', 'cocoa'],
  cake: ['cakes', 'birthday cake'],
  flowers: ['flower', 'roses', 'rose', 'bouquet', 'phool'],
  mithai: ['sweets', 'mithae', 'mithayi', 'laddu', 'barfi'],
  perfume: ['perfumes', 'fragrance', 'scent', 'attar'],
  toys: ['toy', 'kids', 'children'],
  hampers: ['hamper', 'basket', 'baskets', 'gift box'],
};

const normal = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ');
const words = (s: string) => normal(s).split(/\s+/).filter(Boolean);

/** Edit distance, capped: we only care whether it is 0, 1 or 2. */
function distance(a: string, b: string, cap = 2): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** How well one typed word matches one word of the item: 1 exact/prefix, 0.6 typo, 0 none. */
function wordMatch(q: string, w: string): number {
  if (w.startsWith(q)) return 1;
  if (q.length >= 4 && w.includes(q)) return 0.8;
  if (q.length >= 4) {
    const d = distance(q, w.slice(0, Math.max(q.length, w.length)), q.length >= 7 ? 2 : 1);
    if (d <= (q.length >= 7 ? 2 : 1)) return 0.6;
    const dp = distance(q, w.slice(0, q.length), 1);
    if (dp <= 1) return 0.55;
  }
  return 0;
}

/**
 * Site search: weighted fields, prefix matching as you type, typo tolerance,
 * a few local synonyms (Roman Urdu included), recent searches on this device.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly catalog = inject(CatalogService);
  readonly recent = signal<string[]>(readRecent());

  readonly popular = ['Kunafa', 'Red roses', 'Birthday cake', 'Mithai', 'Sugar free', 'Perfume', 'Belco box'];

  /** Search index, rebuilt when the catalog or city changes. */
  private readonly index = computed(() =>
    this.catalog.products().map((p) => ({
      product: p,
      name: words(p.name),
      brand: words(p.brand ?? ''),
      cat: words(this.catalog.categoryName(p.categoryId)),
      occ: p.occasions.flatMap((o) => words(o.replace(/-/g, ' '))),
      desc: words(p.description).slice(0, 60),
    })),
  );

  private expand(q: string): string[][] {
    // each typed word, plus the canonical word it is a synonym of
    return words(q).map((w) => {
      const alts = [w];
      for (const [canon, list] of Object.entries(SYNONYMS)) if (list.includes(w)) alts.push(canon);
      return alts;
    });
  }

  products(q: string): ScoredProduct[] {
    const terms = this.expand(q);
    if (!terms.length) return [];
    const out: ScoredProduct[] = [];
    for (const item of this.index()) {
      let total = 0;
      let ok = true;
      for (const alts of terms) {
        let best = 0;
        for (const t of alts) {
          const field = (ws: string[], weight: number) => ws.reduce((m, w) => Math.max(m, wordMatch(t, w) * weight), 0);
          best = Math.max(best, field(item.name, 3), field(item.brand, 2.2), field(item.cat, 2), field(item.occ, 1.6), field(item.desc, 0.8));
        }
        if (best === 0) {
          ok = false;
          break;
        }
        total += best;
      }
      if (ok) out.push({ product: item.product, score: total + (item.product.inStock ? 0.5 : 0) });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  /** Query completions and places to jump to — at most `limit`. */
  suggestions(q: string, limit = 5): Suggestion[] {
    const typed = normal(q).trim();
    if (!typed) return [];
    const last = typed.split(/\s+/).pop()!;
    const res: Suggestion[] = [];
    const seen = new Set<string>();
    const add = (s: Suggestion) => {
      const k = s.kind + s.text.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        res.push(s);
      }
    };
    const matches = (label: string) => words(label).some((w) => wordMatch(last, w) > 0) || normal(label).startsWith(typed);

    for (const c of this.catalog.categories()) if (matches(c.name)) add({ text: c.name, kind: 'category', link: `/category/${c.slug}`, count: this.catalog.inCategory(c.id).length });
    for (const o of OCCASION_DEFS) {
      const n = this.catalog.inOccasion(o.id).length;
      if (n && matches(o.name)) add({ text: o.name, kind: 'occasion', link: `/occasion/${o.id}`, count: n });
    }
    const brands = [...new Set(this.catalog.products().map((p) => p.brand).filter((b): b is string => !!b))];
    for (const b of brands) if (matches(b)) add({ text: b, kind: 'brand', link: `/shop?brand=${encodeURIComponent(b)}`, count: this.catalog.products().filter((p) => p.brand === b).length });

    // phrases from product names that continue what was typed ("kun" → "kunafa bar")
    const phrases = new Map<string, number>();
    for (const p of this.catalog.products()) {
      const ws = words(p.name);
      ws.forEach((w, i) => {
        if (w.startsWith(last) && w.length > 2) {
          const phrase = ws.slice(i, i + 2).filter((x) => !/^\d/.test(x)).join(' ');
          phrases.set(phrase, (phrases.get(phrase) ?? 0) + 1);
        }
      });
    }
    [...phrases.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .forEach(([text, count]) => add({ text: typed.split(/\s+/).slice(0, -1).concat(text).join(' '), kind: 'term', count }));

    return res.slice(0, limit);
  }

  /** "Did you mean": the closest catalog word for a misspelt one. */
  correction(q: string): string | null {
    const vocab = new Set(this.index().flatMap((i) => [...i.name, ...i.brand, ...i.cat]).filter((w) => w.length > 3));
    let changed = false;
    const fixed = words(q).map((w) => {
      if (vocab.has(w) || w.length < 4) return w;
      let best = w;
      let bestD = 3;
      for (const v of vocab) {
        const d = distance(w, v, 2);
        if (d < bestD) {
          bestD = d;
          best = v;
        }
      }
      if (best !== w) changed = true;
      return best;
    });
    return changed ? fixed.join(' ') : null;
  }

  remember(q: string): void {
    const t = q.trim();
    if (!t) return;
    this.recent.update((r) => [t, ...r.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT));
    this.save();
  }

  forget(q: string | null): void {
    this.recent.update((r) => (q === null ? [] : r.filter((x) => x !== q)));
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(this.recent()));
    } catch {
      /* storage blocked — recent searches last this visit */
    }
  }
}

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}
