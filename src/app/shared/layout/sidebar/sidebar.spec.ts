import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Session } from '../../auth/auth.model';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  const session = signal<Session | null>(null);
  const role = computed(() => session()?.role ?? null);
  const mustChangePassword = computed(() => session()?.mustChangePassword === true);
  const logout = jasmine.createSpy('logout');
  let fixture: ComponentFixture<Sidebar>;
  let router: Router;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    session.set({ token: 't', email: 'anna@test.it', role: 'PATIENT', mustChangePassword: false });
    logout.calls.reset();
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), { provide: AuthService, useValue: { session, role, mustChangePassword, logout } }],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
  });

  it('shows only the links of the role of the user', () => {
    const links = Array.from(element().querySelectorAll('a.nav-link'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/patient', '/patient/availability', '/patient/appointments', '/patient/report-delegations', '/patient/privacy', '/account/password']);
  });

  it('shows the logo and the name of the studio, and the name leads to the home', () => {
    const brand = element().querySelector('a.navbar-brand') as HTMLAnchorElement;
    const logo = brand.querySelector('img') as HTMLImageElement;

    expect(brand.textContent).toContain('Studio medico La Mole');
    expect(brand.getAttribute('href')).toBe('/patient');
    expect(logo.getAttribute('src')).toBe('brand/logo-mark.png');
    expect(logo.getAttribute('alt')).toBe('');
  });

  it('shows e-mail and role label', () => {
    expect(element().textContent).toContain('anna@test.it');
    expect(element().textContent).toContain('Paziente');
  });

  it('logs out and goes to the login page', () => {
    (element().querySelector('button.logout-button') as HTMLButtonElement).click();

    expect(logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('opens and closes the menu with the hamburger button', () => {
    const menu = element().querySelector('.navbar-collapse') as HTMLElement;
    expect(menu.classList.contains('show')).toBeFalse();

    (element().querySelector('button.navbar-toggler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(menu.classList.contains('show')).toBeTrue();

    (element().querySelector('button.navbar-toggler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(menu.classList.contains('show')).toBeFalse();
  });
  it('shows only the change of the password to an account that must change it', () => {
    session.set({ token: 't', email: 'doc@test.it', role: 'DOCTOR', mustChangePassword: true });
    fixture.detectChanges();

    const links = Array.from(element().querySelectorAll('a.nav-link'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/account/password']);
  });
});