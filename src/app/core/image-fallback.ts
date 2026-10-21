import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export const PLACEHOLDER = 'brand/placeholder.svg';

/**
 * One listener for the whole app: any <img> that fails to load (a removed
 * product photo, a CDN hiccup) swaps to the brand placeholder instead of the
 * browser's broken-image icon. Image errors don't bubble, so it listens in
 * the capture phase.
 */
@Injectable({ providedIn: 'root' })
export class ImageFallback {
  private readonly doc = inject(DOCUMENT);

  start(): void {
    this.doc.addEventListener(
      'error',
      (e) => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement) || img.dataset['broken']) return;
        img.dataset['broken'] = 'true';
        img.removeAttribute('srcset');
        img.src = PLACEHOLDER;
        if (!img.alt) img.alt = '';
      },
      true,
    );
  }
}
