export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_BYTES = 72;

const MAX_BLOCK = 6;
const MIN_EMAIL_PART = 4;
const MIN_NAME_PART = 3;
const CONTEXT_WORDS = ['lamole', 'studiomedico'];
const SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', 'qwertyuiopasdfghjklzxcvbnm', '01234567890123456789']
    .flatMap((sequence) => [sequence, [...sequence].reverse().join('')]);

export interface PasswordContext {
    email: string;
    firstName: string;
    lastName: string;
}

export interface PasswordCheck {
    id: 'length' | 'bytes' | 'pattern' | 'personal';
    label: string;
    ok: boolean;
}

export function passwordChecks(password: string, context: Partial<PasswordContext> = {}): PasswordCheck[] {
    return [
        { id: 'length', label: `Almeno ${MIN_PASSWORD_LENGTH} caratteri (non solo spazi)`, ok: hasEnoughCharacters(password) },
        { id: 'bytes', label: `Al massimo ${MAX_PASSWORD_BYTES} byte (circa ${MAX_PASSWORD_BYTES} caratteri)`, ok: byteLength(password) <= MAX_PASSWORD_BYTES },
        { id: 'pattern', label: 'Nessuna ripetizione o sequenza evidente (aaaaaaaaaaaa, 123456789012)', ok: !isPredictable(password) },
        { id: 'personal', label: 'Non contiene la tua email, il tuo nome o il tuo cognome', ok: !containsPersonalData(password, context) },
    ];
}

export function passwordIsAcceptable(password: string, context: Partial<PasswordContext> = {}): boolean {
    return passwordChecks(password, context).every((check) => check.ok);
}

function hasEnoughCharacters(password: string): boolean {
    return password.trim() !== '' && [...password].length >= MIN_PASSWORD_LENGTH;
}

function byteLength(password: string): number {
    return new TextEncoder().encode(password).length;
}

function isPredictable(password: string): boolean {
    if(password === ''){
        return false;
    }
    const lower = password.toLowerCase();
    return isOneCharacterRepeated(lower) || isBlockRepeated(lower) || SEQUENCES.some((seq) => seq.includes(lower));
}

function isOneCharacterRepeated(value: string): boolean {
    return new Set([...value]).size === 1;
}

function isBlockRepeated(value: string): boolean {
    for(let size = 1; size <= MAX_BLOCK; size++){
        if(value.length % size === 0 && value.length / size >= 2 && value === value.slice(0, size).repeat(value.length/size)){
            return true;
        }
    }
    return false;
}

function plain(value: string): string {
    return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

function containsPersonalData(password: string, context: Partial<PasswordContext>): boolean {
    const text = plain(password);
    const tokens = [...CONTEXT_WORDS];
    const email = context.email ?? '';
    if(email.includes('@')){
        tokens.push(...longEnough(plain(email.substring(0, email.indexOf('@'))), MIN_EMAIL_PART));
    }
    tokens.push(...longEnough(plain(context.firstName ?? ''), MIN_NAME_PART));
    tokens.push(...longEnough(plain(context.lastName ?? ''), MIN_NAME_PART));
    return tokens.some((token) => text.includes(token));
}

function longEnough(token:string, minLength: number): string[] {
    return token.length >= minLength ? [token] : [];
}