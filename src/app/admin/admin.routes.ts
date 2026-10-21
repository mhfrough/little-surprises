import { Routes } from '@angular/router';
import { guestGuard, operatorGuard } from './admin-auth';

/** The operator portal, behind sign-in. Demo accounts until the NestJS backend owns auth. */
export const ADMIN_ROUTES: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./login-page').then((m) => m.LoginPage) },
  {
    path: '',
    canActivate: [operatorGuard],
    canActivateChild: [operatorGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./dashboard-page').then((m) => m.DashboardPage) },
      { path: 'products', loadComponent: () => import('./products-page').then((m) => m.ProductsPage) },
      { path: 'products/new', loadComponent: () => import('./product-edit-page').then((m) => m.ProductEditPage) },
      { path: 'products/:id', loadComponent: () => import('./product-edit-page').then((m) => m.ProductEditPage) },
      { path: 'categories', loadComponent: () => import('./categories-page').then((m) => m.CategoriesPage) },
      { path: 'inbox', loadComponent: () => import('./inbox-page').then((m) => m.InboxPage) },
      { path: 'reviews', loadComponent: () => import('./reviews-admin-page').then((m) => m.ReviewsAdminPage) },
      { path: 'vouchers', loadComponent: () => import('./vouchers-page').then((m) => m.VouchersPage) },
      { path: 'customers', loadComponent: () => import('./customers-page').then((m) => m.CustomersPage) },
    ],
  },
];
