import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The developer's ء (hamza) mark, copied from mhfrough.dev (src/app/shared/ui/logo.ts).
 * Geometry on a 48-unit grid — do not redraw by eye:
 *   arc  M30.16 15.34A8 8 0 1 0 24.5 29 (stroke 5)
 *   tail M22.5 26.5H37V28.5L15.5 38V35Z (filled)
 */
@Component({
  selector: 'app-mh-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 48 48" [attr.width]="size()" [attr.height]="size()" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="14" class="tile" />
      <g transform="translate(5.28 5.28) scale(.78)">
        <path d="M30.16 15.34A8 8 0 1 0 24.5 29" fill="none" class="ink-stroke" stroke-width="5" />
        <path d="M22.5 26.5H37V28.5L15.5 38V35Z" class="ink-fill" />
      </g>
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; }
    .tile { fill: #ededed; }
    .ink-stroke { stroke: #111111; }
    .ink-fill { fill: #111111; }
  `,
})
export class MhLogo {
  readonly size = input(40);
}
