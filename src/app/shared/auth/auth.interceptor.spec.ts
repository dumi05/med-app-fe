import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const token = signal<string | null>(null);
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    token.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('aggiunge il token alle chiamate API quando c\'è una sessione', () => {
    token.set('abc');
    http.get('/api/v1/medici').subscribe();
    const req = controller.expectOne('/api/v1/medici');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('non aggiunge l\'header senza sessione', () => {
    http.get('/api/v1/medici').subscribe();
    const req = controller.expectOne('/api/v1/medici');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('non invia il token a login e registrazione', () => {
    token.set('abc');
    http.post('/api/v1/auth/login', {}).subscribe();
    const req = controller.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});