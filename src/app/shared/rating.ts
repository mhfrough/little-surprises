import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import starRating from '@mhfrough/star-rating';

const KIND: Record<string, 'full' | 'half' | 'empty'> = { '★': 'full', '⯪': 'half', '☆': 'empty' };

/** The package's five glyphs for a score, each tagged so it can be coloured. It throws outside 0–5, so clamp first. */
export function starGlyphs(score: number) {
  return [...starRating(Math.min(5, Math.max(0, score || 0)))].map((glyph) => ({ glyph, kind: KIND[glyph] }));
}

/** Five stars from @mhfrough/star-rating (whole stars plus a half at .5 and up), then the number and count. */
@Component({
  selector: 'app-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  template: `
    <span class="stars" aria-hidden="true" [style.--star-size.px]="size()">
      @for (s of stars(); track $index) { <span [class]="s.kind">{{ s.glyph }}</span> }
    </span>
    @if (showValue()) {
      <span class="value t-num">{{ value().toFixed(1) }}</span>
    }
    @if (count() !== null) {
      <span class="count t-num">({{ count() }})</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-small); }
    /* One symbol font for all three glyphs, each in a fixed 1em box, so a fallback glyph can't shift the row. */
    .stars {
      display: inline-flex; line-height: 1; white-space: nowrap;
      font-family: var(--font-stars); font-size: calc(var(--star-size) * var(--star-scale));
    }
    /* box hugs the glyph's 0.83em advance; nudged down because the ink sits above the baseline with no descender */
    .stars > span { display: inline-block; width: 0.86em; text-align: center; transform: translateY(0.05em); }
    .full, .half { color: #f5a623; }
    .empty { color: var(--ink-3); }
    .value { font-weight: 620; }
    .count { color: var(--ink-3); }
  `,
})
export class Rating {
  readonly value = input.required<number>();
  readonly count = input<number | null>(null);
  readonly size = input(14);
  readonly showValue = input(true);

  protected readonly stars = computed(() => starGlyphs(this.value()));

  protected readonly label = computed(
    () => `Rated ${this.value().toFixed(1)} out of 5` + (this.count() !== null ? `, ${this.count()} reviews` : ''),
  );
}
