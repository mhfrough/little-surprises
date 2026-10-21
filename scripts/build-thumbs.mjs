#!/usr/bin/env node
/**
 * Writes a 400px "-xs" copy of every 640px catalog photo, for cards that show
 * them small (phones, category chips, the bag). Skips ones already made, so it
 * is cheap to run before every build (npm "prebuild").
 */
import { access, readdir } from 'node:fs/promises';
import sharp from 'sharp';

const DIR = new URL('../public/images/catalog/', import.meta.url);
const fsPath = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, '$1');
const exists = (u) => access(u).then(() => true, () => false);

sharp.cache(false);
const sources = (await readdir(DIR)).filter((f) => f.endsWith('.webp') && !/-(lg|xs)\.webp$/.test(f));
let made = 0;
for (const f of sources) {
  const out = new URL(f.replace(/\.webp$/, '-xs.webp'), DIR);
  if (await exists(out)) continue;
  await sharp(fsPath(new URL(f, DIR))).resize(400, 400, { fit: 'cover' }).webp({ quality: 74 }).toFile(fsPath(out));
  made++;
}
console.log(`✓ thumbnails: ${made} made, ${sources.length - made} already there`);
