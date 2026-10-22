const EURO = new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'});
const PERCENT = new Intl.NumberFormat('it-IT', {style: 'percent', maximumFractionDigits: 0});

export function formatEuro(value: number): string {
    return EURO.format(value);
}

export function formatPercent(value: number): string {
    return PERCENT.format(value);
}

export function formatDateTime(value: string): string {
    return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)} ${value.slice(11, 16)}`;
}

export function formatDate(value: string): string {
    return `${value.slice(8,10)}/${value.slice(5,7)}/${value.slice(0,4)}`;
}
export function todayIso(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2,'0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
