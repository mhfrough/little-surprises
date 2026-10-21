import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface Datum {
  label: string;
  value: number;
}

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : `${n}`;

/** A clean tick step (1, 2, 2.5, 5 × 10ⁿ) at or above v. */
function niceStep(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p;
}

/**
 * Single-series bars, one accent hue (no legend: the panel title names it).
 * Horizontal for category names, vertical (columns) for time or ordered bins.
 * Every bar is its own hover/focus target with a tooltip. Horizontal bars carry
 * their value at the tip; columns label only the peak and the latest, the rest
 * live in the axis, tooltip and each column's aria-label.
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
              <span class="h-label" [title]="d.label">{{ d.label }}</span>
              <span class="h-track" [style.--p]="pct(d.value) / 100">
                <span class="h-bar"></span><span class="h-val t-num">{{ fmt(d.value) }}</span>
              </span>
            </li>
          }
        </ul>
      } @else {
        <div class="v" [style.height.px]="height()">
          <div class="v-grid" aria-hidden="true">
            @for (t of ticks(); track t) {
              <span class="v-tick" [class.base]="t === 0" [style.bottom.%]="(t / max()) * 100"><span>{{ compact(t) }}</span></span>
            }
          </div>
          <div class="v-cols">
            @for (d of data(); track d.label; let i = $index; let last = $last) {
              <div class="v-col" tabindex="0" (pointerenter)="hover.set(i)" (pointerleave)="hover.set(-1)" (focus)="hover.set(i)" (blur)="hover.set(-1)"
                [attr.aria-label]="d.label + ': ' + fmt(d.value) + (last && partialLast() ? ' so far' : '')" [class.is-hot]="hover() === i">
                <span class="v-bar" [class.partial]="last && partialLast()" [style.height.%]="pct(d.value)" [style.--p]="pct(d.value) / 100">
                  @if (hover() !== i && (i === peak() || last)) { <span class="cap t-num">{{ compact(d.value) }}</span> }
                </span>
                @if (hover() === i) {
                  <span class="tip" role="status"><strong class="t-num">{{ fmt(d.value) }}</strong><span>{{ d.label }}{{ last && partialLast() ? ' · so far' : '' }}</span></span>
                }
              </div>
            }
          </div>
        </div>
        <div class="v-axis" aria-hidden="true">
          @for (d of data(); track d.label; let i = $index) {
            <span [class.dim]="data().length > 12 && i % 2 === 1">{{ d.label }}</span>
          }
        </div>
      }
    </figure>
  `,
  styles: `
    figure { margin: 0; display: grid; gap: 10px; min-width: 0; }
    /* horizontal: label column sized to the longest label (capped), value rides the bar tip */
    .h { display: grid; grid-template-columns: fit-content(40%) minmax(0, 1fr); gap: 4px 14px; list-style: none; margin: 0; padding: 0; }
    .h-row { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; min-height: 30px; padding: 0 8px; border-radius: 8px; font-size: 0.8125rem; outline: none; }
    .h-row.is-hot, .h-row:focus-visible { background: var(--surface-2); }
    .h-label { color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .h-track { display: flex; align-items: center; gap: 8px; min-width: 0; }
    /* 100% leaves room for the value after the tip */
    .h-bar {
      flex: none; width: calc((100% - 7ch) * var(--p)); min-width: 3px; height: 10px; border-radius: 0 4px 4px 0;
      background: var(--chart-ramp) left / calc(100% / max(var(--p), 0.01)) 100% no-repeat;
      transition: width var(--dur-slow) var(--ease-out), filter var(--dur-fast);
    }
    .h-row.is-hot .h-bar { filter: brightness(1.12) saturate(1.1); }
    .h-val { color: var(--ink); font-weight: 600; white-space: nowrap; }
    /* vertical */
    /* One sequential ramp across the whole plot (light at the baseline, full accent at the axis max);
       each bar shows its own slice of it, so colour agrees with length. */
    :host {
      --chart-fill: color-mix(in srgb, var(--accent) 72%, var(--surface));
      --chart-lo: color-mix(in srgb, var(--accent) 30%, var(--surface));
      --chart-ramp: linear-gradient(90deg, var(--chart-lo), var(--accent));
    }
    .v { position: relative; margin: 18px 0 0 34px; }
    .v-grid { position: absolute; inset: 0; }
    .v-tick { position: absolute; left: 0; right: 0; border-top: 1px solid var(--surface-2); }
    .v-tick.base { border-top-color: var(--surface-3); }
    .v-tick span { position: absolute; right: calc(100% + 8px); top: -0.6em; font-size: 0.6875rem; color: var(--ink-3); font-variant-numeric: tabular-nums; }
    .v-cols { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
    .v-col { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; justify-content: center; outline: none; border-radius: 6px 6px 0 0; }
    .v-col.is-hot, .v-col:focus-visible { background: color-mix(in srgb, var(--accent) 6%, transparent); }
    .v-bar {
      position: relative; display: block; width: min(24px, 60%); min-height: 2px; border-radius: 4px 4px 0 0;
      background: linear-gradient(0deg, var(--chart-lo), var(--accent)) bottom / 100% calc(100% / max(var(--p), 0.01)) no-repeat;
      transition: height var(--dur-slow) var(--ease-out), filter var(--dur-fast);
    }
    .v-col.is-hot .v-bar { filter: brightness(1.12) saturate(1.1); }
    /* the month still in progress: same hue, washed, so its dip doesn't read as a drop */
    .v-bar.partial { background: repeating-linear-gradient(135deg, var(--chart-fill) 0 3px, color-mix(in srgb, var(--accent) 28%, var(--surface)) 3px 6px); }
    .cap { position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); font-size: 0.6875rem; font-weight: 600; color: var(--ink-2); white-space: nowrap; }
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
  `,
})
export class BarChart {
  readonly data = input.required<Datum[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly height = input(180);
  readonly label = input('');
  readonly format = input<'number' | 'money'>('number');
  /** The last column is a period still in progress (this month). */
  readonly partialLast = input(false);

  protected readonly hover = signal(-1);
  protected readonly compact = compact;
  private readonly top = computed(() => Math.max(0, ...this.data().map((d) => d.value)));
  // About four gridlines, and the axis ends one clean step above the tallest bar, not at the next power of ten
  private readonly step = computed(() => niceStep(this.top() / 4));
  protected readonly max = computed(() => Math.max(this.step(), Math.ceil(this.top() / this.step()) * this.step()));
  protected readonly ticks = computed(() => Array.from({ length: Math.round(this.max() / this.step()) + 1 }, (_, i) => i * this.step()));
  protected readonly peak = computed(() => this.data().findIndex((d) => d.value === this.top()));

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
    @if (note()) { <span class="note" [class.is-alert]="alert()" [class.is-good]="tone() === 'good'" [class.is-bad]="tone() === 'bad'">{{ note() }}</span> }
  `,
  styles: `
    :host { display: grid; gap: 4px; align-content: start; padding: 18px 20px; border-radius: var(--radius); background: var(--surface); min-width: 0; }
    .label { font-size: 0.8125rem; color: var(--ink-2); }
    .value { font-size: 1.875rem; font-weight: 680; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .note { font-size: 0.75rem; color: var(--ink-3); }
    .note.is-alert { color: var(--accent); font-weight: 600; }
    /* a delta note: the ▲/▼ in the text carries direction, colour only says whether that's good */
    .note.is-good { color: var(--positive); font-weight: 600; }
    .note.is-bad { color: var(--negative); font-weight: 600; }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly note = input('');
  readonly alert = input(false);
  readonly tone = input<'good' | 'bad' | ''>('');
}
