#!/usr/bin/env node
/**
 * Builds public/data/catalog.json from two public storefronts:
 *   - Giftwifts (WooCommerce Store API, no auth)
 *   - Belco Chocolates (Indolj StructuredMenu, needs the anonymous visitor token
 *     the site puts in localStorage.authToken; pass it as BELCO_TOKEN, or pass a
 *     saved menu response with --belco-file <path>)
 *
 * The output shape mirrors the tables the NestJS + PostgreSQL backend will
 * have (categories, products), so it can be used as seed data later.
 *
 *   BELCO_TOKEN=... node scripts/import-catalog.mjs
 *   node scripts/import-catalog.mjs --belco-file ./belco-menu.json
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../public/data/catalog.json', import.meta.url);
const GW = 'https://giftwifts.leopardscourier.com/wp-json/wc/store/v1';
const BELCO_MENU = 'https://console.indolj.io/mobileapp/WebApiV2/StructuredMenu?domain=belcochocolates.com&json=1&api_version=0.8.9';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

// Our categories, in shop order.
const CATEGORIES = [
  { id: 'hampers', name: 'Gift hampers', description: 'Curated baskets and boxes, wrapped and ready.' },
  { id: 'chocolates', name: 'Chocolates', description: 'Belgian bars, boxes and kunafa chocolate.' },
  { id: 'cakes', name: 'Cakes', description: 'Celebration cakes from Karachi bakeries.' },
  { id: 'flowers', name: 'Flowers', description: 'Fresh and silk bouquets.' },
  { id: 'mithai', name: 'Mithai & sweets', description: 'Traditional mithai boxes for every occasion.' },
  { id: 'perfumes', name: 'Perfumes', description: 'Fragrances for him and her.' },
  { id: 'toys', name: 'Toys', description: 'Soft toys and gifts for children.' },
  { id: 'corporate', name: 'Corporate', description: 'Gifts for clients and teams.' },
];

// Source collection -> our category, plus occasions it implies. null = not a gift, skip.
const BELCO_MAP = {
  'CHOCOLATE BAR': { cat: 'chocolates' },
  'CHOCOLATE BOX': { cat: 'chocolates' },
  'KUNAFA COLLECTION': { cat: 'chocolates' },
  'SUGAR FREE COLLECTION': { cat: 'chocolates', tags: ['sugar-free'] },
  'GIFT BASKET': { cat: 'hampers' },
  'GIFT HAMPERS': { cat: 'hampers' },
  'FESTIVE COLLECTION': { cat: 'hampers', occasions: ['eid'] },
  'TEACHER GIFT COLLECTION': { cat: 'hampers', occasions: ['teachers-day'] },
  'BABY ANNOUNCEMENT': { cat: 'chocolates', occasions: ['new-baby'] },
  Pinktober: { cat: 'chocolates', occasions: ['pinktober'] },
  'GIFTS UNDER 3K': { cat: null }, // a price filter, not a collection; items also live elsewhere
  'SHOP BY CATEGORY': null,
  'SHOP BY OCCASION': null,
  'COFFEE BAR': null,
  GELATO: null,
  DESSERTS: null,
};

const GW_MAP = {
  chocolates: { cat: 'chocolates' },
  'aims-chocolate': { cat: 'chocolates', brand: 'AIMS' },
  cakes: { cat: 'cakes', occasions: ['birthday'] },
  hobnob: { cat: 'cakes', brand: 'Hobnob', occasions: ['birthday'] },
  'the-luscious-palace': { cat: 'cakes', brand: 'The Luscious Palace', occasions: ['birthday'] },
  flowers: { cat: 'flowers' },
  'silk-flowers-bouquet': { cat: 'flowers' },
  'mithai-2026': { cat: 'mithai', occasions: ['eid'] },
  sweets: { cat: 'mithai' },
  perfumes: { cat: 'perfumes' },
  toys: { cat: 'toys', occasions: ['kids'] },
  corporate: { cat: 'corporate', occasions: ['corporate'] },
};

const args = process.argv.slice(2);
const argVal = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const stripHtml = (s = '') =>
  s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, '’').replace(/\s+/g, ' ').trim();
const titleCase = (s) =>
  s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const n = i++;
        out[n] = await fn(items[n], n);
      }
    }),
  );
  return out;
}

// ---------------------------------------------------------------- Giftwifts
async function giftwifts() {
  const raw = [];
  for (let page = 1; ; page++) {
    const batch = await getJson(`${GW}/products?per_page=100&page=${page}`);
    raw.push(...batch);
    if (batch.length < 100) break;
  }

  const kept = raw.filter((p) => p.categories.some((c) => GW_MAP[c.slug]));

  // Price differs by delivery city; read the Karachi variation's price.
  const karachiPrice = await pool(kept, 4, async (p) => {
    const v = (p.variations ?? []).find((v) => v.attributes?.some((a) => /karachi/i.test(a.value)));
    if (!v) return null;
    try {
      const full = await getJson(`${GW}/products/${v.id}`);
      return { price: +full.prices.price, regular: +full.prices.regular_price };
    } catch {
      return null;
    }
  });

  return kept.map((p, n) => {
    const maps = p.categories.map((c) => GW_MAP[c.slug]).filter(Boolean);
    const cities = p.attributes
      .filter((a) => /deliver/i.test(a.name))
      .flatMap((a) => a.terms.map((t) => t.name.toLowerCase()));
    const kp = karachiPrice[n];
    const price = kp?.price || +p.prices.price;
    const regular = kp?.regular || +p.prices.regular_price;
    // A single "any city" variation means the listed price is the Karachi price too.
    const anyCity = (p.variations ?? []).every((v) => v.attributes?.every((a) => a.value == null));
    return {
      sourceId: `gw-${p.id}`,
      source: 'giftwifts',
      sourceUrl: p.permalink,
      name: titleCase(stripHtml(p.name)),
      description: stripHtml(p.short_description || p.description),
      price,
      compareAtPrice: regular > price ? regular : null,
      images: p.images.map((i) => i.src),
      categoryId: maps[0].cat,
      brand: maps.find((m) => m.brand)?.brand ?? null,
      occasions: [...new Set(maps.flatMap((m) => m.occasions ?? []))],
      tags: [],
      cities,
      karachiPrice: Boolean(kp) || anyCity,
      inStock: p.is_in_stock && p.is_purchasable,
    };
  });
}

function safeJson(s) {
  try {
    return typeof s === 'string' && s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}


// ------------------------------------------------------------------- Belco
async function belco() {
  const file = argVal('--belco-file');
  let menu;
  if (file) menu = JSON.parse(await readFile(file, 'utf8'));
  else if (process.env.BELCO_TOKEN) menu = await getJson(BELCO_MENU, { Authorization: `Bearer ${process.env.BELCO_TOKEN}` });
  else {
    console.warn('! Belco skipped: set BELCO_TOKEN or pass --belco-file');
    return [];
  }

  const byId = new Map();
  for (const cat of Object.values(menu.details)) {
    const map = BELCO_MAP[cat.title];
    if (map === undefined) console.warn(`  unmapped Belco collection: ${cat.title}`);
    if (!map) continue;
    for (const it of Object.values(cat.items ?? {})) {
      const prev = byId.get(it.item_id);
      if (prev) {
        if (map.cat && prev.categoryId === null) prev.categoryId = map.cat;
        prev.occasions = [...new Set([...prev.occasions, ...(map.occasions ?? [])])];
        prev.tags = [...new Set([...prev.tags, ...(map.tags ?? [])])];
        continue;
      }
      const price = it.prices?.[0]?.price ?? 0;
      const discount = +it.discount || 0;
      byId.set(it.item_id, {
        sourceId: `belco-${it.item_id}`,
        source: 'belco',
        sourceUrl: `https://belcochocolates.com/product/${it.item_slug}`,
        name: titleCase(it.item_name),
        description: stripHtml(it.item_description),
        price: discount ? price - discount : price,
        compareAtPrice: discount ? price : null,
        // main photo, then any per-size photos Belco keeps (often an older studio shot)
        images: [
          ...new Set([
            it.photo,
            ...Object.values(safeJson(it.size_photo) ?? {}).map((f) => `${it.image_path}${f}`),
          ].map((u) => encodeURI(decodeURI(String(u).replace(/\?.*$/, ''))))),
        ].slice(0, 4),
        categoryId: map.cat,
        brand: 'Belco',
        occasions: map.occasions ?? [],
        tags: map.tags ?? [],
        cities: ['karachi'],
        karachiPrice: true,
        inStock: it.not_available !== '2',
      });
    }
  }
  // Items only found under "Gifts under 3K" fall back to chocolates.
  return [...byId.values()].map((p) => ({ ...p, categoryId: p.categoryId ?? 'chocolates' }));
}

// -------------------------------------------------------------------- main
const [gw, bc] = await Promise.all([giftwifts(), belco()]);
const all = [...bc, ...gw].filter((p) => p.price > 0 && p.images.length);

const seen = new Set();
const products = all.map((p) => {
  let slug = slugify(p.name);
  if (seen.has(slug)) slug = `${slug}-${p.source}`;
  let n = 2;
  while (seen.has(slug)) slug = `${slugify(p.name)}-${n++}`;
  seen.add(slug);
  return { id: slug, slug, ...p };
});

// Source images are up to ~1.2 MB with no resizing CDN, so each real photo is
// kept twice as WebP: 640px for pages (`images`) and 1600px for the lightbox
// (`zoom`); build-thumbs.mjs adds a 400px copy of the 640px one for small cards. Products with one photo also get a close-up crop of it, so the
// gallery has a detail view. `sourceImages` keeps the originals for the backend.
if (!args.includes('--no-images')) {
  const sharp = (await import('sharp')).default;
  sharp.cache(false);
  const IMG_DIR = new URL('../public/images/catalog/', import.meta.url);
  const fsPath = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, '$1');
  await mkdir(IMG_DIR, { recursive: true });
  const exists = (u) => access(u).then(() => true, () => false);
  const fetchBuf = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(String(res.status));
    return Buffer.from(await res.arrayBuffer());
  };
  const save = async (img, name) => {
    const sm = new URL(`${name}.webp`, IMG_DIR);
    const lg = new URL(`${name}-lg.webp`, IMG_DIR);
    if (!(await exists(sm))) await img.clone().resize(640, 640, { fit: 'cover' }).webp({ quality: 78 }).toFile(fsPath(sm));
    if (!(await exists(lg))) await img.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(fsPath(lg));
    return { sm: `images/catalog/${name}.webp`, lg: `images/catalog/${name}-lg.webp` };
  };

  let done = 0;
  await pool(products, 5, async (p) => {
    p.sourceImages = p.images;
    const out = [];
    for (const [n, src] of p.images.entries()) {
      const name = `${p.slug}-${n + 1}`;
      try {
        const cached = (await exists(new URL(`${name}.webp`, IMG_DIR))) && (await exists(new URL(`${name}-lg.webp`, IMG_DIR)));
        out.push(cached ? { sm: `images/catalog/${name}.webp`, lg: `images/catalog/${name}-lg.webp` } : await save(sharp(await fetchBuf(src)).rotate(), name));
      } catch (e) {
        console.warn(`  image ${n + 1} failed for ${p.slug}: ${e.message}`);
      }
    }
    if (out.length === 1) {
      // close-up: the middle 62% of the main photo
      const name = `${p.slug}-detail`;
      const lgFile = new URL(`${p.slug}-1-lg.webp`, IMG_DIR);
      try {
        const base = sharp(fsPath(lgFile));
        const { width = 0, height = 0 } = await base.metadata();
        const w = Math.round(width * 0.62), h = Math.round(height * 0.62);
        out.push(await save(sharp(fsPath(lgFile)).extract({ left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h }), name));
      } catch (e) {
        console.warn(`  detail crop failed for ${p.slug}: ${e.message}`);
      }
    }
    p.images = out.map((o) => o.sm);
    p.zoom = out.map((o) => o.lg);
    if (++done % 25 === 0) console.log(`  images ${done}/${products.length}`);
  });
}

const categories = CATEGORIES.map((c) => {
  const items = products.filter((p) => p.categoryId === c.id);
  return { ...c, slug: c.id, count: items.length, image: items[0]?.images[0] ?? null };
}).filter((c) => c.count);

await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), currency: 'PKR', defaultCity: 'karachi', categories, products }, null, 1),
);

console.log(`✓ ${products.length} products (${bc.length} Belco, ${gw.length} Giftwifts) in ${categories.length} categories`);
for (const c of categories) console.log(`  ${c.name.padEnd(18)} ${c.count}`);
console.log(`  Karachi delivery: ${products.filter((p) => p.cities.includes('karachi')).length}`);
