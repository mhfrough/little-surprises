#!/usr/bin/env node
/**
 * SAMPLE DATA. Writes public/data/reviews.json with made-up customer reviews
 * for every product, and puts each product's rating and review count on
 * public/data/catalog.json. Seeded, so the same catalog always gives the same
 * reviews. Replace with real reviews (the backend's reviews table) before launch.
 *
 *   node scripts/build-reviews.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';

const pub = (p) => new URL(`../public/${p}`, import.meta.url);
const catalog = JSON.parse(await readFile(pub('data/catalog.json'), 'utf8'));

// ---- seeded randomness ------------------------------------------------------
function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

const NAMES = [
  'Ayesha K.', 'Bilal A.', 'Fatima R.', 'Sana M.', 'Usman T.', 'Hira N.', 'Zainab F.', 'Ahmed R.', 'Maryam I.', 'Omar F.',
  'Mahnoor S.', 'Saad H.', 'Iqra J.', 'Danish K.', 'Areeba Z.', 'Fahad M.', 'Noor U.', 'Kashif L.', 'Rabia Q.', 'Hassan B.',
  'Mehwish T.', 'Ali R.', 'Sadia P.', 'Talha W.', 'Amna G.', 'Faraz D.', 'Komal Y.', 'Junaid S.', 'Laiba H.', 'Shahzaib C.',
];
const CITIES = ['Karachi', 'Karachi', 'Karachi', 'Karachi', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Hyderabad', 'Faisalabad'];

const GOOD = {
  chocolates: [
    ['Rich and fresh', 'The chocolate was fresh and beautifully packed. My sister finished half the box the same evening!'],
    ['Perfect gift', 'Ordered for my boss’s birthday — the packaging looked so premium. Will order again.'],
    ['Bohat acha', 'Bohat acha taste aur packing bhi zabardast thi. Delivered on time in DHA.'],
    ['Better than expected', 'Honestly better than the picture. The kunafa filling was crunchy and not too sweet.'],
  ],
  cakes: [
    ['Moist and tasty', 'The cake was soft and moist, and the frosting wasn’t too sweet. Everyone at the party loved it.'],
    ['On time for the surprise', 'Arrived exactly in the slot I chose. Made my mum’s birthday morning special.'],
    ['Zabardast', 'Taste zabardast tha, size bhi theek tha. Rider ne pehle call ki, very professional.'],
    ['Fresh cake', 'Looked just like the picture and tasted fresh. Good value for the price.'],
  ],
  flowers: [
    ['Fresh roses', 'Flowers were fresh and lasted almost a week. The wrapping was really elegant.'],
    ['She loved it', 'Sent for our anniversary and my wife loved it. The handwritten note was a lovely touch.'],
    ['Beautiful bouquet', 'Bouquet looked exactly like the photo, maybe even fuller. Will use again.'],
  ],
  mithai: [
    ['Fresh mithai', 'Mithai was fresh, not dry at all. Perfect for Eid visits.'],
    ['Ammi approved', 'Ammi ne kaha ke bilkul fresh hai — that says everything. Box was neat too.'],
    ['Great for guests', 'Ordered two boxes for guests, everyone asked where it was from.'],
  ],
  perfumes: [
    ['Long-lasting scent', 'The fragrance lasts all day. Came in a proper sealed box, clearly original.'],
    ['Lovely gift', 'Bought it for my husband, he wears it every day now. Quick delivery in Lahore.'],
  ],
  toys: [
    ['Kids loved it', 'My nephew hasn’t put it down since it arrived. Good quality, no sharp edges.'],
    ['Nicely wrapped', 'Toy was gift-wrapped with a ribbon and a tag, looked really cute.'],
  ],
  hampers: [
    ['Stunning hamper', 'The hamper looked even better in person. Everything was neatly arranged and wrapped.'],
    ['Corporate gifts sorted', 'Ordered 10 of these for clients. Same quality across all of them and delivered together.'],
    ['Worth it', 'A bit pricey but completely worth it. The handwritten note made it feel personal.'],
    ['Eid ke liye perfect', 'Eid ke liye perfect hamper. Packing bohat neat thi aur delivery same day.'],
  ],
};
const OK = [
  ['Good, but a little late', 'Product was good but delivery came in the later slot than I picked. Still happy overall.'],
  ['Nice, smaller than expected', 'Quality is nice but it looked a little smaller than in the photo.'],
  ['Decent', 'Decent gift, packaging could be a bit sturdier for the price.'],
];
const BAD = [
  ['Box was dented', 'The outer box arrived dented. Customer service replaced it the next day though.'],
  ['Delivery delayed', 'Arrived a day late, which spoiled the surprise. The team apologised and gave a discount.'],
];

const ratingFor = (r) => (r < 0.56 ? 5 : r < 0.84 ? 4 : r < 0.94 ? 3 : r < 0.985 ? 2 : 1);
const base = new Date(catalog.generatedAt);

const reviews = [];
for (const p of catalog.products) {
  const rnd = seeded(p.id);
  const n = 2 + Math.floor(rnd() * (p.inStock ? 16 : 6));
  const pool = GOOD[p.categoryId] ?? GOOD.hampers;
  const names = new Set();
  for (let i = 0; i < n; i++) {
    const rating = ratingFor(rnd());
    const [title, text] = rating >= 4 ? pick(rnd, pool) : rating === 3 ? pick(rnd, OK) : pick(rnd, BAD);
    let name = pick(rnd, NAMES);
    while (names.has(name) && names.size < NAMES.length) name = pick(rnd, NAMES);
    names.add(name);
    const d = new Date(base);
    d.setDate(d.getDate() - Math.floor(rnd() * 540));
    reviews.push({
      id: `${p.id}-r${i + 1}`,
      productId: p.id,
      rating,
      title,
      text,
      name,
      city: pick(rnd, CITIES),
      date: d.toISOString().slice(0, 10),
      verified: rnd() < 0.86,
      helpful: Math.floor(rnd() * rnd() * 30),
    });
  }
}
reviews.sort((a, b) => b.date.localeCompare(a.date));

for (const p of catalog.products) {
  const mine = reviews.filter((r) => r.productId === p.id);
  p.reviewCount = mine.length;
  p.rating = mine.length ? Math.round((mine.reduce((s, r) => s + r.rating, 0) / mine.length) * 10) / 10 : 0;
}

await writeFile(pub('data/reviews.json'), JSON.stringify({ sample: true, generatedAt: new Date().toISOString(), reviews }));
await writeFile(pub('data/catalog.json'), JSON.stringify(catalog, null, 1));
const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
console.log(`✓ ${reviews.length} sample reviews, average ${avg.toFixed(2)} ★ across ${catalog.products.length} products`);
