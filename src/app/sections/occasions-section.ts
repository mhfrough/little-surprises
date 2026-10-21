import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PIC, img } from '../core/catalog';
import { CatalogService } from '../core/catalog.service';
import { CategoryCard } from '../shared/cards/category-card';
import { OccasionTile } from '../shared/cards/occasion-tile';
import { I } from '../shared/icons';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-occasions-section',
  imports: [LucideAngularModule, OccasionTile, CategoryCard, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-photo', '[style.--bg-photo]': 'bg' },
  template: `
    <section class="section" appReveal aria-labelledby="occ-title">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 id="occ-title" class="t-title" data-reveal>Shop by occasion</h2>
            <p class="t-muted" data-reveal>Birthdays, new babies, Eid, or just because.</p>
          </div>
          <div class="arrows">
            <button type="button" class="btn btn-icon" aria-label="Scroll occasions left" (click)="scroll(-1)">
              <lucide-icon [img]="I.ChevronLeft" [size]="20" [strokeWidth]="2" />
            </button>
            <button type="button" class="btn btn-icon" aria-label="Scroll occasions right" (click)="scroll(1)">
              <lucide-icon [img]="I.ChevronRight" [size]="20" [strokeWidth]="2" />
            </button>
          </div>
        </div>
      </div>
      <div class="rail-wrap container">
        <ul #rail class="rail" role="list" data-reveal>
          @for (o of catalog.occasions(); track o.id) {
            <li><app-occasion-tile [occasion]="o" /></li>
          }
        </ul>
      </div>

      <div class="container cats">
        <h3 class="t-headline" data-reveal>Or browse the shop</h3>
        <div class="cat-grid" data-reveal>
          @for (c of catalog.categories(); track c.id) {
            <app-category-card [category]="c" />
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .arrows { display: flex; gap: 8px; }
    .rail {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: clamp(140px, 15vw, 200px);
      gap: 20px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      padding-bottom: 4px;
    }
    .rail::-webkit-scrollbar { display: none; }
    .rail li { scroll-snap-align: start; }
    .cats { display: grid; gap: 20px; margin-top: 72px; }
    .cat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 900px) { .cat-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .cat-grid { grid-template-columns: 1fr; } .arrows { display: none; } }
  `,
})
export class OccasionsSection {
  protected readonly bg = `url("${img(PIC.kraftFlatlay, 1800)}")`;
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');

  scroll(dir: number): void {
    const el = this.rail().nativeElement;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }
}
