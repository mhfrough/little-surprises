import { httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Review } from './models';

const MINE_KEY = 'gw-my-reviews';
const HELPFUL_KEY = 'gw-helpful';
const MOD_KEY = 'ls-review-mod';

export type ReviewStatus = 'pending' | 'published' | 'hidden';
export interface ModeratedReview extends Review {
  status: ReviewStatus;
}

export interface RatingSummary {
  average: number;
  count: number;
  /** index 0 = 1 star … index 4 = 5 stars */
  counts: number[];
}

export type ReviewSort = 'newest' | 'highest' | 'lowest' | 'helpful';

/**
 * Reviews from public/data/reviews.json (sample data until the backend's
 * reviews table exists), plus reviews written on this device, which show to
 * their author straight away marked "awaiting approval".
 */
@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly res = httpResource<{ sample: boolean; reviews: Review[] }>(() => 'data/reviews.json');
  readonly loading = computed(() => this.res.isLoading());
  readonly error = computed(() => this.res.error());

  private readonly mine = signal<Review[]>(read(MINE_KEY, []));
  /** review ids this device found helpful */
  readonly helpfulIds = signal<string[]>(read(HELPFUL_KEY, []));

  /** operator decisions: approve a pending review, hide any review */
  private readonly moderation = signal<Record<string, 'approved' | 'hidden'>>(read(MOD_KEY, {}));

  /** Every review with its moderation state — for the operator portal. */
  readonly moderated = computed<ModeratedReview[]>(() => {
    const base = this.res.hasValue() ? this.res.value().reviews : [];
    const bumped = new Set(this.helpfulIds());
    const mod = this.moderation();
    return [...this.mine(), ...base].map((r) => {
      const helpful = bumped.has(r.id) ? r.helpful + 1 : r.helpful;
      const status: ReviewStatus = mod[r.id] === 'hidden' ? 'hidden' : r.mine && mod[r.id] !== 'approved' ? 'pending' : 'published';
      return { ...r, helpful, status, mine: status === 'pending' ? r.mine : false };
    });
  });

  /** What the shop shows: published reviews, plus this device's own pending ones. */
  readonly all = computed<Review[]>(() => {
    const mineIds = new Set(this.mine().map((r) => r.id));
    return this.moderated()
      .filter((r) => r.status === 'published' || (r.status === 'pending' && mineIds.has(r.id)))
      .map(({ status, ...r }) => r);
  });

  readonly pendingCount = computed(() => this.moderated().filter((r) => r.status === 'pending').length);

  moderate(id: string, action: 'approved' | 'hidden' | 'reset'): void {
    this.moderation.update((m) => {
      const { [id]: _, ...rest } = m;
      return action === 'reset' ? rest : { ...rest, [id]: action };
    });
    write(MOD_KEY, this.moderation());
  }

  forProduct(productId: string): Review[] {
    return this.all().filter((r) => r.productId === productId);
  }

  summary(list: Review[]): RatingSummary {
    const counts = [0, 0, 0, 0, 0];
    for (const r of list) counts[r.rating - 1]++;
    const count = list.length;
    const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { average: Math.round(average * 10) / 10, count, counts };
  }

  sort(list: Review[], by: ReviewSort): Review[] {
    const out = [...list];
    switch (by) {
      case 'highest':
        return out.sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date));
      case 'lowest':
        return out.sort((a, b) => a.rating - b.rating || b.date.localeCompare(a.date));
      case 'helpful':
        return out.sort((a, b) => b.helpful - a.helpful || b.date.localeCompare(a.date));
      default:
        return out.sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || b.date.localeCompare(a.date));
    }
  }

  add(r: Omit<Review, 'id' | 'date' | 'verified' | 'helpful' | 'mine'>): void {
    const review: Review = {
      ...r,
      id: `mine-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      verified: false,
      helpful: 0,
      mine: true,
    };
    this.mine.update((m) => [review, ...m]);
    write(MINE_KEY, this.mine());
  }

  markHelpful(id: string): void {
    if (this.helpfulIds().includes(id)) return;
    this.helpfulIds.update((h) => [...h, id]);
    write(HELPFUL_KEY, this.helpfulIds());
  }
}

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — kept for this visit */
  }
}
