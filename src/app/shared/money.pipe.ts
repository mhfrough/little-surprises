import { Pipe, PipeTransform } from '@angular/core';

const fmt = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** Pakistani rupees, written the way local shops do: "Rs 2,900". */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return `Rs ${fmt.format(value ?? 0)}`;
  }
}
