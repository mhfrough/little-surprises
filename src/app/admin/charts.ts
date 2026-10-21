import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface Datum {
  label: string;
  value: number;
}

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : `${n}`;

/** Round the axis up to a clean number (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

/**
 * Single-series bars, one accent hue (no legend: the panel title names it).
 * Horizontal for category names, vertical (columns) for time or ordered bins.
 * Every bar is its own hover/focus target with a tooltip; values also sit at
 * the bar tip (horizontal) or in the table view, so nothing is hover-only.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure [attr.aria-label]="label()">
      @if (orientation() === 'horizontal') {
        <ul class="h" role="list">
          @for (d of data(); track d.label; let i = $index) {
            <li class="h-row" tabindex="0" (pointerenter)="hover.set(i)" (pointerleave)="hover.set(-1)" (focus)="hover.set(i)" (blur)="hover.set(-1)"
              [class.is-hot]="hover() === i" [attr.aria-label]="d.label + ': ' + fmt(d.value)">
              <span class="h-label">{{ d.label }}</span>
              <span class="h-track"><span class="h-bar" [style.width.%]="pct(d.value)"></span></span>
              <span class="h-val t-num">{{ fmt(d.value) }}</span>
            </li>
          }
        </ul>
      } @else {
        <div class="v" [style.height.px]="height()">
          <div class="v-grid" aria-hidden="true">
            @for (t of ticks(); track t) {
              <span class="v-tick" [style.bottom.%]="(t / max()) * 100"><span>{{ compact(t) }}</span></span>
            }
          </div>
          <div class="v-cols">
            @for (d of data(); track d.label; let i = $index) {
              <div class="v-col" tabindex="0" (pointerenter)="hover.set(i)" (pointerleave)="hover.set(-1)" (focus)="hover.set(i)" (blur)="hover.set(-1)"
                [attr.aria-label]="d.label + ': ' + fmt(d.value)" [class.is-hot]="hover() === i">
                <span class="v-bar" [style.height.%]="pct(d.value)"></span>
                @if (hover() === i) {
                  <span class="tip" role="status"><strong class="t-num">{{ fmt(d.value) }}</strong><span>{{ d.label }}</span></span>
                }
              </div>
            }
          </div>
        </div>
        <div class="v-axis" aria-hidden="true">
          @for (d of data(); track d.label; let i = $index) {
            <span [class.dim]="data().length > 8 && i % 2 === 1">{{ d.label }}</span>
          }
        </div>
      }
      <details class="table-view">
        <summary>Show as table</summary>
        <table>
          <thead><tr><th scope="col">{{ labelHeader() }}</th><th scope="col" class="num">{{ valueHeader() }}</th></tr></thead>
          <tbody>
            @for (d of data(); track d.label) { <tr><td>{{ d.label }}</td><td class="num">{{ fmt(d.value) }}</td></tr> }
          </tbody>
        </table>
      </details>
    </figure>
  `,
  styles: `
    figure { margin: 0; display: grid; gap: 10px; min-width: 0; }
    /* horizontal */
    .h { display: grid; gap: 6px; list-style: none; margin: 0; padding: 0; }
    .h-row { display: grid; grid-template-columns: minmax(80px, 34%) minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 3px 4px; border-radius: 8px; font-size: 0.8125rem; outline: none; }
    .h-row.is-hot, .h-row:focus-visible { background: var(--surface-2); }
    .h-label { color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-track { height: 14px; display: flex; align-items: center; }
    .h-bar { display: block; height: 14px; min-width: 2px; background: var(--accent); border-radius: 0 4px 4px 0; transition: width var(--dur-slow) var(--ease-out), filter var(--dur-fast); }
    .h-row.is-hot .h-bar { filter: brightness(1.15); }
    .h-val { color: var(--ink); font-weight: 600; min-width: 3ch; text-align: right; }
    /* vertical */
    .v { position: relative; margin-left: 32px; }
    .v-grid { position: absolute; inset: 0; }
    .v-tick { position: absolute; left: 0; right: 0; border-top: 1px solid var(--surface-3); }
    .v-tick span { position: absolute; right: calc(100% + 8px); top: -0.6em; font-size: 0.6875rem; color: var(--ink-3); font-variant-numeric: tabular-nums; }
    .v-cols { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
    .v-col { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; justify-content: center; outline: none; border-radius: 6px; }
    .v-col.is-hot, .v-col:focus-visible { background: color-mix(in srgb, var(--accent) 6%, transparent); }
    .v-bar { display: block; width: min(24px, 70%); min-height: 2px; background: var(--accent); border-radius: 4px 4px 0 0; transition: height var(--dur-slow) var(--ease-out); }
    .tip {
      position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); z-index: 2; white-space: nowrap;
      display: grid; padding: 6px 10px; border-radius: 8px; background: var(--ink); color: var(--ground); font-size: 0.75rem; box-shadow: var(--shadow-float); pointer-events: none;
    }
    .tip strong { font-size: 0.875rem; }
    .v-col:first-child .tip { left: 0; transform: none; }
    .v-col:last-child .tip { left: auto; right: 0; transform: none; }
    .v-axis { display: flex; gap: 2px; margin-left: 32px; font-size: 0.6875rem; color: var(--ink-3); }
    .v-axis span { flex: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: clip; }
    .v-axis .dim { visibility: hidden; }
    /* table view */
    .table-view summary { cursor: pointer; font-size: 0.75rem; color: var(--ink-3); width: max-content; }
    .table-view table { width: 100%; margin-top: 8px; border-collapse: collapse; font-size: 0.8125rem; }
    .table-view th, .table-view td { padding: 4px 6px; border-bottom: 1px solid var(--surface-2); text-align: left; }
    .table-view .num { text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class BarChart {
  readonly data = input.required<Datum[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly height = input(180);
  readonly label = input('');
  readonly labelHeader = input('Label');
  readonly valueHeader = input('Value');
  readonly format = input<'number' | 'money'>('number');

  protected readonly hover = signal(-1);
  protected readonly compact = compact;
  protected readonly max = computed(() => niceMax(Math.max(0, ...this.data().map((d) => d.value))));
  protected readonly ticks = computed(() => [0, this.max() / 2, this.max()]);

  pct(v: number): number {
    return (v / this.max()) * 100;
  }

  fmt(v: number): string {
    return this.format() === 'money' ? `Rs ${v.toLocaleString('en-PK')}` : v.toLocaleString('en-PK');
  }
}

/** A KPI tile: label, value, an optional note under it. */
@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="label">{{ label() }}</span>
    <strong class="value">{{ value() }}</strong>
    @if (note()) { <span class="note" [class.is-alert]="alert()">{{ note() }}</span> }
  `,
  styles: `
    :host { display: grid; gap: 4px; align-content: start; padding: 18px 20px; border-radius: var(--radius); background: var(--surface); min-width: 0; }
    .label { font-size: 0.8125rem; color: var(--ink-2); }
    .value { font-size: 1.875rem; font-weight: 680; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .note { font-size: 0.75rem; color: var(--ink-3); }
    .note.is-alert { color: var(--accent); font-weight: 600; }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly note = input('');
  readonly alert = input(false);
}
