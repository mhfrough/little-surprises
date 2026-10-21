import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Staggered entrance for the parts of a section. Children marked
 * `data-reveal` rise in once when the host scrolls into view. The host is
 * only "armed" (hidden) once this runs, so content never stays hidden
 * without script.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private io?: IntersectionObserver;

  ngOnInit(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (typeof IntersectionObserver === 'undefined') return;

    host.classList.add('reveal-armed');

    this.io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          // Index now, not at init: child views may render after this directive.
          host.querySelectorAll<HTMLElement>('[data-reveal]').forEach((child, i) => {
            if (!child.style.getPropertyValue('--i')) child.style.setProperty('--i', String(Math.min(i, 8)));
          });
          host.classList.add('is-in');
          this.io?.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    this.io.observe(host);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
