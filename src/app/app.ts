import { Component, inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ImageFallback } from './core/image-fallback';
import { ThemeService } from './core/theme.service';
import { CookieConsent } from './layout/cookie-consent';
import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';
import { Toast } from './layout/toast';
import { WhatsappBubble } from './layout/whatsapp-bubble';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, Toast, WhatsappBubble, CookieConsent],
  template: `
    @if (isAdmin()) {
      <!-- the operator portal brings its own frame -->
      <router-outlet />
    } @else {
      <a class="skip-link" href="#main">Skip to content</a>
      <app-site-header />
      <router-outlet />
      <app-site-footer />
      <app-whatsapp-bubble />
      <app-cookie-consent />
    }
    <app-toast />
  `,
})
export class App {
  private readonly router = inject(Router);
  protected readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.startsWith('/admin')),
    ),
    { initialValue: inject(PlatformLocation).pathname.startsWith('/admin') },
  );

  constructor() {
    inject(ImageFallback).start();
    inject(ThemeService); // applies the saved light/dark choice
  }
}
