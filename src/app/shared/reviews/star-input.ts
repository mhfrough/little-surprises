import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from '../icons';

const WORDS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

/** Choose 1–5 stars: native radios (arrow keys work), hover preview, words for the score. */
@Component({
  selector: 'app-star-input',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stars" role="radiogroup" [attr.aria-label]="label()" (mouseleave)="hover.set(0)">
      @for (n of [1, 2, 3, 4, 5]; track n) {
        <label [class.on]="n <= (hover() || value())" (mouseenter)="hover.set(n)">
          <input class="visually-hidden" type="radio" [name]="name()" [value]="n" [checked]="value() === n" (change)="value.set(n)" required />
          <lucide-icon [img]="I.Star" [size]="size()" [strokeWidth]="1.5" />
          <span class="visually-hidden">{{ n }} {{ n === 1 ? 'star' : 'stars' }}, {{ words[n] }}</span>
        </label>
      }
      <span class="word" aria-hidden="true">{{ words[hover() || value()] }}</span>
    </div>
  `,
  styles: `
    .stars { display: inline-flex; align-items: center; gap: 2px; }
    label { cursor: pointer; padding: 2px; border-radius: 6px; color: var(--surface-3); transition: transform var(--dur-fast) var(--ease-spring), color var(--dur-fast); }
    label:hover { transform: scale(1.12); }
    label.on { color: #f5a623; }
    label ::ng-deep svg { fill: currentColor; }
    label:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
    .word { margin-left: 10px; font-weight: 600; min-width: 6ch; color: var(--ink-2); }
  `,
})
export class StarInput {
  protected readonly I = I;
  protected readonly words = WORDS;
  readonly value = model(0);
  readonly name = input('rating');
  readonly label = input('Your rating');
  readonly size = input(30);
  protected readonly hover = signal(0);
}
