import AxeBuilder from '@axe-core/playwright';
import { catalog, expect, open, test } from './fixtures';

const product = catalog.products.find((p) => p.inStock && p.cities.includes('karachi'))!;

test.describe('header', () => {
  test('city picker filters the shop and is remembered', async ({ page, isMobile }) => {
    await open(page, '/shop');
    const count = page.locator('.count');
    const karachi = await count.textContent();
    await page.locator('.city select').selectOption('quetta');
    await expect(count).not.toHaveText(karachi!);
    await expect(count).toContainText('Quetta');
    if (!isMobile) await expect(page.locator('.announce .msg')).toContainText('Quetta');
    await page.reload();
    await expect(page.locator('.city select')).toHaveValue('quetta');
  });

  test('search: "/" opens, suggestions, arrow keys, Enter', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut is a desktop feature');
    await open(page, '/');
    await page.keyboard.press('/');
    const input = page.locator('#site-search');
    await expect(input).toBeFocused();
    await input.fill('kunafa');
    await expect(page.locator('.prod').first()).toContainText(/kunafa/i);
    await expect(page.locator('.all')).toContainText(/See all \d+ results/);
    await input.press('ArrowDown');
    await expect(page.locator('.sheet [aria-selected="true"]')).toHaveCount(1);
    await input.press('Escape'); // clears
    await expect(input).toHaveValue('');
    await input.fill('kunafa');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/shop\?q=kunafa/);
    await expect(page.locator('h1')).toContainText('kunafa');
  });

  test('search tolerates typos and remembers recent searches', async ({ page }) => {
    await open(page, '/');
    await page.locator('app-site-search .trigger').click();
    await page.locator('#site-search').fill('chocolat');
    await expect(page.locator('.prod').first()).toBeVisible();
    await page.locator('#site-search').press('Enter');
    await page.locator('app-site-search .trigger').click();
    await page.locator('#site-search').fill('');
    await expect(page.locator('.row-with-x').first()).toContainText('chocolat');
  });

  test('search with no results offers a way forward', async ({ page }) => {
    await open(page, '/');
    await page.locator('app-site-search .trigger').click();
    await page.locator('#site-search').fill('zzqqxx');
    await expect(page.getByText(/No gifts match/)).toBeVisible();
  });

  test('mobile menu opens, navigates and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout only');
    await open(page, '/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('.sheet-link', { hasText: 'Cakes' }).click();
    await expect(page).toHaveURL(/\/category\/cakes/);
    await expect(page.locator('nav.sheet')).toHaveCount(0);
  });
});

