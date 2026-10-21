import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

/**
 * Broken links: every URL in sitemap.xml must open a real page (not the 404
 * page), and every internal link on the main pages must go somewhere real.
 */
const xml = readFileSync(join(process.cwd(), 'public/sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => !p.startsWith('/images/'));

test.describe('sitemap.xml', () => {
  test.skip(({ isMobile }) => isMobile, 'links are the same on every screen size');

  // batches keep the run parallel without opening 248 browser pages
  const BATCH = 25;
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    test(`urls ${i + 1}–${i + batch.length} all open`, async ({ page }) => {
      test.setTimeout(120_000);
      const bad: string[] = [];
      for (const path of batch) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const h1 = (await page.locator('h1').first().textContent({ timeout: 8000 }).catch(() => null)) ?? '';
        if (!h1.trim() || /couldn't find/i.test(h1)) bad.push(`${path} → "${h1.trim()}"`);
      }
      expect(bad).toEqual([]);
    });
  }
});

test('every internal link on the main pages resolves', async ({ page, isMobile }) => {
  test.skip(isMobile, 'links are the same on every screen size');
  test.setTimeout(300_000);
  const seen = new Set<string>();
  for (const start of ['/', '/shop', '/contact', '/sitemap', '/build-a-basket']) {
    await page.goto(start);
    await page.waitForLoadState('networkidle');
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
        .map((a) => a.getAttribute('href')!)
        .filter((h) => h && !/^(https?:|mailto:|tel:|#)/.test(h)),
    );
    hrefs.forEach((h) => seen.add(new URL(h, 'http://x/').pathname));
  }
  const bad: string[] = [];
  for (const path of seen) {
    if (path.endsWith('.xml')) {
      const res = await page.request.get(path);
      if (!res.ok()) bad.push(`${path} → ${res.status()}`);
      continue;
    }
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const h1 = (await page.locator('h1').first().textContent({ timeout: 10_000 }).catch(() => '')) ?? '';
    if (/couldn't find/i.test(h1)) bad.push(path);
  }
  expect(bad, `${seen.size} links checked`).toEqual([]);
});
