import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CorporateSection, ReadyBasketsSection, ReviewsSection, SocialSection } from '../../sections/more-sections';
import { FavouritesSection } from '../../sections/favourites-section';
import { HeroSlider } from '../../sections/hero-slider';
import { SeoService } from '../../core/seo.service';
import { OccasionsSection } from '../../sections/occasions-section';
import { TwoWaysSection } from '../../sections/two-ways-section';

/** The home page, assembled from the sections documented on /design. */
@Component({
  selector: 'app-home-page',
  imports: [HeroSlider, OccasionsSection, FavouritesSection, TwoWaysSection, ReadyBasketsSection, CorporateSection, ReviewsSection, SocialSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="main">
      <app-hero-slider />
      <app-occasions-section />
      <app-favourites-section />
      <app-two-ways-section />
      <app-ready-baskets-section />
      <app-corporate-section />
      <app-reviews-section />
      <app-social-section />
    </main>
  `,
})
export class HomePage {
  constructor() {
    inject(SeoService).set({ title: 'Little Surprises · Personalized gifts delivered in Karachi', path: '/' });
  }
}
