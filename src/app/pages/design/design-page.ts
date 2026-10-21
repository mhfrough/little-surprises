import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BasketBuilder } from '../../builder/basket-builder';
import { RIBBONS } from '../../core/catalog';
import { Theme, ThemeService } from '../../core/theme.service';
import { ReviewsService } from '../../core/reviews.service';
import { CatalogService } from '../../core/catalog.service';
import { contrast } from '../../core/contrast';
import { Product } from '../../core/models';
import { BagStore } from '../../core/stores';
import { CorporateSection, NewsletterSection, ReadyBasketsSection, ReviewsSection, SocialSection } from '../../sections/more-sections';
import { FavouritesSection } from '../../sections/favourites-section';
import { HeroSlider } from '../../sections/hero-slider';
import { OccasionsSection } from '../../sections/occasions-section';
import { TwoWaysSection } from '../../sections/two-ways-section';
import { BrandMark } from '../../shared/brand-mark';
import { CartLine } from '../../shared/cards/cart-line';
import { CategoryCard } from '../../shared/cards/category-card';
import { OccasionTile } from '../../shared/cards/occasion-tile';
import { ProductCard } from '../../shared/cards/product-card';
import { ReadyBasketCard } from '../../shared/cards/ready-basket-card';
import { ReviewCard } from '../../shared/cards/review-card';
import { GiftTag } from '../../shared/gift-tag';
import { I, IconName } from '../../shared/icons';
import { MoneyPipe } from '../../shared/money.pipe';
import { QtyStepper } from '../../shared/qty-stepper';
import { Rating } from '../../shared/rating';
import { RevealDirective } from '../../shared/reveal.directive';


interface Swatch {
  name: string;
  token: string;
  light: string;
  dark: string;
  role: string;
  /** contrast is measured against this token's light value */
  on?: string;
}

const GROUND_LIGHT = '#ffffff';

