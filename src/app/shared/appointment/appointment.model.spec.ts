import { Appointment, changedByAbsence, hasInvoice, hasReport } from "./appointment.model";

describe('hasReport', () => {
    it('is true once the report was written (reported or invoiced)', () => {
        expect(hasReport('REPORTED')).toBeTrue();
    });
    it('is false before the report', () => {
        expect(hasReport('BOOKED')).toBeFalse();
        expect(hasReport('COMPLETED')).toBeFalse();
        expect(hasReport('CANCELLED')).toBeFalse();
        expect(hasReport('INVOICED')).toBeFalse();
    });
});

describe('hasInvoice', () => {
    it('is true once the report was written (reported or invoiced)', () => {
        expect(hasInvoice('REPORTED')).toBeTrue();
        expect(hasInvoice('INVOICED')).toBeTrue();
    });
    it('is false before the report', () => {
        expect(hasInvoice('BOOKED')).toBeFalse();
        expect(hasInvoice('COMPLETED')).toBeFalse();
        expect(hasInvoice('CANCELLED')).toBeFalse();
    });
});

describe('changedByAbsence', () => {
    const visit = (extra: Partial<Appointment>) => ({ id: 1, status: 'BOOKED', ...extra}) as Appointment;

    it('is true for a booked visit that was moved, and for a visit cancelled because the doctor is away', () => {
        expect(changedByAbsence(visit({ reassignedFromName: 'Mario Rossi'}))).toBeTrue();
        expect(changedByAbsence(visit({ status: 'CANCELLED', cancellationReason: 'DOCTOR_ABSENCE'}))).toBeTrue();
    });

    it('is false for the other visits, also for one moved and then cancelled by the patient', () => {
        expect(changedByAbsence(visit({}))).toBeFalse();
        expect(changedByAbsence(visit({ reassignedFromName: '' }))).toBeFalse();
        expect(changedByAbsence(visit({ status: 'CANCELLED', cancellationReason: 'PATIENT'}))).toBeFalse();
        expect(changedByAbsence(visit({ status: 'CANCELLED', reassignedFromName: 'Mario Rossi', cancellationReason: 'PATIENT'}))).toBeFalse();
        expect(changedByAbsence(visit({ status: 'CANCELLED' }))).toBeFalse();
    })
})
