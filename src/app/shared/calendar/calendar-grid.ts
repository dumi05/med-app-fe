export const WEEKDAY_LABELS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

const pad = (n: number) => String(n).padStart(2, '0');

const parts = (month: string): {year: number; month: number} => ({
    year: Number(month.slice(0,4)),
    month: Number(month.slice(5,7))
});

export function monthOf(day: string) {
    return day.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
    const { year, month: m }= parts(month);
    const moved = new Date(year, m-1 + delta, 1);
    return `${moved.getFullYear()}-${pad(moved.getMonth()+1)}`;
}

export function monthRange(month: string): {from: string, to: string} {
    const { year, month: m }= parts(month);
    return {
        from: `${month}-01`, 
        to: `${month}-${pad(new Date(year, m, 0).getDate())}`
    };
}

export function addDays(day: string, days: number): string {
    const moved = new Date(Number(day.slice(0,4)), Number(day.slice(5,7))-1, Number(day.slice(8,10)) + days);
    return `${moved.getFullYear()}-${pad(moved.getMonth() + 1)}-${pad(moved.getDate())}`;
}

export function monthLabel(month: string): string {
    const { year, month: m }= parts(month);
    return new Intl.DateTimeFormat(`it-IT`, { month: 'long', year: 'numeric'}).format(new Date(year, m-1,1));
}

export function dayLabel(day: string): string {
    const date = new Date(Number(day.slice(0,4)), Number(day.slice(5,7))-1, Number(day.slice(8,10)));
    return new Intl.DateTimeFormat(`it-IT`, { weekday: 'long', day: 'numeric', month: 'long'}).format(date);
}

export function shortDayLabel(day: string): string {
    const date = new Date(Number(day.slice(0,4)), Number(day.slice(5,7))-1, Number(day.slice(8,10)));
    return new Intl.DateTimeFormat(`it-IT`, { weekday: 'short', day: 'numeric', month: 'short'}).format(date);
}

export function buildMonthGrid(month: string): (string | null)[][] {
    const { year, month: m }= parts(month);
    const offset = (new Date(year, m-1, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, m, 0).getDate();

    const cells: (string | null)[] = Array(offset).fill(null);
    for(let day = 1; day <= daysInMonth; day++) {
        cells.push(`${month}-${pad(day)}`);
    }
    while(cells.length % 7 !== 0) {
        cells.push(null);
    }

    const weeks: (string | null)[][]=[];
    for(let i = 0; i <cells.length; i+=7) {
        weeks.push(cells.slice(i, i+7));
    }

    return weeks;
}