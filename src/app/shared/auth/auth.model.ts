export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gdprConsent: boolean;
    gdprConsentVersion: string;
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