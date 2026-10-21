import { OCCASIONS, brokenImages, catalog, expect, open, overflowingElements, policies, scrollThrough, test } from './fixtures';

/**
 * Every kind of page, at desktop and phone width: it renders, has one h1 and
 * a real title, no console errors or failed requests, nothing wider than the
 * screen, and no broken images.
 */
const inStock = catalog.products.find((p) => p.inStock)!;
const soldOut = catalog.products.find((p) => !p.inStock);
const giftwifts = catalog.products.find((p) => p.brand !== 'Belco' && p.inStock)!;

const ROUTES: { name: string; path: string; h1?: RegExp }[] = [
  { name: 'home', path: '/', h1: /Wrapped by hand/ },
  { name: 'shop', path: '/shop', h1: /All gifts/ },
  { name: 'search results', path: '/shop?q=kunafa', h1: /kunafa/i },
  ...catalog.categories.map((c) => ({ name: `category ${c.slug}`, path: `/category/${c.slug}`, h1: new RegExp(c.name.replace(/[&]/g, '.')) })),
  ...OCCASIONS.map((o) => ({ name: `occasion ${o}`, path: `/occasion/${o}` })),
  { name: 'product (Belco, in stock)', path: `/product/${inStock.slug}` },
  { name: 'product (Giftwifts)', path: `/product/${giftwifts.slug}` },
  ...(soldOut ? [{ name: 'product (sold out)', path: `/product/${soldOut.slug}` }] : []),
  { name: 'build a basket', path: '/build-a-basket', h1: /Build a basket/ },
  { name: 'cart (empty)', path: '/cart', h1: /bag is empty/i },
  { name: 'contact', path: '/contact', h1: /Talk to a real person/ },
  ...policies.map((p) => ({ name: `policy ${p.slug}`, path: `/policies/${p.slug}`, h1: new RegExp(p.title) })),
  { name: 'sitemap', path: '/sitemap', h1: /Sitemap/ },
  { name: 'design system', path: '/design', h1: /design system/ },
  { name: 'not found', path: '/this-page-does-not-exist', h1: /couldn't find that page/ },
];

for (const r of ROUTES) {
  test(`${r.name} renders cleanly`, async ({ page, problems }) => {
    await open(page, r.path);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    if (r.h1) await expect(h1).toHaveText(r.h1);
    await expect(page).not.toHaveTitle(/^LittleThings|^$/);

    await scrollThrough(page);
    expect(await overflowingElements(page), 'elements wider than the screen').toEqual([]);
    expect(await brokenImages(page), 'broken images').toEqual([]);

    // every image says what it is, or is marked decorative with alt=""
    const missingAlt = await page.locator('img:not([alt])').count();
    expect(missingAlt, 'images without an alt attribute').toBe(0);

    // every button and link can be named by a screen reader
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main button, main a, header button, header a')]
        .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"]'))
        .filter((el) => !(el.getAttribute('aria-label') || el.textContent?.trim() || el.querySelector('img[alt]:not([alt=""])')))
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(unnamed, 'controls without a name').toEqual([]);

    expect(problems.console, 'console errors').toEqual([]);
    expect(problems.failed, 'failed requests').toEqual([]);
  });
}
