import { addDays, buildMonthGrid, dayLabel, monthLabel, monthOf, monthRange, shiftMonth, shortDayLabel } from './calendar-grid';

describe('calendar-grid', () => {
  describe('buildMonthGrid', () => {
    it('starts the weeks on Monday: November 2026 begins on a Sunday, so six empty cells come first', () => {
      const weeks = buildMonthGrid('2026-11');

      expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
      expect(weeks[1][0]).toBe('2026-11-02');
    });

    it('puts a month that begins on Monday in the first cell', () => {
      expect(buildMonthGrid('2026-06')[0][0]).toBe('2026-06-01');
    });

    it('pads the last week with empty cells, so that every week has seven cells', () => {
      const weeks = buildMonthGrid('2026-11');

      expect(weeks.every((week) => week.length === 7)).toBeTrue();
      expect(weeks[weeks.length - 1]).toEqual(['2026-11-30', null, null, null, null, null, null]);
    });

    it('has all the days of the month exactly once', () => {
      const days = buildMonthGrid('2026-10').flat().filter((cell) => cell !== null);

      expect(days.length).toBe(31);
      expect(days[0]).toBe('2026-10-01');
      expect(days[30]).toBe('2026-10-31');
    });

    it('knows that February 2028 has 29 days and 2027 has 28', () => {
      expect(buildMonthGrid('2028-02').flat().filter((cell) => cell !== null).length).toBe(29);
      expect(buildMonthGrid('2027-02').flat().filter((cell) => cell !== null).length).toBe(28);
    });

    it('needs only four weeks for a February that begins on Monday and has 28 days', () => {
      expect(buildMonthGrid('2027-02').length).toBe(4);
    });
  });

  describe('months and days', () => {
    it('moves between months across the end of the year', () => {
      expect(shiftMonth('2026-12', 1)).toBe('2027-01');
      expect(shiftMonth('2027-01', -1)).toBe('2026-12');
      expect(shiftMonth('2026-10', 0)).toBe('2026-10');
    });

    it('gives the first and the last day of a month', () => {
      expect(monthRange('2026-10')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
      expect(monthRange('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    });

    it('adds days across the end of the month', () => {
      expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
      expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('takes the month out of a day', () => {
      expect(monthOf('2026-11-03')).toBe('2026-11');
    });

    it('writes months and days in Italian', () => {
      expect(monthLabel('2026-11')).toBe('novembre 2026');
      expect(dayLabel('2026-11-02')).toBe('lunedì 2 novembre');
      expect(shortDayLabel('2026-11-02')).toBe('lun 2 nov');
    });
  });
});