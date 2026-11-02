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
    it('shows the message of the server when it lists the rules that the password breaks', () => {
        expect(userMessage({ status: 400, code: 'WEAK_PASSWORD', message: 'Questa password è troppo comune.' })).toBe('Questa password è troppo comune.');
    });
    it('has a text of its own for a weak password when the server sends none', () => {
        expect(userMessage({ status: 400, code: 'WEAK_PASSWORD', message: '' })).toContain('non è abbastanza sicura');
    });
    it('shows the message of the server for a locked account, because it says how long to wait', () => {
        expect(userMessage({ status: 429, code: 'ACCOUNT_LOCKED', message: 'Riprova tra 15 minuti.' })).toBe('Riprova tra 15 minuti.');
        expect(userMessage({ status: 429, code: 'ACCOUNT_LOCKED', message: '' })).toContain('Troppi tentativi');
    });
    it('explains that the current password is wrong and that the change of the password is required', () => {
        expect(userMessage({ status: 400, code: 'INVALID_CURRENT_PASSWORD', message: 'x' })).toContain('password attuale');
        expect(userMessage({ status: 403, code: 'PASSWORD_CHANGE_REQUIRED', message: 'x' })).toContain('cambiare la password');
    });
    it('says that the specialization exists already', () => {
        expect(userMessage({ status: 409, code: 'SPECIALIZATION_ALREADY_EXISTS', message: 'x' })).toContain('Esiste già una specializzazione');
    });
    it('says that the e-mail is already registered, instead of "the data are not valid"', () => {
        expect(userMessage({ status: 409, code: 'EMAIL_ALREADY_IN_USE', message: 'x' })).toBe('Questa email è già registrata.');
    });
})