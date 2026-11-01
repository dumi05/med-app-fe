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
    expect(req.request.body.gdprConsentVersion).toBe('v1.0');
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

  describe('the change of the password', () => {
    it('does not need a change when the server does not say so, also for a session saved before the flag existed', () => {
      localStorage.setItem('medapp.session',
        JSON.stringify({ token: fakeToken(FUTURO), email: 'a@b.it', role: 'DOCTOR' }));

      expect(TestBed.inject(AuthService).mustChangePassword()).toBeFalse();
    });

    it('keeps the flag that the login brings, and saves it', () => {
      const service = TestBed.inject(AuthService);
      service.login({ email: 'doc@b.it', password: 'Tavolo-Viola-Nuvola-42' }).subscribe();

      http.expectOne('/api/v1/auth/login').flush(
        { token: fakeToken(FUTURO), email: 'doc@b.it', role: 'DOCTOR', mustChangePassword: true });

      expect(service.mustChangePassword()).toBeTrue();
      expect(localStorage.getItem('medapp.session')).toContain('"mustChangePassword":true');
    });

    it('posts the passwords and replaces the session with the new token, without the flag', () => {
      const service = TestBed.inject(AuthService);
      service.login({ email: 'doc@b.it', password: 'Tavolo-Viola-Nuvola-42' }).subscribe();
      http.expectOne('/api/v1/auth/login').flush(
        { token: fakeToken(FUTURO), email: 'doc@b.it', role: 'DOCTOR', mustChangePassword: true });
      const newToken = fakeToken(FUTURO + 5);

      service.changePassword({ currentPassword: 'Tavolo-Viola-Nuvola-42', newPassword: 'Nuvola-Viola-Tavolo-77' }).subscribe();
      const req = http.expectOne('/api/v1/auth/change-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ currentPassword: 'Tavolo-Viola-Nuvola-42', newPassword: 'Nuvola-Viola-Tavolo-77' });
      req.flush({ token: newToken, email: 'doc@b.it', role: 'DOCTOR', mustChangePassword: false });

      expect(service.token()).toBe(newToken);
      expect(service.mustChangePassword()).toBeFalse();
    });

    it('remembers that the server wants the change, and saves it', () => {
      const service = TestBed.inject(AuthService);
      service.login({ email: 'doc@b.it', password: 'Tavolo-Viola-Nuvola-42' }).subscribe();
      http.expectOne('/api/v1/auth/login').flush({ token: fakeToken(FUTURO), email: 'doc@b.it', role: 'DOCTOR', mustChangePassword: false });

      service.requirePasswordChange();

      expect(service.mustChangePassword()).toBeTrue();
      expect(localStorage.getItem('medapp.session')).toContain('"mustChangePassword":true');
    });

    it('has nothing to remember without a session', () => {
      const service = TestBed.inject(AuthService);

      service.requirePasswordChange();

      expect(service.mustChangePassword()).toBeFalse();
    });
  });
});