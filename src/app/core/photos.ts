/**
 * Every stock photograph the site shows outside the product catalog, with who
 * took it. The /credits page is built from this list, so a photo added here is
 * credited automatically. Ids are what img() in catalog.ts expects: Unsplash
 * "1510284876186-b1a84b94418f" style, Pexels numeric.
 */
export interface StockPhoto {
  id: string;
  /** what it shows, used as the credit line and as default alt text */
  title: string;
  /** where it appears on the site */
  usedFor: string;
  author: string;
  authorUrl: string;
  page: string;
  source: 'Unsplash' | 'Pexels';
}

export const PHOTOS = {
  giftRed: {
    id: '1513885535751-8b9238bd345a',
    title: 'Gift boxes',
    usedFor: 'Home hero',
    author: 'freestocks',
    authorUrl: 'https://unsplash.com/@freestocks',
    page: 'https://unsplash.com/photos/gift-boxes-PxM8aeJbzvk',
    source: 'Unsplash',
  },
  giftHands: {
    id: '1607344645866-009c320b63e0',
    title: 'Gift boxes tied with gold ribbon',
    usedFor: 'Home hero, corporate gifting',
    author: 'Shamblen Studios',
    authorUrl: 'https://unsplash.com/@shamblenstudios',
    page: 'https://unsplash.com/photos/blue-and-white-star-print-textile-M-dLdqCVfAY',
    source: 'Unsplash',
  },
  giftKraft: {
    id: '14365405',
    title: 'Brown woven basket with souvenirs',
    usedFor: 'Home hero, contact page, basket builder',
    author: 'Masood Aslami',
    authorUrl: 'https://www.pexels.com/@masoodaslami/',
    page: 'https://www.pexels.com/photo/brown-woven-basket-with-souvenirs-14365405/',
    source: 'Pexels',
  },
  hamper: {
    id: '27393960',
    title: 'Present basket with a ribbon, champagne and chocolates',
    usedFor: 'Home hero, ready-made baskets, basket builder',
    author: 'Denislav',
    authorUrl: 'https://www.pexels.com/@denislav-581353/',
    page: 'https://www.pexels.com/photo/27393960/',
    source: 'Pexels',
  },
  kraftFlatlay: {
    id: '1510284876186-b1a84b94418f',
    title: 'Four brown gift boxes on a white surface',
    usedFor: 'Occasions and newsletter backgrounds',
    author: 'Caley Dimmock',
    authorUrl: 'https://unsplash.com/@caleydimmock',
    page: 'https://unsplash.com/photos/four-brown-gift-boxes-on-white-surface-_HCpwe1-Prc',
    source: 'Unsplash',
  },
  pinkYarn: {
    id: '1606209918398-08c0ef28d2b8',
    title: 'Paper beside pink yarn',
    usedFor: 'Reviews background',
    author: 'micheile henderson',
    authorUrl: 'https://unsplash.com/@micheile',
    page: 'https://unsplash.com/photos/white-printer-paper-beside-pink-yarn-pxaYe7tkLW4',
    source: 'Unsplash',
  },
} as const satisfies Record<string, StockPhoto>;
