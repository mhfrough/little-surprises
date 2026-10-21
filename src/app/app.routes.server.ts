import { RenderMode, ServerRoute } from '@angular/ssr';

import catalog from '../../public/data/catalog.json';
import policies from '../../public/data/policies.json';
import { OCCASION_DEFS } from './core/catalog';

/**
 * Build-time render modes. Public pages are prerendered to static HTML (one
 * file per slug, from the same JSON the app reads); pages that only make sense
 * with the visitor's own browser state stay client-rendered.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'category/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => catalog.categories.map((c) => ({ slug: c.slug })),
  },
  {
    path: 'occasion/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      OCCASION_DEFS.filter((o) => catalog.products.some((p) => o.match(p))).map((o) => ({ slug: o.id })),
  },
  {
    path: 'product/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => catalog.products.map((p) => ({ slug: p.slug })),
  },
  {
    path: 'policies/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => policies.map((p) => ({ slug: p.slug })),
  },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'design', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
