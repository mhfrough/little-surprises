import AxeBuilder from '@axe-core/playwright';
import { catalog, open, test } from './fixtures';

// Diagnostic only: prints every serious/critical axe finding with its elements.
test('axe details', async ({ page, isMobile }) => {
  test.skip(isMobile || !process.env['AXE_REPORT'], 'run with AXE_REPORT=1');
  test.setTimeout(120_000);
  const product = catalog.products.find((p) => p.inStock)!;
  for (const path of ['/', '/shop', `/product/${product.slug}`, '/build-a-basket', '/cart', '/contact', '/sitemap']) {
    await open(page, path);
    const r = await new AxeBuilder({ page }).disableRules(['region']).analyze();
    for (const v of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
      for (const n of v.nodes.slice(0, 6)) console.log(`${path} | ${v.id} | ${n.target.join(' ')} | ${n.failureSummary?.split('\n').slice(1, 2).join(' ')}`);
    }
  }
});
