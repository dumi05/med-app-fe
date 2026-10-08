import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './auth.model';
import { authGuard, roleGuard } from './auth.guard';

describe('guards', () => {
  let loggedIn = true;
  let role: Role | null = 'PATIENT';
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    loggedIn = true;
    role = 'PATIENT';
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => loggedIn, role: () => role } },
      ],
    });
  });

  const run = (guard: ReturnType<typeof roleGuard>) =>
    TestBed.runInInjectionContext(() => guard(route, state));

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
});