import { leaveMessage, leaveProblem, isAway } from './leave-rules';
import { DoctorLeave } from './leave.model';

const TODAY = '2026-11-04';

const leave = (startDate: string, endDate: string): DoctorLeave => ({
  id: 1, doctorId: 1, startDate, endDate, replacementDoctorId: null, replacementDoctorName: null,
});

describe('leaveProblem', () => {
  it('asks for both days', () => {
    expect(leaveProblem('', '2026-11-10', TODAY)).toContain('Scegli il primo e l\'ultimo giorno');
    expect(leaveProblem('2026-11-10', '', TODAY)).toContain('Scegli il primo e l\'ultimo giorno');
  });

  it('accepts a leave of a single day', () => {
    expect(leaveProblem('2026-11-10', '2026-11-10', TODAY)).toBeNull();
  });

  it('refuses a last day before the first', () => {
    expect(leaveProblem('2026-11-10', '2026-11-09', TODAY)).toBe('L\'ultimo giorno non può precedere il primo.');
  });

  it('refuses a leave that is already over, and accepts one that ends today', () => {
    expect(leaveProblem('2026-11-01', '2026-11-03', TODAY)).toBe('L\'assenza non può essere già finita.');
    expect(leaveProblem('2026-11-01', '2026-11-04', TODAY)).toBeNull();
  });

  it('accepts a leave that began already (a doctor who falls ill registers it when they know)', () => {
    expect(leaveProblem('2026-10-30', '2026-11-10', TODAY)).toBeNull();
  });

  it('accepts 90 days and refuses 91', () => {
    expect(leaveProblem('2026-11-10', '2027-02-07', TODAY)).toBeNull();
    expect(leaveProblem('2026-11-10', '2027-02-08', TODAY)).toBe('Un\'assenza può durare al massimo 90 giorni.');
  });
});

describe('isAway', () => {
  const leaves = [leave('2026-11-10', '2026-11-14')];

  it('counts the first and the last day', () => {
    expect(isAway(leaves, '2026-11-10')).toBeTrue();
    expect(isAway(leaves, '2026-11-12')).toBeTrue();
    expect(isAway(leaves, '2026-11-14')).toBeTrue();
  });

  it('does not count the day before or the day after', () => {
    expect(isAway(leaves, '2026-11-09')).toBeFalse();
    expect(isAway(leaves, '2026-11-15')).toBeFalse();
  });

  it('is false without leaves', () => {
    expect(isAway([], '2026-11-10')).toBeFalse();
  });

  it('looks in every leave', () => {
    expect(isAway([leave('2026-11-10', '2026-11-11'), leave('2026-12-01', '2026-12-05')], '2026-12-03')).toBeTrue();
  });
});

describe('leaveMessage', () => {
  it('shows the text of the server when it refuses a leave', () => {
    expect(leaveMessage({ status: 400, code: 'INVALID_ARGUMENT', message: 'Il sostituto non è attivo.' })).toBe('Il sostituto non è attivo.');
  });

  it('falls back to the generic text when the server says nothing', () => {
    expect(leaveMessage({ status: 400, code: 'INVALID_ARGUMENT', message: '' })).toBe('I dati inseriti non sono validi.');
  });

  it('uses the usual texts for the other errors, and never the text of the server', () => {
    expect(leaveMessage({ status: 403, code: 'UNAUTHORIZED_ACCESS', message: 'detail of the server' }))
      .toBe('Non hai i permessi per eseguire questa operazione.');
  });
});