import { httpResource } from '@angular/common/http';
import { Injectable, computed } from '@angular/core';

export interface Policy {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

/** Policies from public/data/policies.json — the same file the sitemap reads. */
@Injectable({ providedIn: 'root' })
export class PoliciesService {
  private readonly res = httpResource<Policy[]>(() => 'data/policies.json');
  readonly all = computed(() => (this.res.hasValue() ? this.res.value() : []));
  readonly loading = computed(() => this.res.isLoading());

  bySlug(slug: string): Policy | undefined {
    return this.all().find((p) => p.slug === slug);
  }
}
