import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from './icons';

let uid = 0;

/**
 * Off-canvas panel from the right, for a form that edits something on the page
 * behind it. Mark the form's button row `drawer-actions` to pin it to the bottom. A native modal <dialog>: focus stays inside, Esc and the backdrop
 * ask to close it, the page behind is inert. It is fully controlled: bind [open],
 * and set it false on (closed), which fires however the user dismissed it.
 */
@Component({
  selector: 'app-drawer',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg class="drawer" [attr.aria-labelledby]="titleId" (cancel)="$event.preventDefault(); dismiss()" (close)="closed.emit()" (click)="onBackdrop($event)">
      <div class="panel">
        <header class="head">
          <h2 [id]="titleId">{{ heading() }}</h2>
          <button type="button" class="adm-icon-btn" (click)="dismiss()" aria-label="Close"><lucide-icon [img]="I.X" [size]="18" [strokeWidth]="2" /></button>
        </header>
        <div class="body"><ng-content /></div>
      </div>
    </dialog>
  `,
  styles: `
    /* floats clear of the screen edges, like a card laid over the page */
    .drawer {
      --gap: 12px;
      position: fixed; inset: var(--gap) var(--gap) var(--gap) auto; width: min(440px, calc(100vw - var(--gap) * 2));
      height: calc(100dvh - var(--gap) * 2); max-width: none; max-height: none;
      margin: 0; padding: 0; border: 0; border-radius: var(--radius); overflow: hidden;
      background: var(--ground); color: var(--ink); box-shadow: var(--shadow-float);
      translate: calc(100% + var(--gap)) 0;
      transition: translate var(--dur) var(--ease-out), display var(--dur) allow-discrete, overlay var(--dur) allow-discrete;
    }
    .drawer[open] { translate: 0 0; }
    @starting-style { .drawer[open] { translate: calc(100% + var(--gap)) 0; } }
    @media (max-width: 560px) { .drawer { --gap: 8px; } }
    .drawer::backdrop {
      background: var(--scrim); opacity: 0;
      transition: opacity var(--dur) var(--ease-out), display var(--dur) allow-discrete, overlay var(--dur) allow-discrete;
    }
    .drawer[open]::backdrop { opacity: 1; }
    @starting-style { .drawer[open]::backdrop { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .drawer, .drawer::backdrop { transition: none; } }

    /* the panel fills the dialog, so a click that lands on the dialog itself is the backdrop */
    .panel { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100%; }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; border-bottom: 1px solid var(--surface-2); }
    .head h2 { font-size: 1.125rem; font-weight: 650; letter-spacing: -0.01em; }
    .body { overflow-y: auto; padding: 24px 24px 0; }
    /* A form inside fills the panel, and its row marked .drawer-actions stays pinned
       to the bottom edge, however short or long the form is. */
    .body ::ng-deep > form { display: flex; flex-direction: column; min-height: 100%; }
    .body ::ng-deep .drawer-actions {
      position: sticky; bottom: 0; z-index: 1; display: flex; justify-content: flex-start; gap: 8px; margin: auto -24px 0; padding: 16px 24px 20px;
      background: var(--ground); border-top: 1px solid var(--surface-2);
    }
  `,
})
export class Drawer {
  protected readonly I = I;
  protected readonly titleId = `drawer-title-${++uid}`;
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly closed = output<void>();
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const d = this.dlg().nativeElement;
      if (typeof d.showModal !== 'function') return; // server render
      if (this.open() && !d.open) {
        d.showModal();
        // projected content renders in this same pass, after showModal, so honour autofocus by hand
        queueMicrotask(() => d.querySelector<HTMLElement>('[autofocus]')?.focus());
      } else if (!this.open() && d.open) d.close();
    });
  }

  /**
   * Esc, the backdrop and the close button all come here. The parent hears first and
   * clears its state, which drops [open] and closes the dialog. Chromium doesn't
   * reliably fire 'close' after an Esc 'cancel', so nothing waits on that event.
   */
  protected dismiss(): void {
    this.closed.emit();
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dismiss();
  }
}
