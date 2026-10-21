import { test as base, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The real catalog, for picking routes and building edge-case variants. */
export const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public/data/catalog.json'), 'utf8')) as {
  categories: { id: string; slug: string; name: string; description: string; image: string | null; count: number }[];
  products: {
    id: string; slug: string; name: string; description: string; price: number; compareAtPrice: number | null;
    images: string[]; zoom?: string[]; categoryId: string; brand: string | null; occasions: string[]; cities: string[]; inStock: boolean;
  }[];
};
export const policies = JSON.parse(readFileSync(join(process.cwd(), 'public/data/policies.json'), 'utf8')) as { slug: string; title: string }[];

export const OCCASIONS = ['birthday', 'eid', 'love', 'new-baby', 'kids', 'thank-you', 'pinktober', 'teachers-day'];

interface Problems {
  console: string[];
  failed: string[];
}

/**
 * Every test gets a page that records console errors, uncaught exceptions
 * and failed same-origin requests. The cookie notice and chat badge are
 * pre-answered so they don't cover what's being tested (they have their own
 * tests, which opt out with `fresh`).
 */
export const test = base.extend<{ problems: Problems; fresh: boolean }>({
  fresh: [false, { option: true }],
  problems: async ({ page, fresh }, use) => {
    const problems: Problems = { console: [], failed: [] };
    page.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.console.push(m.text());
    });
    page.on('pageerror', (e) => problems.console.push(`Uncaught: ${e.message}`));
    page.on('requestfailed', (r) => {
      if (r.url().startsWith('http://localhost') && !r.url().includes('/@')) problems.failed.push(`${r.failure()?.errorText} ${r.url()}`);
    });
    page.on('response', (r) => {
      if (r.url().startsWith('http://localhost') && r.status() >= 400) problems.failed.push(`${r.status()} ${r.url()}`);
    });
    if (!fresh) {
      await page.addInitScript(() => {
        localStorage.setItem('gw-cookie-consent', 'essential');
        localStorage.setItem('gw-wa-seen', '1');
      });
    }
    await use(problems);
  },
});

export { expect };

/** Load a route and wait until the catalog has rendered something. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('main h1').first().waitFor();
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

/** Scroll the whole page so lazy images load, then come back up. */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}

/** Elements wider than the viewport that aren't inside a scroll container. */
export async function overflowingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= cw + 1) continue;
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (s.overflowX !== 'visible' || s.position === 'fixed') {
          clipped = true;
          break;
        }
        p = p.parentElement;
      }
      if (!clipped && getComputedStyle(el).position !== 'fixed') out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} → ${Math.round(r.right)}px`);
    }
    return out.slice(0, 10);
  });
}

/** Images that finished loading but have no pixels (the broken-image icon). */
export async function brokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.images]
      .filter((i) => i.complete && i.naturalWidth === 0 && !!i.getAttribute('src'))
      .map((i) => i.currentSrc || i.src),
  );
}
