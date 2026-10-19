import { formatEuro, formatPercent } from './format';

describe('format', () => {
    const plain = (text: string) => text.replace(/\s/g, ' ');

    it('formats an amount in euro with the Italian conventions', () => {
        expect(plain(formatEuro(230))).toBe('230,00 €');
        expect(plain(formatEuro(120.5))).toBe('120,50 €');
    });
    it('formats a rate as a whole percentage', () => {
        expect(plain(formatPercent(0.75))).toBe('75%');
        expect(plain(formatPercent(0))).toBe('0%');
    })
});
