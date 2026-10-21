import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The signature element: the "For you" tag from the Little Surprises logo.
 * It carries the customer's own note, tied on with the ribbon they chose.
 */
@Component({
  selector: 'app-gift-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-lg]': "size() === 'lg'", '[style.--ribbon]': 'ribbon()' },
  template: `
    <svg class="string" viewBox="0 0 80 60" fill="none" aria-hidden="true">
      <path d="M78 30C58 30 50 6 30 10C14 13 12 34 2 40" stroke="var(--ribbon)" stroke-width="3" stroke-linecap="round" />
    </svg>
    <figure class="tag" [attr.aria-label]="'Gift tag: ' + shownNote()">
      <span class="hole" aria-hidden="true"></span>
      <figcaption>
        <span class="to">For {{ to() || 'you' }}</span>
        <span class="note">{{ shownNote() }}</span>
        @if (from()) {
          <span class="from">{{ from() }}</span>
        }
      </figcaption>
    </figure>
  `,
  styles: `
    :host {
      --ribbon: var(--rose);
      --paper: #ffffff;
      --paper-ink: #3d0a20;
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      filter: drop-shadow(0 8px 16px rgb(42 10 24 / 0.16));
    }
    .string { width: 56px; height: 42px; flex: none; margin-right: -14px; position: relative; z-index: 1; }
    .tag {
      position: relative;
      min-width: 0;
      width: min(248px, calc(100vw - 104px));
      max-width: 100%;
      padding: 18px 22px 18px 46px;
      background: var(--paper);
      color: var(--paper-ink);
      clip-path: polygon(22px 0, 100% 0, 100% 100%, 22px 100%, 0 50%);
      border-radius: 4px 14px 14px 4px;
      transform: rotate(-3deg);
      transition: transform var(--dur-slow) var(--ease-spring);
    }
    :host(:hover) .tag { transform: rotate(0deg); }
    .hole {
      position: absolute;
      left: 16px;
      top: 50%;
      width: 12px;
      height: 12px;
      margin-top: -6px;
      border-radius: 50%;
      background: var(--ground);
      box-shadow: inset 0 0 0 2.5px var(--ribbon);
    }
    figcaption { display: grid; gap: 4px; }
    .to { font-size: 0.8125rem; font-weight: 650; color: #8a3a5c; }
    .note {
      font-size: 1rem;
      line-height: 1.4;
      font-weight: 520;
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .from { font-size: 0.8125rem; color: #6b4a58; }
    :host(.is-lg) .tag { width: min(320px, calc(100vw - 124px)); padding: 24px 28px 24px 54px; }
    :host(.is-lg) .note { font-size: 1.1875rem; }
    :host(.is-lg) .string { width: 72px; height: 54px; }
  `,
})
export class GiftTag {
  readonly to = input('');
  readonly note = input('');
  readonly from = input('');
  readonly ribbon = input('#d86b8a');
  readonly size = input<'md' | 'lg'>('md');
  readonly placeholder = input('A little something, wrapped by hand.');

  protected readonly shownNote = computed(() => this.note().trim() || this.placeholder());
}
