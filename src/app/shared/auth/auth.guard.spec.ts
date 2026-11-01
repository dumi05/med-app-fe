import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './auth.model';
import { authGuard, roleGuard } from './auth.guard';

describe('guards', () => {
  let loggedIn = true;
  let role: Role | null = 'PATIENT';
  let mustChangePassword = false;
  const route = {} as ActivatedRouteSnapshot;
  const stateOf = (url: string) => ({url} as RouterStateSnapshot);

  beforeEach(() => {
    loggedIn = true;
    role = 'PATIENT';
    mustChangePassword = false;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => loggedIn, role: () => role, mustChangePassword: () => mustChangePassword } },
      ],
    });
  });

  const run = (guard: ReturnType<typeof roleGuard>, url = '/patient') =>
    TestBed.runInInjectionContext(() => guard(route, stateOf(url)));

  it('authGuard lets an authenticated user through', () => {
    expect(run(authGuard)).toBeTrue();
  });

  it('authGuard redirects to the login page without a session', () => {
    loggedIn = false;
    const result = run(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('roleGuard lets the allowed role through', () => {
    role = 'ADMIN';
    expect(run(roleGuard('ADMIN'))).toBeTrue();
  });

  it('roleGuard sends a role that is not allowed to its own home', () => {
    role = 'PATIENT';
    const result = run(roleGuard('ADMIN')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/patient');
  });

  it('roleGuard redirects to the login page without a session', () => {
    loggedIn = false;
    role = null;
    const result = run(roleGuard('ADMIN')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('authGuard sends an account that must change the password to the page where it is changed', () => {
    mustChangePassword = true;

    const result = run(authGuard, '/patient/appointments') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/account/password');
  });

  it('authGuard lets an account that must change the password into that page', () => {
    mustChangePassword = true;

    expect(run(authGuard, '/account/password')).toBeTrue();
  });

  it('roleGuard too sends the account that must change the password to that page, at every change of page', () => {
    mustChangePassword = true;
    role = 'DOCTOR';

    const result = run(roleGuard('DOCTOR'), '/doctor/schedule') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/account/password');
  });

  it('the login wins over the change of the password: without a session the page is the login', () => {
    loggedIn = false;
    mustChangePassword = true;

    const result = run(authGuard, '/patient') as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });
});