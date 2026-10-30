const ACTION_LABELS: Record<string, string> = {
    BOOK_APPOINTMENT: 'Prenotazione di una visita',
    CANCEL_APPOINTMENT: 'Visita cancellata',
    COMPLETE_VISIT: 'Visita completata',
    WRITE_REPORT: 'Referto scritto',
    READ_REPORT: 'Referto letto',
    ISSUE_INVOICE: 'Fattura emessa',
    UPDATE_PRICE: 'Prezzo modificato',
    WRITE_DOCTOR: 'Medico creato',
    UPDATE_DOCTOR: 'Medico modificato',
    DEACTIVATE_DOCTOR: 'Medico disattivato',
    ACTIVATE_DOCTOR: 'Medico attivato',
    CREATE_REPORT_DELEGATION: 'Delega dei referti creata',
    REVOKE_REPORT_DELEGATION: 'Delega dei referti revocata',
    ACCESS_REPORTS_VIA_DELEGATION: 'Referti letti con un link di delega',
    ANONYMIZE_PATIENT: 'Paziente anonimizzato',
    EXPORT_PATIENT_DATA: 'Dati di un paziente esportati'
};

export function actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
}