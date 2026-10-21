import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Category } from '../../core/models';
import { I } from '../icons';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="row" [routerLink]="['/category', category().slug]">
      <img [src]="category().image ?? ''" alt="" loading="lazy" width="400" height="400" />
      <span class="text">
        <span class="name clamp-1">{{ category().name }}</span>
        <span class="desc clamp-2">{{ category().count }} gifts · {{ category().description }}</span>
      </span>
      <lucide-icon class="go" [img]="I.ChevronRight" [size]="20" [strokeWidth]="2" />
    </a>
  `,
  styles: `
    :host { display: block; }
    .row {
      display: grid;
      grid-template-columns: 76px 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 10px 16px 10px 10px;
      border-radius: var(--radius);
      background: var(--surface);
      transition: background-color var(--dur-fast) var(--ease-out);
    }
    .row:hover { background: var(--surface-2); }
    img { width: 76px; height: 76px; object-fit: cover; border-radius: 14px; }
    .text { display: grid; gap: 2px; min-width: 0; }
    .name { font-weight: 600; letter-spacing: -0.01em; }
    .desc { font-size: var(--text-small); color: var(--ink-2); }
    .go { color: var(--ink-3); transition: transform var(--dur-fast) var(--ease-out); }
    .row:hover .go { transform: translateX(3px); color: var(--ink); }
  `,
})
export class CategoryCard {
  protected readonly I = I;
  readonly category = input.required<Category>();
}
