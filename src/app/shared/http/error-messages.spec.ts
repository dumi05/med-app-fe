import { userMessage } from './error-messages';

describe('userMessage', () => {
    it('returns the italian text for a known code', () => {
        expect(userMessage({status: 409, code: "SLOT_NOT_AVAILABLE", message: "taken"})).toContain('fascia oraria');
    });
    it('returns the fallback message for an unknown code', () => {
        const unknown = userMessage({ status: 418, code: "SOMETHING_NEW", message: "generic"});
        const generic = userMessage({ status: 500, code: "SERVER_ERROR", message: ""});
        expect(unknown).toBe(generic);
    });
    it('returns Invalid credentials if password or email are wrong', () => {
        expect(userMessage({status: 401, code: "INVALID_CREDENTIALS", message: "Email o password non corrette"})).toContain('password');
    });
    it('returns a specific message when the resource was modified by someone else', () => {
        expect(userMessage({ status: 409, code: 'CONCURRENT_MODIFICATION', message: 'test'})).toContain('modificata');
    });
        it('explains that the slots of the doctor overlap', () => {
        expect(userMessage({ status: 409, code: 'SLOT_OVERLAP', message: 'x'})).toContain('Esistono gia');
    });
    it('explains that the patient already has a visit at that time', () => {
        expect(userMessage({ status: 409, code: 'APPOINTMENT_OVERLAP', message: 'x'})).toContain('Hai gia');
    });
})