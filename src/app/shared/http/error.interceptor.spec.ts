import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ApiError } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let router: Router;
  let sessionValid = true;
  const requirePasswordChange = jasmine.createSpy('requirePasswordChange');

  beforeEach(() => {
    sessionValid = true;
    requirePasswordChange.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => sessionValid, requirePasswordChange } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  afterEach(() => controller.verify());

  it('converts the backend ErrorResponse into an ApiError', () => {
    let error: ApiError | undefined;
    http.get('/api/v1/doctors').subscribe({ error: (e) => (error = e) });

    controller
      .expectOne('/api/v1/doctors')
      .flush({ code: 'RESOURCE_NOT_FOUND', message: 'Doctor not found', timestamp: 'x' },
             { status: 404, statusText: 'Not Found' });

    expect(error).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND', message: 'Doctor not found' });
  });

  it('handles an unreachable server', () => {
    let error: ApiError | undefined;
    http.get('/api/v1/doctors').subscribe({ error: (e) => (error = e) });

    controller.expectOne('/api/v1/doctors').error(new ProgressEvent('error'), { status: 0 });

    expect(error?.code).toBe('NETWORK_ERROR');
  });

  it('sends the user to the login page on 403 when the session has expired', () => {
    sessionValid = false;
    http.get('/api/v1/doctors').subscribe({ error: () => {} });

    controller.expectOne('/api/v1/doctors').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does NOT send the user to login on 403 when the session is valid (role not allowed)', () => {
    http.get('/api/v1/doctors').subscribe({ error: () => {} });

    controller.expectOne('/api/v1/doctors').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('sends the user to the change of the password when the server says that it is required, and remembers it', () => {
    http.get('/api/v1/doctors').subscribe({ error: () => {} });

    controller.expectOne('/api/v1/doctors').flush(
      { code: 'PASSWORD_CHANGE_REQUIRED', message: 'x', timestamp: 'x' }, { status: 403, statusText: 'Forbidden' });

    expect(requirePasswordChange).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/account/password');
    expect(router.navigateByUrl).not.toHaveBeenCalledWith('/login');
  });

  it('does not touch the password page for the other errors', () => {
    http.get('/api/v1/doctors').subscribe({ error: () => {} });

    controller.expectOne('/api/v1/doctors').flush(
      { code: 'UNAUTHORIZED_ACCESS', message: 'x', timestamp: 'x' }, { status: 403, statusText: 'Forbidden' });

    expect(requirePasswordChange).not.toHaveBeenCalled();
  });
});