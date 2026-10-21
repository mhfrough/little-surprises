// Exploration only: screenshot a few routes at two widths to choose the capture viewport.
const { chromium } = require('D:/workspace-personal/little-things-gift-baskets/node_modules/playwright');
const OUT = __dirname + '/explore/';
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  for (const [w, h] of [[1280, 1004], [820, 643]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => { try { localStorage.setItem('gw-cookie-consent', 'essential'); localStorage.setItem('gw-wa-seen', '1'); } catch {} });
    const p = await ctx.newPage();
    for (const r of ['/', '/build-a-basket', '/product/signature-heritage-basket', '/reviews', '/cart']) {
      await p.goto('http://localhost:4300' + r, { waitUntil: 'networkidle' });
      await p.waitForTimeout(1200);
      await p.screenshot({ path: OUT + w + (r.replace(/\//g, '_') || '_home') + '.png', fullPage: true });
    }
    await ctx.close();
  }
  await b.close();
})();
