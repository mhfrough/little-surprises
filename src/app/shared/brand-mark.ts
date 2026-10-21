import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The Little Surprises logo mark, with the wordmark and tagline set beside it. */
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mark" [style.width.px]="size()" [style.height.px]="size()">
      <img src="brand/mark.webp" alt="" [width]="size()" [height]="size()" />
    </span>
    @if (wordmark()) {
      <span class="words">
        <span class="word"><span class="a">Little</span><span class="b">Surprises</span></span>
        @if (tagline()) {
          <span class="line">Personalized with love</span>
        }
      </span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 10px; }
    .mark { display: grid; place-items: center; flex: none; border-radius: 12px; }
    .mark img { width: 100%; height: 100%; object-fit: contain; }
    :host-context([data-theme='dark']) .mark { background: #fbf1f4; padding: 3px; }
    @media (prefers-color-scheme: dark) {
      :host-context(:root:not([data-theme='light'])) .mark { background: #fbf1f4; padding: 3px; }
    }
    .words { display: grid; gap: 3px; }
    .word {
      font-family: var(--font-brand);
      font-weight: 500;
      font-size: 1.5rem;
      letter-spacing: 0.05em;
      line-height: 1;
      white-space: nowrap;
    }
    .a { color: var(--accent); }
    .b { color: var(--rose); margin-left: 0.32em; }
    .line { font-size: 0.625rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-3); white-space: nowrap; }
  `,
})
export class BrandMark {
  readonly size = input(40);
  readonly wordmark = input(true);
  readonly tagline = input(true);
}
