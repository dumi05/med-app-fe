import { hasReport } from "./appointment.model";

describe('hasReport', () => {
    it('is true once the report was written (reported or invoiced)', () => {
        expect(hasReport('REPORTED')).toBeTrue();
        expect(hasReport('INVOICED')).toBeTrue();
    });
    it('is false before the report', () => {
        expect(hasReport('BOOKED')).toBeFalse();
        expect(hasReport('COMPLETED')).toBeFalse();
        expect(hasReport('CANCELLED')).toBeFalse();
    })
})