@Component({
  selector: 'app-design-page',
  imports: [
    RouterLink,
    LucideAngularModule,
    MoneyPipe,
    BrandMark,
    GiftTag,
    Rating,
    QtyStepper,
    ProductCard,
    OccasionTile,
    CategoryCard,
    ReadyBasketCard,
    ReviewCard,
    CartLine,
    BasketBuilder,
    HeroSlider,
    OccasionsSection,
    FavouritesSection,
    TwoWaysSection,
    ReadyBasketsSection,
    CorporateSection,
    ReviewsSection,
    SocialSection,
    NewsletterSection,
    RevealDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-page.html',
  styleUrl: './design-page.scss',
})
export class DesignPage {
  protected readonly I = I;
  protected readonly bag = inject(BagStore);

  protected readonly chapters = [
    { id: 'colour', label: 'Colour' },
    { id: 'type', label: 'Type' },
    { id: 'layout', label: 'Layout' },
    { id: 'icons', label: 'Icons & motion' },
    { id: 'controls', label: 'Controls' },
    { id: 'tag', label: 'Gift tag' },
    { id: 'cards', label: 'Cards' },
    { id: 'builder', label: 'Builder' },
    { id: 'sections', label: 'Sections' },
  ];

  // ---- theme preview ------------------------------------------------------
  private readonly themes = inject(ThemeService);
  protected readonly theme = this.themes.theme;

  setTheme(t: Theme): void {
    this.themes.set(t);
  }

  // ---- colour -------------------------------------------------------------
  protected readonly colourGroups: { title: string; note: string; swatches: Swatch[] }[] = [
    {
      title: 'Ground and surfaces',
      note: 'Surfaces part by a step in tone. No borders, no resting shadows.',
      swatches: [
        { name: 'Ground', token: '--ground', light: '#ffffff', dark: '#121012', role: 'Page background' },
        { name: 'Surface', token: '--surface', light: '#faf6f7', dark: '#1a1619', role: 'Panels, rows, summary' },
        { name: 'Surface 2', token: '--surface-2', light: '#f3ecee', dark: '#241e22', role: 'Image wells, fields, chips' },
        { name: 'Surface 3', token: '--surface-3', light: '#e9dfe3', dark: '#30282d', role: 'Hover, pressed, tracks' },
      ],
    },
    {
      title: 'Ink',
      note: 'Running text is always full ink. Grey is for notes only.',
      swatches: [
        { name: 'Ink', token: '--ink', light: '#1f1418', dark: '#f6eff2', role: 'Headings, body', on: GROUND_LIGHT },
        { name: 'Ink 2', token: '--ink-2', light: '#5e4d54', dark: '#c4b5bc', role: 'Supporting text', on: GROUND_LIGHT },
        { name: 'Ink 3', token: '--ink-3', light: '#7d6a72', dark: '#9d8d95', role: 'Captions, counts', on: GROUND_LIGHT },
      ],
    },
    {
      title: 'Brand',
      note: 'Wine is the action colour. Rose is the ribbon: fills only, never small text.',
      swatches: [
        { name: 'Wine', token: '--accent', light: '#7a0f3d', dark: '#f2a7bf', role: 'Primary action, selection', on: GROUND_LIGHT },
        { name: 'Rose', token: '--rose', light: '#d86b8a', dark: '#e48aa4', role: 'Ribbon, mark, focus ring', on: GROUND_LIGHT },
        { name: 'Blush field', token: '--field', light: '#f7e8ec', dark: '#2b1820', role: 'Whole-section field' },
        { name: 'Plum field', token: '--field-deep', light: '#2a0a18', dark: '#1c0a12', role: 'Footer, corporate' },
        { name: 'Sage', token: '--sage', light: '#6e6d4f', dark: '#a9a77f', role: 'The leaf in the logo', on: GROUND_LIGHT },
        { name: 'Kraft', token: '--kraft', light: '#cfae8a', dark: '#c4a27e', role: 'Kraft wrap, twine' },
      ],
    },
    {
      title: 'Signal',
      note: 'Never colour alone: every state also has words or an icon.',
      swatches: [
        { name: 'Positive', token: '--positive', light: '#3e6b35', dark: '#9ccf8f', role: 'Added, in stock, on', on: GROUND_LIGHT },
        { name: 'Negative', token: '--negative', light: '#b3261e', dark: '#ff8a80', role: 'Errors, sold out', on: GROUND_LIGHT },
      ],
    },
  ];

  ratio(s: Swatch): string | null {
    return s.on ? contrast(s.light, s.on).toFixed(1) + ':1' : null;
  }

  // ---- type ---------------------------------------------------------------
  protected readonly typeScale = [
    { role: 'Display', cls: 't-display', spec: '44 → 88 · 680 · −0.038em · 0.98', sample: 'Wrapped by hand.' },
    { role: 'Title', cls: 't-title', spec: '30 → 46 · 660 · −0.026em · 1.06', sample: 'Two ways to give' },
    { role: 'Headline', cls: 't-headline', spec: '22 · 620 · −0.014em · 1.25', sample: 'Choose a basket' },
    { role: 'Body', cls: 't-body', spec: '17 · 400 · 1.55', sample: 'Pick a ready-made basket for any occasion, or build your own: the basket, the wrap, the ribbon, every treat inside and a note in our handwriting.' },
    { role: 'Small', cls: 't-small', spec: '14 · 400 · 1.45', sample: 'Holds up to 6 treats · Same-day delivery before 2 pm' },
  ];

  // ---- layout -------------------------------------------------------------
  protected readonly spaces = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
  protected readonly radii = [
    { name: 'Small', token: '--radius-sm', px: 12, use: 'Fields, thumbnails' },
    { name: 'Card', token: '--radius', px: 20, use: 'Cards, media' },
    { name: 'Field', token: '--radius-lg', px: 32, use: 'Section panels, hero' },
    { name: 'Capsule', token: '--radius-pill', px: 999, use: 'Every button and chip' },
  ];

  // ---- icons & motion -----------------------------------------------------
  protected readonly iconNames = Object.keys(I) as IconName[];
  protected readonly motionKey = signal(0);
  protected readonly motion = [
    { name: 'Fast', token: '--dur-fast', value: '160ms', use: 'Hover, press, colour' },
    { name: 'Base', token: '--dur', value: '260ms', use: 'Toggles, selection, sheets' },
    { name: 'Slow', token: '--dur-slow', value: '520ms', use: 'Entrances, image zoom' },
    { name: 'Stagger', token: '--stagger', value: '70ms', use: 'Between parts of a section' },
  ];

  // ---- controls -----------------------------------------------------------
  protected readonly loading = signal(false);
  protected readonly qty = signal(2);
  protected readonly seg = signal('All');
  protected readonly chips = signal<string[]>(['Under Rs 3,000']);
  protected readonly switchA = signal(true);
  protected readonly noteDemo = signal('');

  fakeLoad(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1600);
  }

  toggleChip(c: string): void {
    this.chips.update((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  }

  // ---- gift tag -----------------------------------------------------------
  protected readonly ribbons = RIBBONS;
  protected readonly tagTo = signal('Ammi');
  protected readonly tagNote = signal('Happy birthday. Thank you for everything.');
  protected readonly tagFrom = signal('Love, Sara');
  protected readonly tagRibbon = signal(RIBBONS[0].hex);

  // ---- cards --------------------------------------------------------------
  protected readonly catalog = inject(CatalogService);
  protected readonly productStates = computed(() => {
    const ps = this.catalog.products();
    const states: { label: string; product: Product | undefined; wished?: boolean }[] = [
      { label: 'Default', product: ps.find((p) => p.inStock && p.categoryId === 'chocolates' && !p.compareAtPrice) },
      { label: 'On sale', product: ps.find((p) => p.inStock && p.compareAtPrice) },
      { label: 'Saved to wishlist', product: ps.find((p) => p.inStock && p.categoryId === 'flowers'), wished: true },
      { label: 'Sold out', product: ps.find((p) => !p.inStock) },
    ];
    return states.filter((s): s is { label: string; product: Product; wished?: boolean } => !!s.product);
  });
  protected readonly occasions = computed(() => this.catalog.occasions().slice(0, 5));
  protected readonly categories = computed(() => this.catalog.categories().slice(0, 3));
  protected readonly readyBasket = computed(() => this.catalog.inCategory('hampers').find((p) => p.inStock));
  protected readonly cartProduct = computed(() => this.catalog.inCategory('flowers').at(0));
  private readonly reviewsData = inject(ReviewsService);
  protected readonly review = computed(() => this.reviewsData.all().find((r) => r.rating === 5));
  protected readonly cartQtyA = signal(1);
  protected readonly cartQtyB = signal(2);
}
