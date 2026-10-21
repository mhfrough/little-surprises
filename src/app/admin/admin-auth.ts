import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEMO_OPERATORS } from './demo-operators';

export interface OperatorSession {
  email: string;
  name: string;
  role: string;
  expires: number;
}

export type SignInResult = 'ok' | 'invalid' | 'locked';

const KEY = 'ls-admin-session';
const HOUR = 3_600_000;
const REMEMBER_FOR = 14 * 24 * HOUR;
const SESSION_FOR = 12 * HOUR;
const MAX_TRIES = 5;
const LOCK_FOR = 30_000;

/** "Keep me signed in" lives in localStorage; otherwise the tab's sessionStorage. */
function readSession(): OperatorSession | null {
  for (const store of [() => localStorage, () => sessionStorage]) {
    try {
      const raw = store().getItem(KEY);
      if (!raw) continue;
      const s = JSON.parse(raw) as OperatorSession;
      if (s?.email && s.expires > Date.now()) return s;
      store().removeItem(KEY);
    } catch {
      /* storage blocked or bad JSON: signed out */
    }
  }
  return null;
}

/**
 * Who is signed in to the operator portal. Demo accounts for now (see
 * demo-operators.ts); the NestJS backend will own the check and the session.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  readonly session = signal<OperatorSession | null>(readSession());
  readonly initials = computed(() =>
    (this.session()?.name ?? '')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
  /** Epoch ms until which sign-in is refused after too many wrong tries. */
  readonly lockedUntil = signal(0);
  private failures = 0;

  /** True while the session is still in date; clears it once it has run out. */
  isValid(): boolean {
    const s = this.session();
    if (s && s.expires > Date.now()) return true;
    if (s) this.signOut();
    return false;
  }

  async signIn(email: string, password: string, remember: boolean): Promise<SignInResult> {
    if (Date.now() < this.lockedUntil()) return 'locked';
    // a beat, as a network round trip would take, so the button state reads
    await new Promise((r) => setTimeout(r, 450));
    const op = DEMO_OPERATORS.find((o) => o.email === email.trim().toLowerCase() && o.password === password);
    if (!op) {
      if (++this.failures >= MAX_TRIES) {
        this.failures = 0;
        this.lockedUntil.set(Date.now() + LOCK_FOR);
        return 'locked';
      }
      return 'invalid';
    }
    this.failures = 0;
    const session: OperatorSession = {
      email: op.email,
      name: op.name,
      role: op.role,
      expires: Date.now() + (remember ? REMEMBER_FOR : SESSION_FOR),
    };
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    } catch {
      /* storage blocked: signed in for this page only */
    }
    this.session.set(session);
    return 'ok';
  }

  signOut(): void {
    for (const store of [() => localStorage, () => sessionStorage]) {
      try {
        store().removeItem(KEY);
      } catch {
        /* storage blocked */
      }
    }
    this.session.set(null);
  }
}

/** Portal pages: signed-in operators only; everyone else goes to sign-in, then back. */
export const operatorGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AdminAuth);
  if (auth.isValid()) return true;
  const next = state.url === '/admin' ? undefined : state.url;
  return inject(Router).createUrlTree(['/admin/login'], { queryParams: { next } });
};

/** The sign-in page itself: already signed in → straight to the dashboard. */
export const guestGuard: CanActivateFn = () => (inject(AdminAuth).isValid() ? inject(Router).createUrlTree(['/admin']) : true);
