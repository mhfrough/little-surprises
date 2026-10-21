import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Review } from '../../core/models';
import { Rating } from '../rating';

@Component({
  selector: 'app-review-card',
  imports: [Rating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <app-rating [value]="review().rating" [showValue]="false" [size]="16" />
      <strong class="title clamp-1">{{ review().title }}</strong>
      <blockquote class="clamp-3 long">{{ review().text }}</blockquote>
      <figcaption>
        <span class="avatar" aria-hidden="true">{{ initial() }}</span>
        <span><strong>{{ review().name }}</strong><span class="date">{{ review().city }} · {{ date() }}</span></span>
      </figcaption>
    </figure>
  `,
  styles: `
    :host { display: block; height: 100%; }
    figure {
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 16px;
      height: 100%;
      padding: 28px;
      border-radius: var(--radius);
      background: var(--surface);
    }
    blockquote.long { -webkit-line-clamp: 6; line-clamp: 6; }
    blockquote { margin: 0; font-size: 1.125rem; line-height: 1.5; letter-spacing: -0.01em; text-wrap: pretty; }
    figcaption { display: flex; align-items: center; gap: 12px; font-size: var(--text-small); }
    figcaption > span:last-child { display: grid; }
    strong { font-weight: 600; }
    .date { color: var(--ink-3); }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--field);
      color: var(--field-ink);
      font-weight: 650;
    }
  `,
})
export class ReviewCard {
  readonly review = input.required<Review>();
  protected readonly initial = computed(() => this.review().name.charAt(0));
  protected readonly date = computed(() =>
    new Date(this.review().date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
  );
}
