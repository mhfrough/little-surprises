import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Theme, ThemeService } from '../core/theme.service';
import { I } from './icons';

/** Light / Dark / Auto, as a three-way switch. `tone="dark"` for use on the plum bar. */
@Component({
  selector: 'app-theme-toggle',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.on-dark]': "tone() === 'dark'" },
  template: `
    <div class="switch" role="radiogroup" aria-label="Colour theme">
      @for (o of options; track o.id) {
        <button type="button" role="radio" [attr.aria-checked]="themes.theme() === o.id" (click)="themes.set(o.id)"
          [attr.aria-label]="o.label" [title]="o.label">
          <lucide-icon [img]="o.icon" [size]="15" [strokeWidth]="2" />
          @if (labels()) { <span>{{ o.short }}</span> }
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: inline-flex; }
    .switch { display: inline-flex; padding: 2px; gap: 2px; border-radius: var(--radius-pill); background: var(--surface-2); }
    button {
      display: inline-flex; align-items: center; gap: 6px; height: 28px; min-width: 28px; padding: 0 8px; justify-content: center;
      border-radius: var(--radius-pill); color: var(--ink-2); font-size: 0.8125rem; font-weight: 560;
      transition: background-color var(--dur-fast), color var(--dur-fast);
    }
    button:hover { color: var(--ink); }
    button[aria-checked='true'] { background: var(--ground); color: var(--ink); box-shadow: 0 1px 4px rgb(0 0 0 / 0.12); }
    :host(.on-dark) .switch { background: rgb(255 255 255 / 0.1); }
    :host(.on-dark) button { color: rgb(247 232 236 / 0.75); }
    :host(.on-dark) button:hover { color: #fff; }
    :host(.on-dark) button[aria-checked='true'] { background: rgb(255 255 255 / 0.9); color: #2a0a18; }
  `,
})
export class ThemeToggle {
  protected readonly themes = inject(ThemeService);
  readonly tone = input<'light' | 'dark'>('light');
  readonly labels = input(false);
  protected readonly options: { id: Theme; label: string; short: string; icon: typeof I.Sun }[] = [
    { id: 'light', label: 'Light theme', short: 'Light', icon: I.Sun },
    { id: 'dark', label: 'Dark theme', short: 'Dark', icon: I.Moon },
    { id: 'system', label: 'Match my device', short: 'Auto', icon: I.Monitor },
  ];
}
