/**
 * Catalog shapes. These mirror public/data/catalog.json, which mirrors the
 * tables the NestJS + PostgreSQL backend will have, so swapping the JSON for
 * the API later changes only CatalogService.
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  count: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** PKR, Karachi price where the source prices by city */
  price: number;
  compareAtPrice: number | null;
  /** 640px pictures for pages */
  images: string[];
  /** the same pictures at up to 1600px, for the lightbox */
  zoom?: string[];
  categoryId: string;
  brand: string | null;
  occasions: string[];
  tags: string[];
  /** lower-case city names this product delivers to */
  cities: string[];
  inStock: boolean;
  source: 'belco' | 'giftwifts';
  /** average of its reviews, 0–5 */
  rating?: number;
  reviewCount?: number;
}

export interface Catalog {
  generatedAt: string;
  currency: 'PKR';
  defaultCity: string;
  categories: Category[];
  products: Product[];
}

export interface Occasion {
  id: string;
  name: string;
  image: string;
  count: number;
}

export interface BasketBase {
  id: string;
  name: string;
  image: string;
  price: number;
  capacity: number;
  description: string;
}

export interface WrapStyle {
  id: string;
  name: string;
  colour: string;
  price: number;
}

export interface RibbonColour {
  id: string;
  name: string;
  hex: string;
}

export interface Review {
  id: string;
  /** empty for feedback about the shop rather than one product */
  productId: string;
  rating: number;
  title: string;
  text: string;
  name: string;
  city: string;
  /** YYYY-MM-DD */
  date: string;
  verified: boolean;
  helpful: number;
  /** written on this device, waiting for approval */
  mine?: boolean;
}

export interface BasketLine {
  product: Product;
  quantity: number;
}
