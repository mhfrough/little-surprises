// Captures the REAL Little Surprises UI (running dev server, no source changes) for the reel.
//   node capture.cjs time     -> times a human-paced basket build (no screenshots), writes timing.json
//   node capture.cjs shots    -> screenshots (1000x784 viewport at 2x) + element boxes, writes shots.json
// Viewport 1000x784 = the browser-window frame's screen in the reel, so 1 CSS px = 1 reel px.
const fs = require('fs');
const path = require('path');
const { chromium } = require('D:/workspace-personal/little-things-gift-baskets/node_modules/playwright');
const BASE = 'http://localhost:4300';
const OUT = path.join(__dirname, '..', 'assets', 'ui');
const W = 1000, H = 784;
const mode = process.argv[2] || 'shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: mode === 'shots' ? 2 : 1,
    colorScheme: 'light', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('gw-cookie-consent', 'essential'); localStorage.setItem('gw-wa-seen', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const shots = {};
  const box = async (loc) => { const b = await loc.first().boundingBox(); return b && { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const settle = (ms) => page.waitForTimeout(ms || 700);
  // keep the builder's stepper just under the site header, like a person scrolled to it
  const toStepper = async () => {
    await settle(1300);   // let the builder's own smooth scroll finish first
    await page.evaluate(() => {
      const s = document.querySelector('.stepper');
      const head = document.querySelector('header');
      const hb = head ? head.getBoundingClientRect().bottom : 0;
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - Math.max(0, hb) - 14, behavior: 'instant' });
    });
    await settle(400);
  };
  const shot = async (name, targets) => {
    if (mode !== 'shots') return;
    await settle(500);
    // the dev server's compile-error overlay (from unrelated in-progress edits) is not part of the site
    await page.evaluate(() => document.querySelectorAll('vite-error-overlay').forEach((e) => e.remove()));
    const file = name + '.png';
    await page.screenshot({ path: path.join(OUT, file) });
    const boxes = {};
    for (const [k, loc] of Object.entries(targets || {})) boxes[k] = await box(loc);
    shots[name] = { file: 'assets/ui/' + file, boxes };
    console.log('shot', name, JSON.stringify(boxes));
  };
  // human pace: look, then act (waits only in "time" mode)
  let t0 = 0; const marks = [];
  const human = (s) => (mode === 'time' ? page.waitForTimeout(s * 1000) : Promise.resolve());
  const mark = (label) => { if (mode === 'time') { const t = (Date.now() - t0) / 1000; marks.push([label, +t.toFixed(2)]); console.log(label, t.toFixed(2)); } };

  const giftBox = page.locator('label.opt', { hasText: 'Signature gift box' });
  const next = page.locator('button.next');
  const rose = page.locator('label.opt', { hasText: 'Rose satin' });
  const wine = page.locator('label.sw[title="Wine"]');
  const addBtns = page.locator('app-treat-card button[aria-label^="Add "]');
  const forField = page.locator('#n-to');
  const bday = page.locator('.ideas button.chip', { hasText: 'Birthday' });
  const preview = page.locator('aside.preview');

  await page.goto(BASE + '/build-a-basket', { waitUntil: 'networkidle' });
  await settle(1200);
  await toStepper();
  t0 = Date.now(); mark('start (builder open)');

  // 1. basket
  await shot('s1-basket', { pick: giftBox, preview, next });
  await human(1.2); await giftBox.click(); mark('picked gift box');
  await toStepper();
  await shot('s1b-basket', { pick: giftBox, preview, next });
  await human(0.8); await next.click(); mark('continue to wrap');
  // 2. wrap and ribbon
  await toStepper();
  await shot('s2-wrap', { wrap: rose, ribbon: wine, preview, next });
  await human(1.2); await rose.click(); mark('rose satin');
  await shot('s2a-wrap', { wrap: rose, ribbon: wine, preview, next });
  await human(1.0); await wine.click(); mark('wine ribbon');
  await shot('s2b-wrap', { wrap: rose, ribbon: wine, preview, next });
  await human(0.8); await next.click(); mark('continue to treats');
  // 3. treats
  await toStepper();
  await shot('s3-treats', { add1: addBtns.nth(0), add2: addBtns.nth(1), add3: addBtns.nth(2), preview, next });
  const b2 = await box(addBtns.nth(1)), b3 = await box(addBtns.nth(2));
  await human(1.5); await addBtns.nth(0).click(); mark('treat 1');
  await shot('s3a-treats', {});
  await human(1.0); await page.mouse.click(b2.x + b2.w / 2, b2.y + b2.h / 2); mark('treat 2');
  await shot('s3b-treats', {});
  await human(1.0); await page.mouse.click(b3.x + b3.w / 2, b3.y + b3.h / 2); mark('treat 3');
  await shot('s3c-treats', { preview, next });
  await human(0.8); await next.click(); mark('continue to note');
  // 4. note
  await toStepper();
  await shot('s4-note', { to: forField, chip: bday, msg: page.locator('#n-msg'), preview, next });
  await human(1.0); await forField.click(); await forField.pressSequentially('Ammi', { delay: mode === 'time' ? 200 : 0 }); mark('typed for: Ammi');
  await shot('s4a-note', { to: forField, chip: bday, msg: page.locator('#n-msg'), preview, next });
  await human(1.2); await bday.click(); mark('birthday note');
  await shot('s4b-note', { to: forField, chip: bday, msg: page.locator('#n-msg'), preview, next });
  await human(0.8); await next.click(); mark('review');
  // 5. review
  await toStepper();
  await shot('s5-review', { preview, add: page.locator('button.next'), checkout: page.locator('button.checkout-now') });
  if (mode === 'time') {
    fs.writeFileSync(path.join(__dirname, 'timing.json'), JSON.stringify({ pace: 'look 0.8-1.5 s before each click, typing 5 chars/s', marks: marks }, null, 2));
    await browser.close(); return;
  }
  // checkout with the basket in the bag
  await page.locator('button.checkout-now').click();
  await page.waitForURL('**/cart'); await settle(1200);
  await shot('c1-cart', {});
  await page.screenshot({ path: path.join(OUT, 'c-cart-full.png'), fullPage: true });
  shots._cartTexts = await page.evaluate(() => Array.from(document.querySelectorAll('main h2, main h3, main legend, main label')).map((e) => e.textContent.trim().replace(/\s+/g, ' ')).slice(0, 80));
  await settle(5000);   // the "in the bag" toast goes away
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await settle(900);
  const waBtn = page.locator('button.wa-bubble');
  await shot('c2-cart', { today: page.locator('label, button').filter({ hasText: /^\s*Today/ }), cod: page.getByText('Cash on delivery', { exact: true }), jazz: page.getByText('JazzCash or Easypaisa', { exact: true }), wa: waBtn, total: page.getByText('Total', { exact: true }) });
  await page.evaluate(() => document.querySelectorAll('vite-error-overlay').forEach((e) => e.remove()));
  await waBtn.click(); await settle(1500);
  await shot('c3-wa', { wa: waBtn, widget: page.locator('.wa-widget') });
  // ready-made hamper
  await page.goto(BASE + '/product/signature-heritage-basket', { waitUntil: 'networkidle' }); await settle(1200);
  await shot('p1-product', {});
  for (let i = 0; i < 3; i++) {   // the dev server may live-reload while others edit the app: retry
    try { await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await settle(1500); await shot('h1-home', {}); break; }
    catch (e) { console.log('retry home:', e.message.slice(0, 80)); }
  }
  fs.writeFileSync(path.join(__dirname, 'shots.json'), JSON.stringify(shots, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
