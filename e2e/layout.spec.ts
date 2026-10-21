import { catalog, expect, open, overflowingElements, test } from './fixtures';

/**
 * Layout regressions found by eye: words split inside menu links, inputs of
 * different heights side by side, boxes stretched taller than their content.
 * Checked at the widths where the header gets crowded.
 */
const WIDTHS = [1920, 1440, 1366, 1280, 1180, 1024, 768, 390];

/** Short labels (menus, buttons, chips) must sit on one line: no "Hamper s". */
async function splitLabels(page: import('@playwright/test').Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (el.offsetParent === null) continue;
      const text = el.textContent?.trim() ?? '';
      if (!text || text.length > 24) continue;
      const range = document.createRange();
      range.selectNodeContents(el);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      if (lines.size > 1) out.push(`"${text}" on ${lines.size} lines`);
    }
    return out;
  }, selector);
}

test.describe('header at every width', () => {
  test.skip(({ isMobile }) => isMobile, 'widths are set explicitly');
  for (const width of WIDTHS) {
    test(`${width}px: menu links on one line, header fits`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/');
      expect(await splitLabels(page, 'header .links a, header .btn, header .city, .announce .msg')).toEqual([]);
      const header = await page.locator('header.bar .inner').evaluate((el) => ({ h: el.getBoundingClientRect().height, sw: el.scrollWidth, cw: el.clientWidth }));
      expect(header.h, 'header stays one row').toBeLessThanOrEqual(72);
      expect(header.sw, 'nothing pushed out of the header').toBeLessThanOrEqual(header.cw + 1);
      expect(await overflowingElements(page)).toEqual([]);
    });
  }
});

test('buttons, chips and footer links never split a word', async ({ page }) => {
  for (const path of ['/', '/shop', '/build-a-basket', '/contact', `/product/${catalog.products[0].slug}`]) {
    await open(page, path);
    expect(await splitLabels(page, 'main .btn, main .chip, main .segmented button, footer .col a, footer .pay li, footer .links a'), path).toEqual([]);
  }
});

test('inputs side by side are the same height', async ({ page }) => {
  await open(page, `/product/${catalog.products.find((p) => p.inStock)!.slug}`);
  await page.getByRole('button', { name: /Add to bag/ }).click();
  for (const path of ['/cart', '/contact']) {
    await open(page, path);
    const rows = await page.locator('.two').evaluateAll((els) =>
      els.map((row) => [...row.querySelectorAll<HTMLElement>('.input')].map((i) => Math.round(i.getBoundingClientRect().height))),
    );
    for (const heights of rows) if (heights.length > 1) expect(new Set(heights).size, `${path}: ${heights.join(' vs ')}`).toBe(1);
  }
});

test('footer boxes are as tall as their content', async ({ page }) => {
  await open(page, '/');
  const news = await page.locator('footer .news').evaluate((el) => {
    const last = el.lastElementChild!.getBoundingClientRect().bottom;
    return Math.round(el.getBoundingClientRect().bottom - last);
  });
  expect(news, 'empty space under the sign-up form').toBeLessThanOrEqual(32);
});
