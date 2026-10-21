import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';
const KEY = 'gw-theme';

/**
 * Light, dark, or follow the device. Stored on this device; index.html reads
 * the same key before first paint so there's no flash of the wrong theme.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<Theme>(read());

  constructor() {
    effect(() => {
      const t = this.theme();
      const root = this.doc.documentElement;
      if (t === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', t);
      try {
        if (t === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, t);
      } catch {
        /* storage blocked — the choice lasts this visit */
      }
    });
  }

  set(t: Theme): void {
    this.theme.set(t);
  }
}

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}
