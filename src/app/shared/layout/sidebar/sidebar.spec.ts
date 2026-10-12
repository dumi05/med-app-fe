import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Session } from '../../auth/auth.model';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  const session = signal<Session | null>(null);
  const role = computed(() => session()?.role ?? null);
  const logout = jasmine.createSpy('logout');
  let fixture: ComponentFixture<Sidebar>;
  let router: Router;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    session.set({ token: 't', email: 'anna@test.it', role: 'PATIENT' });
    logout.calls.reset();
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), { provide: AuthService, useValue: { session, role, logout } }],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
  });

  it('shows only the links of the role of the user', () => {
    const links = Array.from(element().querySelectorAll('a.nav-link'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/patient', '/patient/availability']);
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
});