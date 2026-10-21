#!/usr/bin/env node
/**
 * Writes public/sitemap.xml and public/robots.txt from the same data the
 * site reads: public/data/catalog.json and public/data/policies.json.
 * Runs before every build (npm "prebuild") and after import-catalog.
 *
 *   SITE_URL=https://littlesurprises.pk node scripts/build-sitemap.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';

const SITE = (process.env.SITE_URL || 'https://littlesurprises.pk').replace(/\/$/, '');
const pub = (p) => new URL(`../public/${p}`, import.meta.url);

const catalog = JSON.parse(await readFile(pub('data/catalog.json'), 'utf8'));
const policies = JSON.parse(await readFile(pub('data/policies.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const catalogDate = catalog.generatedAt.slice(0, 10);

// Keep in step with OCCASION_DEFS in src/app/core/catalog.ts.
const OCCASION_SLUGS = ['birthday', 'eid', 'love', 'new-baby', 'kids', 'thank-you', 'pinktober', 'teachers-day'];
const occasionHasItems = (slug) => {
  if (slug === 'love') return catalog.products.some((p) => p.categoryId === 'flowers');
  if (slug === 'thank-you') return catalog.products.some((p) => p.categoryId === 'hampers');
  return catalog.products.some((p) => p.occasions.includes(slug));
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => (/^https?:/.test(path) ? path : `${SITE}/${path.replace(/^\//, '')}`);

/** @type {{ loc: string, lastmod: string, changefreq: string, priority: number, images?: { loc: string, title: string }[] }[]} */
const urls = [
  { loc: '/', lastmod: catalogDate, changefreq: 'daily', priority: 1.0 },
  { loc: '/shop', lastmod: catalogDate, changefreq: 'daily', priority: 0.9 },
  { loc: '/build-a-basket', lastmod: today, changefreq: 'weekly', priority: 0.9 },
  { loc: '/contact', lastmod: today, changefreq: 'monthly', priority: 0.5 },
  { loc: '/reviews', lastmod: today, changefreq: 'daily', priority: 0.6 },
  { loc: '/sitemap', lastmod: catalogDate, changefreq: 'weekly', priority: 0.2 },
  ...catalog.categories.map((c) => ({ loc: `/category/${c.slug}`, lastmod: catalogDate, changefreq: 'daily', priority: 0.8 })),
  ...OCCASION_SLUGS.filter(occasionHasItems).map((s) => ({ loc: `/occasion/${s}`, lastmod: catalogDate, changefreq: 'weekly', priority: 0.7 })),
  ...catalog.products.map((p) => ({
    loc: `/product/${p.slug}`,
    lastmod: catalogDate,
    changefreq: 'weekly',
    priority: p.inStock ? 0.7 : 0.3,
    images: p.images.map((src) => ({ loc: abs(src), title: p.name })),
  })),
  ...policies.map((p) => ({ loc: `/policies/${p.slug}`, lastmod: p.updated, changefreq: 'yearly', priority: 0.3 })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...urls.map((u) =>
    [
      '  <url>',
      `    <loc>${esc(abs(u.loc))}</loc>`,
      `    <lastmod>${u.lastmod}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority.toFixed(1)}</priority>`,
      ...(u.images ?? []).map((i) => `    <image:image><image:loc>${esc(i.loc)}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`),
      '  </url>',
    ].join('\n'),
  ),
  '</urlset>',
  '',
].join('\n');

await writeFile(pub('sitemap.xml'), xml);
await writeFile(pub('robots.txt'), `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /design\nDisallow: /admin\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`✓ sitemap.xml: ${urls.length} URLs for ${SITE}`);
