import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SeoService } from '../core/seo.service';
import { I } from './icons';

export interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a routerLink="/">Home</a></li>
        @for (c of items(); track c.label; let last = $last) {
          <li>
            <lucide-icon [img]="I.ChevronRight" [size]="14" [strokeWidth]="2" aria-hidden="true" />
            @if (c.link && !last) {
              <a [routerLink]="c.link">{{ c.label }}</a>
            } @else {
              <span aria-current="page" class="clamp-1 current" [title]="c.label">{{ c.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    ol { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; list-style: none; margin: 0; padding: 0; font-size: var(--text-small); color: var(--ink-3); }
    li { display: inline-flex; align-items: center; gap: 6px; }
    a { color: var(--ink-2); }
    a:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
    span { color: var(--ink); }
    li { min-width: 0; }
    .current { max-width: min(48ch, 60vw); display: inline-block; vertical-align: bottom; }
  `,
})
export class Breadcrumbs {
  protected readonly I = I;
  readonly items = input<Crumb[]>([]);

  constructor() {
    const seo = inject(SeoService);
    effect(() => seo.setBreadcrumbs(this.items()));
    inject(DestroyRef).onDestroy(() => seo.setBreadcrumbs([]));
  }
}
