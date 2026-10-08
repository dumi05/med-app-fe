import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

function fakeToken(expSeconds: number): string {
  const base64url = (s: string) =>
    btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify({ exp: expSeconds }))}.firma`;
}

const FUTURO = Math.floor(Date.now() / 1000) + 36000;
const PASSATO = Math.floor(Date.now() / 1000) - 36000;

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login salva la sessione e la persiste', () => {
    const service = TestBed.inject(AuthService);
    const token = fakeToken(FUTURO);

    service.login({ email: 'mario@test.it', password: 'password123' }).subscribe();
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token, email: 'mario@test.it', role: 'PATIENT' });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toBe('PATIENT');
    expect(service.token()).toBe(token);
    expect(localStorage.getItem('medapp.session')).toContain('mario@test.it');
  });

  it('register invia il consenso GDPR e salva la sessione', () => {
    const service = TestBed.inject(AuthService);

    service
      .register({
        email: 'anna@test.it', password: 'password123', firstName: 'Anna', lastName: 'Bianchi',
        birthDate: '1990-01-01', gdprConsent: true, gdprConsentVersion: 'v1.0',
      })
      .subscribe();
    const req = http.expectOne('/api/v1/auth/register');
    expect(req.request.body.consensoGdprVersion).toBe('v1.0');
    req.flush({ token: fakeToken(FUTURO), email: 'anna@test.it', role: 'PATIENT' });

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('logout cancella la sessione', () => {
    const service = TestBed.inject(AuthService);
    service.login({ email: 'a@b.it', password: 'password123' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush({ token: fakeToken(FUTURO), email: 'a@b.it', role: 'ADMIN' });

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('medapp.session')).toBeNull();
  });

  it('ripristina una sessione valida salvata', () => {
    localStorage.setItem('medapp.session',
      JSON.stringify({ token: fakeToken(FUTURO), email: 'a@b.it', role: 'DOCTOR' }));

    const service = TestBed.inject(AuthService);

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toBe('DOCTOR');
  });

  it('scarta una sessione salvata con token scaduto', () => {
    localStorage.setItem('medapp.session',
      JSON.stringify({ token: fakeToken(PASSATO), email: 'a@b.it', role: 'DOCTOR' }));

    const service = TestBed.inject(AuthService);

    expect(service.isLoggedIn()).toBeFalse();
  });
});