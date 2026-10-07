import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE } from '../api';
import { AuthResponse, LoginRequest, RegisterRequest, Role, Session } from './auth.model';
import { isJwtExpired } from './jwt';

const STORAGE_KEY = 'medapp.session';

@Injectable({ providedIn: 'root'})
export class AuthService {

    private readonly http = inject(HttpClient);
    private readonly sessionState = signal<Session | null>(this.readStoredSession());

    readonly session = this.sessionState.asReadonly();
    readonly role = computed<Role | null>(() => this.sessionState()?.role ?? null);
    readonly token = computed<string | null>(() => this.sessionState()?.token ?? null); 
    
    login (request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${API_BASE}/auth/login`, request)
                    .pipe(tap((response) => this.startSession(response)));
    }

    register (request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${API_BASE}/auth/register`, request)
                    .pipe(tap((response) => this.startSession(response)));
    }

    logout(): void {
        this.sessionState.set(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            console.log("Storage is not available: the in memory session is already cancelled.");
        }
    }

    isLoggedIn(): boolean {
        const session = this.sessionState();

        if(session === null) {
            return false;
        }
        if(isJwtExpired(session.token)) {
            this.logout();
            return false;
        }
        return true;
    }

    private startSession(response: AuthResponse): void {
        if(response.token === null) {
            return;
        }

        const session: Session = {
            token: response.token,
            email: response.email,
            role: response.role
        };
        this.sessionState.set(session);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
            console.log("error during start session");
        }
    }

    private readStoredSession(): Session | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if(raw === null) {
                return null;
            }
            const session = JSON.parse(raw) as Session;
            return session.token && !isJwtExpired(session.token) ? session : null;
        } catch {
            return null;
        }
    }
}