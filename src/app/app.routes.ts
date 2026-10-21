import { Routes } from '@angular/router';

const shop = () => import('./pages/shop/shop-page').then((m) => m.ShopPage);

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage) },
  { path: 'shop', loadComponent: shop, data: { mode: 'all' } },
  { path: 'category/:slug', loadComponent: shop, data: { mode: 'category' } },
  { path: 'occasion/:slug', loadComponent: shop, data: { mode: 'occasion' } },
  { path: 'product/:slug', loadComponent: () => import('./pages/product/product-page').then((m) => m.ProductPage) },
  { path: 'build-a-basket', loadComponent: () => import('./pages/builder/builder-page').then((m) => m.BuilderPage) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart-page').then((m) => m.CartPage) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact-page').then((m) => m.ContactPage) },
  { path: 'policies', pathMatch: 'full', redirectTo: 'policies/delivery' },
  { path: 'policies/:slug', loadComponent: () => import('./pages/policy/policy-page').then((m) => m.PolicyPage) },
  { path: 'reviews', loadComponent: () => import('./pages/reviews/reviews-page').then((m) => m.ReviewsPage) },
  { path: 'sitemap', loadComponent: () => import('./pages/sitemap/sitemap-page').then((m) => m.SitemapPage) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: 'design', loadComponent: () => import('./pages/design/design-page').then((m) => m.DesignPage) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
];
