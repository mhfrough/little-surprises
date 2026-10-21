import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PoliciesService } from '../../core/policies.service';
import { SeoService } from '../../core/seo.service';
import { Breadcrumbs } from '../../shared/breadcrumbs';

@Component({
  selector: 'app-policy-page',
  imports: [RouterLink, RouterLinkActive, Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main" class="container page">
      <app-breadcrumbs [items]="[{ label: 'Policies', link: '/policies' }, { label: policy()?.title ?? '' }]" />
      <div class="layout">
        <nav class="side" aria-label="Policies">
          @for (p of policies.all(); track p.slug) {
            <a [routerLink]="['/policies', p.slug]" routerLinkActive="is-active" ariaCurrentWhenActive="page">{{ p.title }}</a>
          }
        </nav>

        @if (policy(); as p) {
          <article>
            <header class="head">
              <h1 class="t-title">{{ p.title }}</h1>
              <p class="t-lead">{{ p.summary }}</p>
              <p class="t-small t-note">Last updated {{ updated() }}</p>
            </header>
            @for (s of p.sections; track s.heading) {
              <section>
                <h2 class="t-headline">{{ s.heading }}</h2>
                @for (para of s.body; track $index) { <p>{{ para }}</p> }
              </section>
            }
            <p class="ask">Still have a question? <a routerLink="/contact">Contact us</a> — we reply on WhatsApp within minutes.</p>
          </article>
        } @else if (policies.loading()) {
          <article aria-busy="true"><span class="skeleton sk"></span><span class="skeleton sk w"></span></article>
        } @else {
          <article><h1 class="t-title">Policy not found</h1><p><a routerLink="/policies">See all policies</a></p></article>
        }
      </div>
    </main>
  `,
  styles: `
    .page { display: grid; gap: 28px; padding-top: 32px; }
    .layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: clamp(24px, 5vw, 80px); align-items: start; }
    .side { display: grid; gap: 2px; position: sticky; top: calc(var(--header-h) + 16px); }
    .side a { padding: 10px 14px; border-radius: var(--radius-sm); color: var(--ink-2); font-size: 0.9375rem; }
    .side a:hover { background: var(--surface); color: var(--ink); }
    .side a.is-active { background: var(--surface-2); color: var(--ink); font-weight: 600; }
    article { display: grid; gap: 32px; max-width: 720px; }
    .head { display: grid; gap: 10px; }
    section { display: grid; gap: 12px; }
    section p { color: var(--ink); max-width: 66ch; }
    .ask { padding: 20px 24px; border-radius: var(--radius); background: var(--surface); }
    .ask a, article a { color: var(--accent); text-decoration: underline; font-weight: 560; }
    .sk { height: 40px; width: 60%; }
    .sk.w { height: 200px; width: 100%; }
    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; }
      .side { position: static; display: flex; overflow-x: auto; scrollbar-width: none; }
      .side a { flex: none; }
    }
  `,
})
export class PolicyPage {
  protected readonly policies = inject(PoliciesService);
  private readonly seo = inject(SeoService);
  readonly slug = input.required<string>();

  protected readonly policy = computed(() => this.policies.bySlug(this.slug()));
  protected readonly updated = computed(() => {
    const d = this.policy()?.updated;
    return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  });

  constructor() {
    effect(() => {
      const p = this.policy();
      if (p) this.seo.set({ title: p.title, description: p.summary, path: `/policies/${p.slug}` });
    });
  }
}