test.describe('shopping', () => {
  test('add to bag, change quantity, survives reload', async ({ page }) => {
    await open(page, `/product/${product.slug}`);
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await expect(page.locator('app-toast')).toContainText('added to your bag');
    await expect(page.locator('a[href="/cart"] .badge')).toHaveText('1');
    await open(page, '/cart');
    await expect(page.locator('.item')).toHaveCount(1);
    await page.getByRole('button', { name: `Add one ${product.name}` }).click();
    await expect(page.locator('.totals .grand')).toContainText((product.price * 2 + (product.price * 2 >= 10000 ? 0 : 250)).toLocaleString('en-PK'));
    await page.reload();
    await expect(page.locator('.item')).toHaveCount(1);
    await expect(page.locator('a[href="/cart"] .badge')).toHaveText('2');
  });

  test('checkout asks for missing details before placing the order', async ({ page }) => {
    await open(page, `/product/${product.slug}`);
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await open(page, '/cart');
    await page.getByRole('button', { name: /Place order/ }).click();
    await expect(page.getByRole('alert')).toContainText('details are missing');
    // a bad phone number is still wrong
    await page.locator('#c-name').fill('Sara');
    await page.locator('#c-phone').fill('12345');
    await page.getByRole('button', { name: /Place order/ }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('checkout places the order on WhatsApp with everything filled in', async ({ page, context }) => {
    await open(page, `/product/${product.slug}`);
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await open(page, '/cart');
    await page.locator('#c-name').fill('Sara Ahmed');
    await page.locator('#c-phone').fill('0300 1234567');
    await page.locator('#r-name').fill('Ammi');
    await page.locator('#r-phone').fill('0321 7654321');
    await page.locator('#r-addr').fill('House 12, Street 4, Block 5, Clifton');
    await page.getByRole('radio', { name: /Pick a date/ }).check({ force: true });
    await page.locator('#d-date').fill(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
    const popup = context.waitForEvent('page');
    await page.getByRole('button', { name: /Place order/ }).click();
    const wa = await popup;
    expect(decodeURIComponent(wa.url())).toMatch(/wa\.me|whatsapp/);
    await expect(page.locator('h1')).toContainText('send the message');
  });

  test('builder: start from an idea, review, add to bag', async ({ page }) => {
    await open(page, '/build-a-basket');
    await page.locator('.start').first().click();
    await expect(page.locator('.panel-head h2')).toHaveText('Check your basket');
    await expect(page.locator('.rev-list li').first()).toBeVisible();
    const total = await page.locator('app-basket-summary .total').textContent();
    expect(total).toMatch(/Rs [\d,]+/);
    await page.locator('.panel-nav .next, .mobile-bar .btn-primary').filter({ visible: true }).first().click();
    await expect(page.locator('a[href="/cart"] .badge')).toHaveText('1');
  });

  test('builder: step through, capacity stops overfilling', async ({ page, isMobile }) => {
    await open(page, '/build-a-basket');
    await page.locator('.start.scratch').click();
    const next = isMobile ? page.locator('.mobile-bar .btn-primary') : page.locator('.panel-nav .next');
    await next.click(); // to wrap
    await expect(page.locator('.panel-head h2')).toHaveText('Wrap and ribbon');
    await next.click(); // to treats
    await expect(next).toBeDisabled(); // nothing added yet
    const adds = page.locator('app-treat-card button', { hasText: 'Add' });
    for (let i = 0; i < 6; i++) await adds.nth(0).click();
    await expect(page.locator('.capacity')).toContainText('6 of 6');
    await expect(page.locator('app-treat-card button', { hasText: 'Add' }).first()).toBeDisabled();
  });
});

test.describe('product page', () => {
  test('gallery thumbnails and lightbox', async ({ page }) => {
    await open(page, `/product/${product.slug}`);
    const thumbs = page.locator('.thumbs button');
    await expect(thumbs).toHaveCount(product.images.length);
    await thumbs.nth(1).click();
    await expect(page.locator('.main-img img')).toHaveAttribute('src', product.images[1]);
    await page.getByRole('button', { name: 'Full screen', exact: true }).click();
    const lb = page.locator('app-lightbox');
    await expect(lb).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close pictures' })).toBeFocused();
    await expect(lb.locator('.strip button')).toHaveCount(product.images.length);
    await page.keyboard.press('ArrowRight');
    await expect(lb.locator('.count')).toHaveText(`1 / ${product.images.length}`);
    await page.keyboard.press('Escape');
    await expect(lb).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('a missing product shows a helpful page', async ({ page }) => {
    await open(page, '/product/not-a-real-gift');
    await expect(page.locator('h1')).toHaveText(/couldn't find that gift/);
    await expect(page.getByRole('link', { name: 'See all gifts' })).toBeVisible();
  });
});

test.describe('widgets', () => {
  test.use({ fresh: true });

  test('cookie notice: shows, remembers the choice', async ({ page }) => {
    await open(page, '/');
    const banner = page.locator('app-cookie-consent .cookie');
    await expect(banner).toBeVisible({ timeout: 8000 });
    await banner.getByRole('button', { name: 'Essential only' }).click();
    await expect(banner).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(5000);
    await expect(banner).toHaveCount(0);
  });

  test('WhatsApp: badge, three messages at once, badge gone after opening', async ({ page }) => {
    await open(page, '/');
    const bubble = page.locator('.wa-bubble');
    await expect(bubble).toBeVisible({ timeout: 8000 });
    await expect(bubble.locator('.wa-unread')).toHaveText('3');
    await bubble.click();
    await expect(page.locator('.wa-widget .wa-bubble-msg')).toHaveCount(3);
    await expect(page.locator('.wa-typing')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close chat' }).click();
    await expect(bubble.locator('.wa-unread')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.wa-bubble')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.wa-unread')).toHaveCount(0);
  });
});

test.describe('home', () => {
  test('hero slider moves with the arrows and the dots', async ({ page, isMobile }) => {
    await open(page, '/');
    const active = page.locator('.hero .slide.is-active .title');
    const first = await active.textContent();
    if (!isMobile) await page.getByRole('button', { name: 'Next slide' }).click();
    else await page.locator('.dot').nth(1).click();
    await expect(active).not.toHaveText(first!);
    await page.locator('.dot').nth(0).click();
    await expect(active).toHaveText(first!);
  });
});

test.describe('accessibility', () => {
  for (const path of ['/', '/shop', `/product/${product.slug}`, '/build-a-basket', '/cart', '/contact', '/sitemap']) {
    test(`no critical axe violations on ${path}`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'checked once, at desktop');
      await open(page, path);
      const results = await new AxeBuilder({ page }).disableRules(['region']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
});
