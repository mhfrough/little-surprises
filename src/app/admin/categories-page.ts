import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AdminCatalogStore } from '../core/admin-catalog.store';
import { CatalogService } from '../core/catalog.service';
import { Category } from '../core/models';
import { BagStore } from '../core/stores';
import { I } from '../shared/icons';

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Draft {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  image: string;
}

/** Categories with their product counts; add, rename, re-picture, delete (only when empty). */
@Component({
  selector: 'app-categories-page',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-page">
      <header class="adm-head">
        <div>
          <h1>Categories</h1>
          <p>{{ catalog.categories().length }} categories · shown in the shop menu, filters and footer</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" (click)="startNew()"><lucide-icon [img]="I.Plus" [size]="16" [strokeWidth]="2.2" /> New category</button>
      </header>

      <div class="layout">
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th scope="col" style="width:56px"><span class="visually-hidden">Picture</span></th><th scope="col">Category</th><th scope="col">Web address</th><th scope="col" class="num">Products</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              @for (c of catalog.categories(); track c.id) {
                <tr [class.is-editing]="draft()?.id === c.id">
                  <td><img class="thumb" [src]="c.image ?? 'brand/placeholder.svg'" alt="" width="44" height="44" /></td>
                  <td><strong>{{ c.name }}</strong><span class="sub clamp-1">{{ c.description }}</span></td>
                  <td><a [routerLink]="['/category', c.slug]" target="_blank" class="mono">/category/{{ c.slug }}</a></td>
                  <td class="num"><a [routerLink]="['/admin/products']" class="count">{{ c.count }}</a></td>
                  <td class="row-actions">
                    <button type="button" class="adm-icon-btn" (click)="edit(c)" [attr.aria-label]="'Edit ' + c.name"><lucide-icon [img]="I.Pencil" [size]="16" [strokeWidth]="2" /></button>
                    <button type="button" class="adm-icon-btn is-danger" (click)="remove(c)" [attr.aria-label]="'Delete ' + c.name"
                      [title]="c.count ? 'Move or delete its ' + c.count + ' products first' : 'Delete'"><lucide-icon [img]="I.Trash2" [size]="16" [strokeWidth]="2" /></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (draft(); as d) {
          <form class="adm-panel editor" (submit)="save($event)" novalidate>
            <header><h2>{{ d.id ? 'Edit category' : 'New category' }}</h2>
              <button type="button" class="adm-icon-btn" (click)="draft.set(null)" aria-label="Close"><lucide-icon [img]="I.X" [size]="16" [strokeWidth]="2" /></button></header>
            <div class="field"><label for="c-name">Name</label>
              <input id="c-name" class="input" required maxlength="40" [value]="d.name" (input)="setName($any($event.target).value)" /></div>
            <div class="field"><label for="c-slug">Web address</label>
              <input id="c-slug" class="input mono" required pattern="[a-z0-9-]+" [value]="d.slug" [disabled]="!!d.id" (input)="patch({ slug: slugify($any($event.target).value) })" />
              <span class="field-hint">{{ d.id ? 'Fixed once created, so links keep working.' : '/category/' + (d.slug || '…') }}</span></div>
            <div class="field"><label for="c-desc">Short description</label>
              <input id="c-desc" class="input" maxlength="80" [value]="d.description" (input)="patch({ description: $any($event.target).value })" /></div>
            <div class="field"><label for="c-img">Picture address <span class="t-note">(optional — else the first product's)</span></label>
              <input id="c-img" class="input mono" [value]="d.image" (input)="patch({ image: $any($event.target).value })" /></div>
            @if (error()) { <p class="notice is-negative" role="alert"><lucide-icon [img]="I.CircleAlert" [size]="18" [strokeWidth]="2" /> {{ error() }}</p> }
            <div class="row">
              <button class="btn btn-primary btn-sm"><lucide-icon [img]="I.Save" [size]="16" [strokeWidth]="2" /> {{ d.id ? 'Save' : 'Create' }}</button>
              <button type="button" class="btn btn-plain btn-sm" (click)="draft.set(null)">Cancel</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: start; }
    .editor { width: 340px; position: sticky; top: 72px; }
    .editor .input { background: var(--ground); }
    .sub { display: block; font-size: 0.75rem; color: var(--ink-3); max-width: 320px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.8125rem; color: var(--ink-2); }
    .count { font-weight: 650; color: var(--accent); }
    .row-actions { white-space: nowrap; text-align: right; }
    .row { display: flex; gap: 8px; }
    tr.is-editing { background: color-mix(in srgb, var(--accent) 6%, transparent); }
    @media (max-width: 1000px) { .layout { grid-template-columns: minmax(0, 1fr); } .editor { width: auto; position: static; } }
  `,
})
export class CategoriesPage {
  protected readonly I = I;
  protected readonly catalog = inject(CatalogService);
  private readonly store = inject(AdminCatalogStore);
  private readonly bag = inject(BagStore);
  protected readonly slugify = slugify;

  protected readonly draft = signal<Draft | null>(null);
  protected readonly error = signal('');
  private readonly taken = computed(() => new Set(this.catalog.categories().map((c) => c.slug)));

  startNew(): void {
    this.error.set('');
    this.draft.set({ id: null, name: '', slug: '', description: '', image: '' });
  }

  edit(c: Category): void {
    this.error.set('');
    const raw = this.store.overrides().categories[c.id];
    this.draft.set({ id: c.id, name: c.name, slug: c.slug, description: c.description, image: raw?.image ?? '' });
  }

  patch(p: Partial<Draft>): void {
    this.draft.update((d) => (d ? { ...d, ...p } : d));
  }

  setName(name: string): void {
    this.draft.update((d) => (d ? { ...d, name, slug: d.id ? d.slug : slugify(name) } : d));
  }

  save(e: SubmitEvent): void {
    e.preventDefault();
    const d = this.draft();
    if (!d) return;
    if (!d.name.trim() || !d.slug) return this.error.set('Please add a name and a web address.');
    if (!d.id && this.taken().has(d.slug)) return this.error.set('Another category already uses this web address.');
    const existing = this.catalog.categories().find((c) => c.id === d.id);
    this.store.saveCategory({
      id: d.id ?? d.slug,
      slug: d.slug,
      name: d.name.trim(),
      description: d.description.trim(),
      image: d.image.trim() || null,
      count: existing?.count ?? 0,
    });
    this.bag.notify(d.id ? `${d.name} saved` : `${d.name} created`);
    this.draft.set(null);
  }

  remove(c: Category): void {
    if (c.count) {
      alert(`“${c.name}” still has ${c.count} products. Move them to another category or delete them first.`);
      return;
    }
    if (!confirm(`Delete the category “${c.name}”?`)) return;
    this.store.deleteCategory(c.id);
    this.bag.notify(`${c.name} deleted`);
  }
}
