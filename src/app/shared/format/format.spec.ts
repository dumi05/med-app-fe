import { formatEuro, formatPercent, formatDateTime, formatDate, todayIso } from './format';

describe('format', () => {
    const plain = (text: string) => text.replace(/\s/g, ' ');

    it('formats an amount in euro with the Italian conventions', () => {
        expect(plain(formatEuro(230))).toBe('230,00 €');
        expect(plain(formatEuro(120.5))).toBe('120,50 €');
    });
    it('formats a rate as a whole percentage', () => {
        expect(plain(formatPercent(0.75))).toBe('75%');
        expect(plain(formatPercent(0))).toBe('0%');
    });
    it('formats a date and time as dd/MM/yyy HH:mm without touching the time zone', () => {
        expect(formatDateTime('2026-10-20T09:30:00')).toBe('20/10/2026 09:30');
        expect(formatDateTime('2026-01-05T18:05:00')).toBe('05/01/2026 18:05');
    });
    it('formats a date as dd/MM/yyyy', () => {
        expect(formatDate('2026-11-04')).toBe('04/11/2026');
    });
    it('returns today as yyyy-MM-dd in the local time zone', () => {
        jasmine.clock().install();
        jasmine.clock().mockDate(new Date(2026, 9, 5, 23, 30));
        expect(todayIso()).toBe('2026-10-05');
        jasmine.clock().uninstall();
    })
});
