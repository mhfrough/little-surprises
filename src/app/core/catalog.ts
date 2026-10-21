import { BasketBase, RibbonColour, WrapStyle } from './models';
import { PHOTOS } from './photos';

/** Widths each stock photo is kept at, as WebP (scripts/build-site-photos.mjs). */
export const SITE_WIDTHS = [640, 960, 1600, 2400];

/**
 * Self-hosted WebP of a stock photograph (hero, sections, builder bases), at the
 * smallest stored width that covers `w`. Product photos live in the catalog.
 */
export function img(id: string, w = 800): string {
  const width = SITE_WIDTHS.find((s) => s >= w) ?? SITE_WIDTHS[SITE_WIDTHS.length - 1];
  return `images/site/${id}-${width}.webp`;
}

/** Photo ids by name; who took each one is in photos.ts (and on /credits). */
export const PIC = Object.fromEntries(Object.entries(PHOTOS).map(([k, p]) => [k, p.id])) as {
  [K in keyof typeof PHOTOS]: (typeof PHOTOS)[K]['id'];
};

/** Occasions shown as tiles, in order. Counts and pictures come from the catalog. */
export const OCCASION_DEFS: { id: string; name: string; match: (p: { occasions: string[]; categoryId: string }) => boolean }[] = [
  { id: 'birthday', name: 'Birthday', match: (p) => p.occasions.includes('birthday') },
  { id: 'eid', name: 'Eid & festive', match: (p) => p.occasions.includes('eid') },
  { id: 'love', name: 'Anniversary & love', match: (p) => p.categoryId === 'flowers' },
  { id: 'new-baby', name: 'New baby', match: (p) => p.occasions.includes('new-baby') },
  { id: 'kids', name: 'For kids', match: (p) => p.occasions.includes('kids') },
  { id: 'thank-you', name: 'Thank you', match: (p) => p.categoryId === 'hampers' },
  { id: 'pinktober', name: 'Pinktober', match: (p) => p.occasions.includes('pinktober') },
  { id: 'teachers-day', name: "Teachers' Day", match: (p) => p.occasions.includes('teachers-day') },
];

/** Categories whose items can go inside a build-your-own basket. */
export const BASKET_CATEGORIES = ['chocolates', 'mithai', 'perfumes', 'toys'];

export const BASKET_BASES: BasketBase[] = [
  { id: 'b1', name: 'Kraft weave basket', price: 1500, capacity: 6, description: 'Woven kraft with our twine.', image: img(PIC.giftKraft, 500) },
  { id: 'b2', name: 'Signature gift box', price: 2200, capacity: 8, description: 'Rigid magnetic box in blush.', image: img(PIC.giftRed, 500) },
  { id: 'b3', name: 'Keepsake hamper', price: 3500, capacity: 12, description: 'Lined wicker, made to keep.', image: img(PIC.hamper, 500) },
];

export const WRAPS: WrapStyle[] = [
  { id: 'w1', name: 'Blush tissue', colour: '#f4d7df', price: 0 },
  { id: 'w2', name: 'Kraft & twine', colour: '#cfae8a', price: 400 },
  { id: 'w3', name: 'Rose satin', colour: '#d86b8a', price: 600 },
  { id: 'w4', name: 'Velvet wine', colour: '#7a0f3d', price: 900 },
];

export const RIBBONS: RibbonColour[] = [
  { id: 'r1', name: 'Rose pink', hex: '#d86b8a' },
  { id: 'r2', name: 'Wine', hex: '#7a0f3d' },
  { id: 'r3', name: 'Blush', hex: '#e89cb3' },
  { id: 'r4', name: 'Sage', hex: '#7b7a5c' },
  { id: 'r5', name: 'Cream', hex: '#f2e7d8' },
];

export const BRAND = {
  name: 'Little Surprises',
  line: 'Personalized with Love, Delivered with Care',
  email: 'hello@littlesurprises.pk',
  phone: '+92 300 0000000',
  /** wa.me number, digits only */
  whatsapp: '923000000000',
  address: 'Karachi, Pakistan',
  hours: 'Every day, 10 am – 10 pm',
  /** used for canonical links and the sitemap */
  siteUrl: 'https://littlesurprises.pk',
  instagram: { handle: '@littlesurprises.pk', url: 'https://www.instagram.com/littlesurprises.pk' },
  tiktok: { handle: '@littlesurprises.pk', url: 'https://www.tiktok.com/@littlesurprises.pk' },
};

/** Cities shown first in the picker; Karachi is the home city. */
export const PRIMARY_CITIES = ['karachi', 'lahore', 'islamabad', 'rawalpindi', 'hyderabad', 'faisalabad', 'multan', 'peshawar'];
