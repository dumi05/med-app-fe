export type Role = 'PAZIENTE' | 'MEDICO' | 'ADMIN';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    nome: string;
    cognome: string;
    dataNascita: string;
    consensoGdpr: boolean;
    consensoGdprVersion: string;
}

export interface AuthResponse {
    token: string | null;
    email: string;
    role: Role;
}

export interface Session {
    token: string;
    email: string;
    role: Role;
}