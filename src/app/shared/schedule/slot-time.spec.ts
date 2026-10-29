import { dayOf, endTimeOf, slotsOverlap, timeOf, timeRange } from './slot-time';

const slot = (startTime: string, durationMinutes = 30) => ({ startTime, durationMinutes });

describe('slot-time', () => {
  it('takes the day and the time out of the start', () => {
    expect(dayOf('2026-11-03T10:30:00')).toBe('2026-11-03');
    expect(timeOf('2026-11-03T10:30:00')).toBe('10:30');
  });

  it('computes the end of a slot and the range', () => {
    expect(endTimeOf(slot('2026-11-03T10:30:00'))).toBe('11:00');
    expect(timeRange(slot('2026-11-03T09:00:00', 45))).toBe('09:00–09:45');
  });

  describe('slotsOverlap', () => {
    it('is true when one starts inside the other', () => {
      expect(slotsOverlap(slot('2026-11-03T10:00:00'), slot('2026-11-03T10:15:00'))).toBeTrue();
      expect(slotsOverlap(slot('2026-11-03T10:15:00'), slot('2026-11-03T10:00:00'))).toBeTrue();
    });

    it('is true when one contains the other', () => {
      expect(slotsOverlap(slot('2026-11-03T09:00:00', 120), slot('2026-11-03T09:30:00'))).toBeTrue();
    });

    it('is true for two equal slots', () => {
      expect(slotsOverlap(slot('2026-11-03T10:00:00'), slot('2026-11-03T10:00:00'))).toBeTrue();
    });

    it('is false when they only touch at an end point', () => {
      expect(slotsOverlap(slot('2026-11-03T10:00:00'), slot('2026-11-03T10:30:00'))).toBeFalse();
      expect(slotsOverlap(slot('2026-11-03T10:30:00'), slot('2026-11-03T10:00:00'))).toBeFalse();
    });

    it('is false for slots on different days', () => {
      expect(slotsOverlap(slot('2026-11-03T10:00:00'), slot('2026-11-04T10:00:00'))).toBeFalse();
    });
  });
});