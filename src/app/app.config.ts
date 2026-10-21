import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(
      withEventReplay(),
      // Prerendered pages carry the catalog so they boot without a refetch; the
      // 600 kB reviews file would bloat every page, so the browser fetches it.
      withHttpTransferCacheOptions({ filter: (req) => !req.url.endsWith('data/reviews.json') }),
    ),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      // pages cross-fade where the browser supports it (styles/_motion.scss)
      withViewTransitions({ skipInitialTransition: true }),
    ),
  ],
};
