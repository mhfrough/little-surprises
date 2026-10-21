#!/usr/bin/env node
/**
 * Serves the prerendered build the way Netlify does: the real file, then
 * dir/index.html, then the client-only shell (index.csr.html) with a 200.
 * Use it to check a build before dropping it on Netlify.
 *
 *   npm run build && npm run serve:dist     (http://localhost:4400)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = new URL('../dist/little-things-gift-baskets/browser/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const port = Number(process.env.PORT || 4400);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg)/;
const isFile = async (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  for (const file of [join(root, path), join(root, path, 'index.html'), join(root, 'index.csr.html')]) {
    if (!(await isFile(file))) continue;
    const type = TYPES[extname(file)] ?? 'application/octet-stream';
    let body = await readFile(file);
    const headers = { 'content-type': type, 'cache-control': /-[A-Z0-9]{8}\.(js|css)$/.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache' };
    if (COMPRESSIBLE.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) {
      body = gzipSync(body);
      headers['content-encoding'] = 'gzip';
    }
    res.writeHead(200, headers).end(body);
    return;
  }
  res.writeHead(404).end();
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
