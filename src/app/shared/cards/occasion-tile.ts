import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Occasion } from '../../core/models';

@Component({
  selector: 'app-occasion-tile',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="tile" [routerLink]="['/occasion', occasion().id]">
      <span class="media"><img [src]="occasion().image" alt="" loading="lazy" width="400" height="400" /></span>
      <span class="name clamp-1">{{ occasion().name }}</span>
      <span class="count t-num">{{ occasion().count }} gifts</span>
    </a>
  `,
  styles: `
    :host { display: block; }
    .tile { display: grid; gap: 10px; justify-items: start; border-radius: var(--radius); min-width: 0; }
    .name { max-width: 100%; }
    .media {
      display: block;
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--surface-2);
    }
    img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow) var(--ease-out); }
    .tile:hover img { transform: scale(1.06); }
    .name { font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; }
    .count { font-size: var(--text-small); color: var(--ink-3); margin-top: -6px; }
  `,
})
export class OccasionTile {
  readonly occasion = input.required<Occasion>();
}
