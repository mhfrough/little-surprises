import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from './icons';

@Component({
  selector: 'app-qty-stepper',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': "'Quantity for ' + label()" },
  template: `
    <button type="button" (click)="value.set(value() - 1)" [disabled]="value() <= min()"
      [attr.aria-label]="'Remove one ' + label()">
      <lucide-icon [img]="value() <= 1 && min() === 0 ? I.Trash2 : I.Minus" [size]="16" [strokeWidth]="2" />
    </button>
    <output class="t-num" aria-live="polite">{{ value() }}</output>
    <button type="button" (click)="value.set(value() + 1)" [disabled]="value() >= max()"
      [attr.aria-label]="'Add one ' + label()">
      <lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2" />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      height: var(--control-sm);
      border-radius: var(--radius-pill);
      background: var(--surface-2);
      padding: 2px;
    }
    button {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: var(--ink);
      transition: background-color var(--dur-fast) var(--ease-out);
    }
    button:hover:not(:disabled) { background: var(--ground); }
    button:disabled { opacity: 0.35; cursor: not-allowed; }
    output { min-width: 28px; text-align: center; font-weight: 620; font-size: var(--text-small); }
  `,
})
export class QtyStepper {
  protected readonly I = I;
  readonly value = model(1);
  readonly min = input(0);
  readonly max = input(99);
  readonly label = input('item');
}
