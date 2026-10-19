const EURO = new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'});
const PERCENT = new Intl.NumberFormat('it-IT', {style: 'percent', maximumFractionDigits: 0});

export function formatEuro(value: number): string {
    return EURO.format(value);
}

export function formatPercent(value: number): string {
    return PERCENT.format(value);
}