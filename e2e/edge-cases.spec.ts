import { Page } from '@playwright/test';
import { catalog, expect, open, overflowingElements, scrollThrough, test } from './fixtures';

const LONG_WORD = 'Supercalifragilisticexpialidocious'.repeat(3);
const LONG_NAME = `Extraordinarily Luxurious Hand-Wrapped Belgian Chocolate & Mithai Celebration Hamper ${LONG_WORD} With Roses`;
const LONG_DESC = `${'This hamper has a very long description that goes on and on. '.repeat(30)}${LONG_WORD}`;

/** Serve a catalog where every name, brand and category is absurdly long. */
async function longCatalog(page: Page): Promise<void> {
  const data = structuredClone(catalog);
  data.categories = data.categories.map((c) => ({ ...c, name: `${c.name} and Many Other Wonderful Things ${LONG_WORD}`, description: LONG_DESC }));
  data.products = data.products.map((p, i) => ({
    ...p,
    name: i % 2 ? LONG_NAME : `${p.name} ${LONG_WORD}`,
    brand: p.brand ? `${p.brand} Chocolatiers International Limited` : null,
    description: LONG_DESC,
    price: i % 3 ? p.price : 1_234_567,
    compareAtPrice: i % 3 ? p.compareAtPrice : 9_876_543,
  }));
  await page.route('**/data/catalog.json', (r) => r.fulfill({ json: data }));
}

/** Text that is cut off must be cut off on purpose: clamped, with an ellipsis. */
async function uncontrolledOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('main *, header *, footer *')) {
      // only elements that hold text themselves; transformed pictures and hidden slides aren't text spilling
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (el.offsetParent === null || !ownText || getComputedStyle(el).visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
      const s = getComputedStyle(el);
      const wider = el.scrollWidth > el.clientWidth + 1 && s.overflowX === 'visible' && el.clientWidth > 0;
      if (wider && s.display !== 'inline' && !['INPUT', 'TEXTAREA', 'SELECT', 'svg'].includes(el.tagName)) {
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}: "${el.textContent.trim().slice(0, 40)}…"`);
      }
    }
    return out.slice(0, 8);
  });
}

test.describe('long text', () => {
  for (const path of ['/', '/shop', '/category/chocolates', `/product/${catalog.products[1].slug}`, '/build-a-basket', '/sitemap']) {
    test(`stays inside its box on ${path}`, async ({ page }) => {
      test.setTimeout(90_000);
      await longCatalog(page);
      await open(page, path);
      await scrollThrough(page);
      expect(await overflowingElements(page), 'page wider than screen').toEqual([]);
      expect(await uncontrolledOverflow(page), 'text spilling out of its box').toEqual([]);
    });
  }

  test('product names are clamped with an ellipsis', async ({ page }) => {
    await longCatalog(page);
    await open(page, '/shop');
    const name = page.locator('app-product-card .name').first();
    await expect(name).toBeVisible();
    const box = await name.evaluate((el) => {
      const s = getComputedStyle(el);
      return { clamp: s.webkitLineClamp, hidden: s.overflow, clipped: el.scrollHeight > el.clientHeight + 1, title: el.getAttribute('title') };
    });
    expect(box.clamp).toBe('2');
    expect(box.hidden).toBe('hidden');
    expect(box.clipped).toBe(true);
    expect(box.title, 'full name still available on hover').toContain('Supercalifragilistic');
  });

  test('one-line labels end in an ellipsis', async ({ page }) => {
    await longCatalog(page);
    await open(page, '/shop');
    const meta = page.locator('app-product-card .cat').first();
    const s = await meta.evaluate((el) => ({ to: getComputedStyle(el).textOverflow, ws: getComputedStyle(el).whiteSpace, clipped: el.scrollWidth > el.clientWidth }));
    expect(s).toEqual({ to: 'ellipsis', ws: 'nowrap', clipped: true });
  });

  test('cart and checkout survive long names and big prices', async ({ page }) => {
    await longCatalog(page);
    await open(page, `/product/${catalog.products[0].slug}`);
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await open(page, '/cart');
    await expect(page.locator('.item').first()).toBeVisible();
    expect(await overflowingElements(page)).toEqual([]);
    expect(await uncontrolledOverflow(page)).toEqual([]);
  });

  test('search panel with long results', async ({ page, isMobile }) => {
    await longCatalog(page);
    await open(page, '/');
    await page.locator('app-site-search .trigger').click();
    await page.locator('#site-search').fill('chocolate');
    await expect(page.locator('.prod').first()).toBeVisible();
    const clipped = await page.locator('.p-name').first().evaluate((el) => getComputedStyle(el).textOverflow);
    expect(clipped).toBe('ellipsis');
    expect(await overflowingElements(page)).toEqual([]);
    if (!isMobile) await expect(page.locator('.sheet')).toBeVisible();
  });
});

test.describe('broken images', () => {
  async function breakAllImages(page: Page) {
    await page.route(/\/images\/catalog\/.*|images\.(pexels|unsplash)\.com/, (r) => r.fulfill({ status: 404, body: '' }));
  }

  for (const path of ['/', '/shop', `/product/${catalog.products[0].slug}`, '/build-a-basket', '/contact']) {
    test(`fall back to the placeholder on ${path}`, async ({ page }) => {
      await breakAllImages(page);
      await open(page, path);
      await scrollThrough(page);
      const result = await page.evaluate(() => {
        const imgs = [...document.images].filter((i) => i.complete && i.getAttribute('src'));
        return {
          broken: imgs.filter((i) => i.naturalWidth === 0).map((i) => i.src),
          replaced: imgs.filter((i) => i.dataset['broken'] === 'true').length,
          onPlaceholder: imgs.filter((i) => i.dataset['broken'] === 'true').every((i) => i.src.endsWith('brand/placeholder.svg')),
        };
      });
      expect(result.broken, 'images still showing the broken icon').toEqual([]);
      expect(result.replaced, 'images swapped to the placeholder').toBeGreaterThan(0);
      expect(result.onPlaceholder).toBe(true);
    });
  }

  test('lightbox shows the placeholder too', async ({ page }) => {
    await breakAllImages(page);
    await open(page, `/product/${catalog.products[0].slug}`);
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    const img = page.locator('app-lightbox .stage img');
    await expect(img).toHaveAttribute('src', /placeholder\.svg$/);
  });
});

test('a catalog that fails to load leaves the page usable', async ({ page }) => {
  await page.route('**/data/catalog.json', (r) => r.fulfill({ status: 500, body: '' }));
  await page.goto('/shop');
  await expect(page.locator('h1')).toHaveText(/All gifts/);
  await expect(page.locator('header.bar')).toBeVisible();
  await expect(page.getByText(/couldn't load the gifts/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
