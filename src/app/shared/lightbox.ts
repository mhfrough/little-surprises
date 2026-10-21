import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I } from './icons';

/**
 * Full-screen image viewer: arrows, keys (← → Esc), swipe, click to zoom,
 * and a thumbnail strip along the bottom. Locks page scroll and returns focus
 * to whatever opened it.
 */
@Component({
  selector: 'app-lightbox',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': "title() + ' — pictures'",
    '(keydown.escape)': 'close()',
    '(keydown.arrowLeft)': 'go(-1)',
    '(keydown.arrowRight)': 'go(1)',
    '(keydown.tab)': 'trap($event)',
    '(keydown.shift.tab)': 'trap($event)',
  },
  template: `
    <div class="top">
      <p class="title">{{ title() }}</p>
      @if (images().length > 1) {
        <p class="count t-num" aria-live="polite">{{ index() + 1 }} / {{ images().length }}</p>
      }
      <button #closeBtn type="button" class="icon" (click)="close()" aria-label="Close pictures">
        <lucide-icon [img]="I.X" [size]="24" [strokeWidth]="2" />
      </button>
    </div>

    <div class="stage" (click)="onStage($event)" (pointerdown)="down($event)" (pointerup)="up($event)">
      <img [src]="images()[index()]" [alt]="title() + ', picture ' + (index() + 1)" [class.zoomed]="zoomed()"
        [style.transform-origin]="origin()" (click)="toggleZoom($event)" draggable="false" />
      @if (images().length > 1) {
        <button type="button" class="nav prev" (click)="go(-1); $event.stopPropagation()" aria-label="Previous picture">
          <lucide-icon [img]="I.ChevronLeft" [size]="28" [strokeWidth]="2" />
        </button>
        <button type="button" class="nav next" (click)="go(1); $event.stopPropagation()" aria-label="Next picture">
          <lucide-icon [img]="I.ChevronRight" [size]="28" [strokeWidth]="2" />
        </button>
      }
    </div>

    @if (thumbs().length > 1) {
      <div class="strip" role="group" aria-label="All pictures">
        @for (t of thumbs(); track t; let i = $index) {
          <button type="button" [attr.aria-pressed]="i === index()" [attr.aria-label]="'Picture ' + (i + 1)" (click)="select(i)">
            <img [src]="t" alt="" width="72" height="72" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed; inset: 0; z-index: 100;
      display: grid; grid-template-rows: auto 1fr auto;
      background: rgb(12 6 9 / 0.96); color: #fff;
      animation: lb-in 200ms var(--ease-out);
    }
    @keyframes lb-in { from { opacity: 0; } }
    .top { display: flex; align-items: center; gap: 16px; padding: 12px 12px 12px 24px; }
    .title { flex: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .count { font-size: var(--text-small); opacity: 0.75; }
    .icon, .nav {
      display: grid; place-items: center; border-radius: 50%; color: #fff;
      background: rgb(255 255 255 / 0.12); transition: background-color var(--dur-fast);
    }
    .icon { width: 44px; height: 44px; }
    .icon:hover, .nav:hover { background: rgb(255 255 255 / 0.24); }
    .stage { position: relative; display: grid; place-items: center; min-height: 0; overflow: hidden; touch-action: pan-y; padding: 0 72px; }
    .stage img {
      max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in; user-select: none;
      transition: transform 300ms var(--ease-out); animation: img-in 260ms var(--ease-out);
    }
    .stage img.zoomed { transform: scale(2.2); cursor: zoom-out; }
    @keyframes img-in { from { opacity: 0; transform: scale(0.98); } }
    .nav { position: absolute; top: 50%; width: 52px; height: 52px; margin-top: -26px; }
    .prev { left: 12px; }
    .next { right: 12px; }
    .strip { display: flex; justify-content: center; gap: 8px; padding: 12px 16px 20px; overflow-x: auto; scrollbar-width: none; }
    .strip button { flex: none; width: 64px; height: 64px; border-radius: 10px; overflow: hidden; opacity: 0.55; box-shadow: 0 0 0 2px transparent; transition: opacity var(--dur-fast); }
    .strip button:hover { opacity: 0.85; }
    .strip button[aria-pressed='true'] { opacity: 1; box-shadow: 0 0 0 2px #fff; }
    .strip img { width: 100%; height: 100%; object-fit: cover; }
    @media (max-width: 640px) {
      .stage { padding: 0 8px; }
      .nav { width: 44px; height: 44px; margin-top: -22px; background: rgb(0 0 0 / 0.4); }
      .prev { left: 6px; }
      .next { right: 6px; }
    }
  `,
})
export class Lightbox implements OnInit, OnDestroy {
  protected readonly I = I;
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly closeBtn = viewChild.required<ElementRef<HTMLButtonElement>>('closeBtn');

  /** large pictures shown on the stage */
  readonly images = input.required<string[]>();
  /** small pictures for the strip; falls back to the large ones */
  readonly thumbnails = input<string[]>([]);
  readonly title = input('');
  readonly index = model(0);
  readonly closed = output<void>();

  protected readonly thumbs = computed(() => (this.thumbnails().length ? this.thumbnails() : this.images()));
  protected readonly zoomed = signal(false);
  protected readonly origin = signal('50% 50%');
  private opener: Element | null = null;
  private startX = 0;
  private prevOverflow = '';

  ngOnInit(): void {
    this.opener = this.doc.activeElement;
    this.prevOverflow = this.doc.body.style.overflow;
    this.doc.body.style.overflow = 'hidden';
    queueMicrotask(() => this.closeBtn().nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.doc.body.style.overflow = this.prevOverflow;
    (this.opener as HTMLElement | null)?.focus?.();
  }

  close(): void {
    this.closed.emit();
  }

  go(dir: number): void {
    const n = this.images().length;
    if (n > 1) this.select((this.index() + dir + n) % n);
  }

  select(i: number): void {
    this.zoomed.set(false);
    this.index.set(i);
  }

  toggleZoom(e: MouseEvent): void {
    e.stopPropagation();
    const img = e.target as HTMLElement;
    const r = img.getBoundingClientRect();
    this.origin.set(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
    this.zoomed.update((z) => !z);
  }

  /** a click on the dark area around the picture closes the viewer */
  onStage(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  down(e: PointerEvent): void {
    this.startX = e.clientX;
  }

  up(e: PointerEvent): void {
    const dx = e.clientX - this.startX;
    if (!this.zoomed() && Math.abs(dx) > 50 && e.pointerType !== 'mouse') this.go(dx < 0 ? 1 : -1);
  }

  /** keep Tab inside the dialog */
  trap(e: Event): void {
    const ke = e as KeyboardEvent;
    const items = [...(this.host.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('button')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (ke.shiftKey && this.doc.activeElement === first) {
      ke.preventDefault();
      last.focus();
    } else if (!ke.shiftKey && this.doc.activeElement === last) {
      ke.preventDefault();
      first.focus();
    }
  }
}
