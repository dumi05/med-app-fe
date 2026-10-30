import { actionLabel } from './audit-labels';

describe('actionLabel', () => {
  it('translates the actions of the log', () => {
    expect(actionLabel('BOOK_APPOINTMENT')).toBe('Prenotazione di una visita');
    expect(actionLabel('READ_REPORT')).toBe('Referto letto');
    expect(actionLabel('ANONYMIZE_PATIENT')).toBe('Paziente anonimizzato');
  });

  it('shows an action that it does not know as it is', () => {
    expect(actionLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});