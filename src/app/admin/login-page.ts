import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BrandMark } from '../shared/brand-mark';
import { I } from '../shared/icons';
import { ThemeToggle } from '../shared/theme-toggle';
import { AdminAuth } from './admin-auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Operator sign-in: one quiet card, plain errors, a short lock after repeated misses. */
@Component({
  selector: 'app-login-page',
  imports: [RouterLink, LucideAngularModule, BrandMark, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth">
      <div class="top">
        <a routerLink="/" class="back"><lucide-icon [img]="I.ChevronLeft" [size]="18" [strokeWidth]="2" /> Back to the shop</a>
        <app-theme-toggle />
      </div>

      <section class="card" aria-labelledby="auth-title">
        <a routerLink="/" class="brand" aria-label="Little Surprises home"><app-brand-mark [size]="44" [tagline]="false" /></a>
        <div class="intro">
          <h1 id="auth-title">Sign in to the operator portal</h1>
          <p>For the Little Surprises team — gifts, categories, messages and reviews.</p>
        </div>

        @if (signedOut()) {
          <p class="notice is-positive" role="status"><lucide-icon [img]="I.CircleCheck" [size]="18" [strokeWidth]="2" /> You've signed out.</p>
        } @else if (next()) {
          <p class="notice" role="status"><lucide-icon [img]="I.LockKeyhole" [size]="18" [strokeWidth]="2" /> Please sign in to open that page.</p>
        }

        <form (submit)="submit($event)" novalidate>
          <div class="field">
            <label for="op-email">Work email</label>
            <input id="op-email" class="input" type="email" name="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false"
              required [value]="email()" (input)="email.set($any($event.target).value); emailError.set('')"
              [attr.aria-invalid]="!!emailError()" [attr.aria-describedby]="emailError() ? 'op-email-err' : null" />
            @if (emailError()) { <span id="op-email-err" class="field-hint is-error">{{ emailError() }}</span> }
          </div>

          <div class="field">
            <div class="label-row">
              <label for="op-pass">Password</label>
              <button type="button" class="link" (click)="help.set(!help())" [attr.aria-expanded]="help()" aria-controls="op-help">Forgot password?</button>
            </div>
            <div class="pass">
              <input id="op-pass" class="input" [type]="reveal() ? 'text' : 'password'" name="password" autocomplete="current-password" required
                [value]="password()" (input)="password.set($any($event.target).value); passError.set('')" (keyup)="caps.set($any($event).getModifierState?.('CapsLock'))"
                [attr.aria-invalid]="!!passError()" [attr.aria-describedby]="passError() ? 'op-pass-err' : caps() ? 'op-caps' : null" />
              <button type="button" class="eye" (click)="reveal.set(!reveal())" [attr.aria-label]="reveal() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="reveal()">
                <lucide-icon [img]="reveal() ? I.EyeOff : I.Eye" [size]="18" [strokeWidth]="2" />
              </button>
            </div>
            @if (passError()) { <span id="op-pass-err" class="field-hint is-error">{{ passError() }}</span> }
            @else if (caps()) { <span id="op-caps" class="field-hint">Caps Lock is on.</span> }
            @if (help()) {
              <p id="op-help" class="field-hint help">Ask the shop owner to reset it for you. Self-service reset arrives with the new backend.</p>
            }
          </div>

          <label class="check"><input type="checkbox" [checked]="remember()" (change)="remember.set($any($event.target).checked)" /> Keep me signed in on this device</label>

          @if (error()) {
            <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p>
          }

          <button class="btn btn-primary btn-lg btn-block" [disabled]="busy() || lockLeft() > 0">
            @if (busy()) { <span class="btn-spinner" aria-hidden="true"></span> Signing in… }
            @else if (lockLeft() > 0) { Try again in {{ lockLeft() }} s }
            @else { Sign in }
          </button>
        </form>
      </section>

      <p class="foot"><lucide-icon [img]="I.ShieldCheck" [size]="16" [strokeWidth]="2" /> Demo sign-in, checked in this browser until the backend is connected.</p>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--surface); }
    .auth { min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; justify-items: center; gap: 24px; padding: 20px 16px 28px; }
    .top { width: 100%; max-width: 1200px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .back { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding-right: 8px; font-size: var(--text-small); font-weight: 560; color: var(--ink-2); }
    .back:hover { color: var(--accent); }
    .card {
      align-self: center; width: min(100%, 420px); display: grid; gap: 24px;
      padding: clamp(24px, 5vw, 40px); border-radius: calc(var(--radius) + 8px); background: var(--ground); box-shadow: var(--shadow-float);
    }
    .brand { justify-self: start; border-radius: 12px; }
    .intro { display: grid; gap: 6px; }
    h1 { font-size: 1.5rem; font-weight: 680; letter-spacing: -0.02em; line-height: 1.2; text-wrap: balance; }
    .intro p { color: var(--ink-2); font-size: 0.9375rem; text-wrap: pretty; }
    form { display: grid; gap: 18px; }
    .label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
    .label-row label { font-size: var(--text-small); font-weight: 590; }
    .link { min-height: 32px; margin-block: -6px; padding: 0; background: none; border: 0; font-size: var(--text-small); font-weight: 560; color: var(--accent); cursor: pointer; }
    .link:hover { text-decoration: underline; text-underline-offset: 3px; }
    .pass { position: relative; }
    .pass .input { padding-right: 52px; }
    .eye { position: absolute; right: 2px; top: 50%; translate: 0 -50%; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 10px; background: none; color: var(--ink-3); cursor: pointer; }
    .eye:hover { color: var(--ink); }
    .help { padding: 10px 12px; border-radius: var(--radius-sm); background: var(--surface-2); color: var(--ink-2); }
    .check { font-size: 0.9375rem; }
    .btn-block { margin-top: 4px; }
    .foot { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--ink-3); text-align: center; }
    .foot lucide-icon { flex: none; }
  `,
})
export class LoginPage {
  protected readonly I = I;
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  /** Where to go after signing in (from the guard); only ever a portal page. */
  readonly next = input<string>();
  /** Set by the portal's Sign out button. */
  readonly bye = input<string>();

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly remember = signal(false);
  protected readonly reveal = signal(false);
  protected readonly caps = signal(false);
  protected readonly help = signal(false);
  protected readonly busy = signal(false);
  protected readonly emailError = signal('');
  protected readonly passError = signal('');
  protected readonly error = signal('');
  protected readonly signedOut = computed(() => this.bye() === '1' && !this.error());

  private readonly now = signal(Date.now());
  protected readonly lockLeft = computed(() => Math.max(0, Math.ceil((this.auth.lockedUntil() - this.now()) / 1000)));

  constructor() {
    inject(Title).setTitle('Sign in · Little Surprises operator');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
    const tick = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }

  async submit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    if (this.busy()) return;
    this.error.set('');
    const email = this.email().trim();
    this.emailError.set(!email ? 'Enter your work email.' : EMAIL.test(email) ? '' : 'That email doesn’t look right — check for typos.');
    this.passError.set(this.password() ? '' : 'Enter your password.');
    if (this.emailError() || this.passError()) {
      (document.getElementById(this.emailError() ? 'op-email' : 'op-pass') as HTMLInputElement | null)?.focus();
      return;
    }

    this.busy.set(true);
    const result = await this.auth.signIn(email, this.password(), this.remember());
    this.busy.set(false);
    this.now.set(Date.now());

    if (result === 'ok') {
      const next = this.next();
      this.router.navigateByUrl(next?.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin');
      return;
    }
    this.password.set('');
    this.error.set(
      result === 'locked'
        ? 'Too many tries. Sign-in is paused for a moment — please wait and try again.'
        : 'That email and password don’t match an operator account.',
    );
    (document.getElementById('op-pass') as HTMLInputElement | null)?.focus();
  }
}
