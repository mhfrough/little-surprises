import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminCatalogStore } from '../core/admin-catalog.store';
import { InboxService } from '../core/inbox.service';
import { VouchersService } from '../core/vouchers.service';
import { OrdersService } from '../core/orders.service';
import { CustomersService } from '../core/customers.service';
import { ReviewsService } from '../core/reviews.service';
import { BrandMark } from '../shared/brand-mark';
import { I } from '../shared/icons';
import { ThemeToggle } from '../shared/theme-toggle';
import { AdminAuth } from './admin-auth';

/**
 * The operator portal frame: a sidebar (collapses to a top bar on phones) and
 * a banner that says plainly where the data lives until the backend exists.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, BrandMark, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.nav-open]="navOpen()">
      <aside class="side" aria-label="Operator navigation">
        <div class="side-head">
          <a routerLink="/admin" class="brand"><app-brand-mark [size]="34" [tagline]="false" /></a>
          <span class="role">Operator</span>
        </div>
        <nav>
          <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.LayoutDashboard" [size]="18" [strokeWidth]="1.8" /> Dashboard
          </a>
          <a routerLink="/admin/products" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.Package" [size]="18" [strokeWidth]="1.8" /> Products
          </a>
          <a routerLink="/admin/categories" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.FolderTree" [size]="18" [strokeWidth]="1.8" /> Categories
          </a>
          <a routerLink="/admin/customers" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.Users" [size]="18" [strokeWidth]="1.8" /> Customers
          </a>
          <a routerLink="/admin/inbox" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.Inbox" [size]="18" [strokeWidth]="1.8" /> Inbox
            @if (inbox.unread()) { <span class="count" [attr.aria-label]="inbox.unread() + ' new'">{{ inbox.unread() }}</span> }
          </a>
          <a routerLink="/admin/reviews" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.Star" [size]="18" [strokeWidth]="1.8" /> Reviews
            @if (reviews.pendingCount()) { <span class="count" [attr.aria-label]="reviews.pendingCount() + ' to approve'">{{ reviews.pendingCount() }}</span> }
          </a>
          <a routerLink="/admin/vouchers" routerLinkActive="is-active" (click)="navOpen.set(false)">
            <lucide-icon [img]="I.TicketPercent" [size]="18" [strokeWidth]="1.8" /> Vouchers
          </a>
        </nav>
        <div class="side-foot">
          @if (auth.session(); as me) {
            <div class="me">
              <span class="avatar" aria-hidden="true">{{ auth.initials() }}</span>
              <span class="me-text"><strong class="clamp-1">{{ me.name }}</strong><span class="clamp-1">{{ me.role }} · {{ me.email }}</span></span>
              <button type="button" class="adm-icon-btn" (click)="signOut()" aria-label="Sign out" title="Sign out"><lucide-icon [img]="I.LogOut" [size]="16" [strokeWidth]="2" /></button>
            </div>
          }
          <app-theme-toggle />
          <a routerLink="/" class="back"><lucide-icon [img]="I.ExternalLink" [size]="16" [strokeWidth]="2" /> View the shop</a>
        </div>
      </aside>

      <div class="main">
        <div class="topbar">
          <button type="button" class="adm-icon-btn menu" (click)="navOpen.set(!navOpen())" aria-label="Menu" [attr.aria-expanded]="navOpen()">
            <lucide-icon [img]="I.Menu" [size]="20" [strokeWidth]="2" />
          </button>
          <p class="demo">
            <lucide-icon [img]="I.CircleAlert" [size]="16" [strokeWidth]="2" />
            Demo data — changes are saved in this browser until the backend is connected.
            @if (catalog.changeCount()) { <span>{{ catalog.changeCount() }} catalog {{ catalog.changeCount() === 1 ? 'change' : 'changes' }} saved.</span> }
          </p>
          <button type="button" class="btn btn-plain btn-sm" (click)="resetDemo()">Reset demo data</button>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--ground); }
    .shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
    .side { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 20px; padding: 20px 14px; background: var(--surface); }
    .side-head { display: grid; gap: 6px; padding: 0 8px; }
    .side-head ::ng-deep .word { font-size: 1.15rem; }
    .role { font-size: 0.75rem; font-weight: 600; color: var(--ink-3); padding-left: 44px; margin-top: -6px; }
    nav { display: grid; gap: 2px; }
    nav a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; color: var(--ink-2); font-weight: 560; font-size: 0.9375rem; }
    nav a:hover { background: var(--surface-2); color: var(--ink); }
    nav a.is-active { background: var(--ground); color: var(--ink); box-shadow: 0 1px 3px rgb(0 0 0 / 0.06); }
    nav a.is-active lucide-icon { color: var(--accent); }
    .count { margin-left: auto; min-width: 22px; height: 22px; padding: 0 7px; border-radius: 11px; background: var(--accent); color: var(--accent-ink); font-size: 0.75rem; font-weight: 700; display: grid; place-items: center; }
    .side-foot { margin-top: auto; display: grid; gap: 12px; padding: 0 8px; }
    .me { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 0 12px; border-bottom: 1px solid var(--surface-2); }
    .avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.02em; }
    .me-text { display: grid; line-height: 1.3; }
    .me-text strong { font-size: 0.875rem; font-weight: 620; }
    .me-text span { font-size: 0.75rem; color: var(--ink-3); }
    .back { display: inline-flex; align-items: center; gap: 8px; font-size: var(--text-small); color: var(--ink-2); }
    .back:hover { color: var(--accent); }
    .main { min-width: 0; }
    .topbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 12px; padding: 10px clamp(16px, 3vw, 40px); background: var(--ground); border-bottom: 1px solid var(--surface-2); }
    .menu { display: none; }
    .demo { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; font-size: 0.8125rem; color: var(--ink-2); }
    .demo lucide-icon { color: #c47d00; flex: none; }
    .demo span { color: var(--accent); font-weight: 600; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: minmax(0, 1fr); }
      .side { position: fixed; inset: 0 auto 0 0; z-index: 30; width: 260px; transform: translateX(-100%); transition: transform var(--dur) var(--ease-out); box-shadow: var(--shadow-float); }
      .nav-open .side { transform: none; }
      .menu { display: inline-grid; }
    }
  `,
})
export class AdminShell {
  protected readonly I = I;
  protected readonly inbox = inject(InboxService);
  private readonly vouchers = inject(VouchersService);
  private readonly orders = inject(OrdersService);
  private readonly customers = inject(CustomersService);
  protected readonly reviews = inject(ReviewsService);
  protected readonly catalog = inject(AdminCatalogStore);
  protected readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);
  protected readonly navOpen = signal(false);

  constructor() {
    inject(Title).setTitle('Operator · Little Surprises');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/admin/login'], { queryParams: { bye: 1 } });
  }

  resetDemo(): void {
    if (!confirm('Throw away every change made in this portal on this browser (products, categories, inbox, review decisions, vouchers, orders and customer merges)?')) return;
    this.catalog.reset();
    this.inbox.reset();
    this.vouchers.reset();
    this.orders.reset();
    this.customers.reset();
    try {
      localStorage.removeItem('ls-review-mod');
    } catch {
      /* storage blocked */
    }
    location.reload();
  }
}
