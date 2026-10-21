import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { starGlyphs } from '../rating';

const WORDS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

/** Choose 1–5 stars: native radios (arrow keys work), hover preview, words for the score. Glyphs from @mhfrough/star-rating. */
@Component({
  selector: 'app-star-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stars" role="radiogroup" [attr.aria-label]="label()" (mouseleave)="hover.set(0)">
      @for (s of glyphs(); track $index; let i = $index) {
        <label [class]="s.kind" (mouseenter)="hover.set(i + 1)">
          <input class="visually-hidden" type="radio" [name]="name()" [value]="i + 1" [checked]="value() === i + 1" (change)="value.set(i + 1)" required />
          <span class="glyph" aria-hidden="true" [style.--star-size.px]="size()">{{ s.glyph }}</span>
          <span class="visually-hidden">{{ i + 1 }} {{ i === 0 ? 'star' : 'stars' }}, {{ words[i + 1] }}</span>
        </label>
      }
      <span class="word" aria-hidden="true">{{ words[hover() || value()] }}</span>
    </div>
  `,
  styles: `
    .stars { display: inline-flex; align-items: center; gap: 2px; }
    label { cursor: pointer; padding: 2px; border-radius: 6px; transition: transform var(--dur-fast) var(--ease-spring), color var(--dur-fast); }
    label:hover { transform: scale(1.12); }
    .glyph { display: block; width: 0.86em; line-height: 1; text-align: center; font-family: var(--font-stars); font-size: calc(var(--star-size) * var(--star-scale)); }
    label.full { color: #f5a623; }
    label.empty { color: var(--ink-3); }
    label:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
    .word { margin-left: 10px; font-weight: 600; min-width: 6ch; color: var(--ink-2); }
  `,
})
export class StarInput {
  protected readonly words = WORDS;
  readonly value = model(0);
  readonly name = input('rating');
  readonly label = input('Your rating');
  readonly size = input(30);
  protected readonly hover = signal(0);
  protected readonly glyphs = computed(() => starGlyphs(this.hover() || this.value()));
}
