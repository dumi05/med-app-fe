import { bandsFrom, emptyWeek, problemOf, weekFrom } from './week-plan';

describe('week plan', () => {
  describe('weekFrom', () => {
    it('puts the bands of the server in their day, without the seconds, in order of time', () => {
      const week = weekFrom([
        { dayOfWeek: 'MONDAY', startTime: '15:00:00', endTime: '19:00:00' },
        { dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '13:00:00' },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00' },
      ]);

      expect(week.MONDAY).toEqual([{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }]);
      expect(week.SATURDAY).toEqual([{ start: '09:00', end: '13:00' }]);
      expect(week.TUESDAY).toEqual([]);
    });

    it('leaves out a day that the page does not have (Sunday)', () => {
      const week = weekFrom([{ dayOfWeek: 'SUNDAY' as 'MONDAY', startTime: '09:00', endTime: '13:00' }]);

      expect(Object.keys(week)).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
      expect(Object.values(week).every((bands) => bands.length === 0)).toBeTrue();
    });
  });

  describe('bandsFrom', () => {
    it('gives the bands from Monday to Saturday and in each day by time, with "HH:mm"', () => {
      const week = emptyWeek();
      week.WEDNESDAY = [{ start: '15:00', end: '19:00' }, { start: '09:00', end: '13:00' }];
      week.MONDAY = [{ start: '09:00', end: '12:00' }];

      expect(bandsFrom(week)).toEqual([
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: 'WEDNESDAY', startTime: '15:00', endTime: '19:00' },
      ]);
    });

    it('gives nothing for a week without hours', () => {
      expect(bandsFrom(emptyWeek())).toEqual([]);
    });
  });

  describe('problemOf', () => {
    it('finds nothing wrong in a morning and an afternoon', () => {
      expect(problemOf([{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }])).toBeNull();
      expect(problemOf([])).toBeNull();
    });

    it('asks for both times of every band', () => {
      expect(problemOf([{ start: '', end: '13:00' }])).toContain('inizio e la fine');
      expect(problemOf([{ start: '09:00', end: '' }])).toContain('inizio e la fine');
    });

    it('wants the end after the start', () => {
      expect(problemOf([{ start: '13:00', end: '09:00' }])).toContain('dopo l\'inizio');
      expect(problemOf([{ start: '09:00', end: '09:00' }])).toContain('dopo l\'inizio');
    });

    it('wants at least 30 minutes, 30 included', () => {
      expect(problemOf([{ start: '09:00', end: '09:25' }])).toContain('almeno 30 minuti');
      expect(problemOf([{ start: '09:00', end: '09:30' }])).toBeNull();
    });

    it('wants the times on multiples of 5 minutes', () => {
      expect(problemOf([{ start: '09:03', end: '13:00' }])).toContain('multipli di 5');
      expect(problemOf([{ start: '09:00', end: '13:02' }])).toContain('multipli di 5');
      expect(problemOf([{ start: '09:05', end: '13:00' }])).toBeNull();
    });

    it('does not allow two bands of the same day to overlap, whatever the order, but allows them to touch', () => {
      expect(problemOf([{ start: '09:00', end: '11:00' }, { start: '10:30', end: '12:00' }])).toContain('sovrapporsi');
      expect(problemOf([{ start: '10:30', end: '12:00' }, { start: '09:00', end: '11:00' }])).toContain('sovrapporsi');
      expect(problemOf([{ start: '09:00', end: '11:00' }, { start: '11:00', end: '12:00' }])).toBeNull();
    });

    it('allows three bands in a day and not four', () => {
      const three = [{ start: '08:00', end: '09:00' }, { start: '10:00', end: '11:00' }, { start: '12:00', end: '13:00' }];

      expect(problemOf(three)).toBeNull();
      expect(problemOf([...three, { start: '14:00', end: '15:00' }])).toContain('Al massimo 3');
    });
  });
});