import { planProblem, planSlots } from './plan-slots';

describe('planSlots', () => {
  it('lists the start of consecutive slots', () => {
    expect(planSlots('09:00', '11:00', 30)).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('drops the last slot when it does not fit', () => {
    expect(planSlots('09:00', '10:45', 30)).toEqual(['09:00', '09:30', '10:00']);
  });

  it('makes one slot when the range is exactly one visit', () => {
    expect(planSlots('09:00', '09:30', 30)).toEqual(['09:00']);
  });

  it('works with durations that do not divide the hour', () => {
    expect(planSlots('09:00', '10:40', 20)).toEqual(['09:00', '09:20', '09:40', '10:00', '10:20']);
    expect(planSlots('09:00', '10:30', 20)).toEqual(['09:00', '09:20', '09:40', '10:00']);
  });

  it('is empty when the input makes no sense', () => {
    expect(planSlots('', '11:00', 30)).toEqual([]);
    expect(planSlots('11:00', '09:00', 30)).toEqual([]);
    expect(planSlots('09:00', '09:20', 30)).toEqual([]);
    expect(planSlots('09:00', '11:00', 0)).toEqual([]);
    expect(planSlots('09:00', '11:00', NaN)).toEqual([]);
  });
});

describe('planProblem', () => {
  it('has nothing to say about a good plan', () => {
    expect(planProblem('09:00', '12:00', 30)).toBeNull();
  });

  it('waits for the missing fields without complaining', () => {
    expect(planProblem('', '12:00', 30)).toBeNull();
    expect(planProblem('09:00', '', 30)).toBeNull();
  });

  it('refuses durations outside 5-240 minutes', () => {
    expect(planProblem('09:00', '12:00', 4)).toContain('tra 5 e 240');
    expect(planProblem('08:00', '20:00', 241)).toContain('tra 5 e 240');
    expect(planProblem('09:00', '12:00', 5)).toBeNull();
    expect(planProblem('08:00', '20:00', 240)).toBeNull();
  });

  it('refuses an end that is not after the start', () => {
    expect(planProblem('10:00', '10:00', 30)).toContain('dopo quello di inizio');
    expect(planProblem('10:00', '09:00', 30)).toContain('dopo quello di inizio');
  });

  it('refuses a range shorter than one visit', () => {
    expect(planProblem('09:00', '09:20', 30)).toContain('più corta di una visita');
  });

  it('accepts exactly 48 slots and refuses 49', () => {
    expect(planProblem('08:00', '12:00', 5)).toBeNull();
    expect(planProblem('08:00', '12:05', 5)).toContain('Al massimo 48');
  });
});