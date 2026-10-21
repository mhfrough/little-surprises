#!/usr/bin/env node
/**
 * Self-hosts the stock photographs the site shows outside the catalog (hero,
 * sections, builder bases, about, credits) as WebP, in the widths img() in
 * src/app/core/catalog.ts asks for. Ids are read from the source: every
 * `id: '…'` in photos.ts and every Unsplash-style id passed to photo()/img().
 * Each photo is downloaded once; files already there are skipped, so it is
 * cheap to run before every build (npm "prebuild").
 *
 *   node scripts/build-site-photos.mjs
 */
import { access, mkdir, readFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';

// Keep in step with SITE_WIDTHS in src/app/core/catalog.ts.
const WIDTHS = [640, 960, 1600, 2400];
const OUT = new URL('../public/images/site/', import.meta.url);
const SRC = new URL('../src/app/', import.meta.url);
const fsPath = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, '$1');
const exists = (u) => access(u).then(() => true, () => false);

async function sourceFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
    if (e.isDirectory()) out.push(...(await sourceFiles(u)));
    else if (e.name.endsWith('.ts')) out.push(u);
  }
  return out;
}

const ids = new Set();
for (const f of await sourceFiles(SRC)) {
  const text = await readFile(f, 'utf8');
  for (const m of text.matchAll(/'(\d{10,13}-[0-9a-f]{12})'/g)) ids.add(m[1]); // Unsplash
  if (f.pathname.endsWith('/core/photos.ts')) for (const m of text.matchAll(/id: '(\d{5,9})'/g)) ids.add(m[1]); // Pexels
}

const remote = (id) =>
  /^\d+$/.test(id)
    ? `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=2400`
    : `https://images.unsplash.com/photo-${id}?w=2400&q=90&fm=jpg`;

await mkdir(OUT, { recursive: true });
sharp.cache(false);
let made = 0;
for (const id of ids) {
  const files = WIDTHS.map((w) => new URL(`${id}-${w}.webp`, OUT));
  if ((await Promise.all(files.map(exists))).every(Boolean)) continue;
  const res = await fetch(remote(id));
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  for (const [i, w] of WIDTHS.entries()) {
    await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: w > 1000 ? 74 : 78 }).toFile(fsPath(files[i]));
  }
  made++;
}
console.log(`✓ site photos: ${ids.size} photos, ${made} downloaded and converted`);
