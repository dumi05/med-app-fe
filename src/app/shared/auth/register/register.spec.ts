import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { errorInterceptor } from '../../http/error.interceptor';
import { Register } from './register';

const STRONG = 'Tavolo-Viola-Nuvola-42';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Register);
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigateByUrl');
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const setValue = (id: string, value: string) => {
    const input = (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = () => {
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));
  };

  const fillInEverything = () => {
    setValue('email', 'anna@test.it');
    setValue('password', STRONG);
    setValue('firstName', 'Anna');
    setValue('lastName', 'Bianchi');
    setValue('birthDate', '1990-01-01');
  };

  it('does not send the registration without the GDPR consent', () => {
    fillInEverything();
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/register');
    const consent = (fixture.nativeElement as HTMLElement).querySelector('#consent') as HTMLInputElement;
    expect(consent.classList.contains('is-invalid')).toBeTrue();
  });

  it('sends the registration with the privacy notice version when the consent is given', () => {
    fillInEverything();
    ((fixture.nativeElement as HTMLElement).querySelector('#consent') as HTMLInputElement).click();
    submit();

    const req = http.expectOne('/api/v1/auth/register');
    expect(req.request.body).toEqual({
      email: 'anna@test.it', password: STRONG, firstName: 'Anna', lastName: 'Bianchi',
      birthDate: '1990-01-01', gdprConsent: true, gdprConsentVersion: 'v1.0',
    });
    req.flush({ token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'anna@test.it', role: 'PATIENT' });
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent;
  const giveTheConsent = () => ((fixture.nativeElement as HTMLElement).querySelector('#consent') as HTMLInputElement).click();
  const passwordField = () => (fixture.nativeElement as HTMLElement).querySelector('#password') as HTMLInputElement;

  it('refuses a password that breaks the rules and does not send the registration', () => {
    fillInEverything();
    setValue('password', 'short');
    giveTheConsent();
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/register');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.text-danger').length).toBeGreaterThan(0);
  });

  it('lists the rules of the password under the field, in grey until something is typed', () => {
    const rules = (fixture.nativeElement as HTMLElement).querySelectorAll('app-password-rules li');

    expect(rules.length).toBe(4);
    expect(Array.from(rules).every((li) => li.classList.contains('text-muted'))).toBeTrue();
  });

  it('ticks the rules as the password is typed', () => {
    setValue('password', STRONG);
    fixture.detectChanges();

    const rules = (fixture.nativeElement as HTMLElement).querySelectorAll('app-password-rules li');
    expect(Array.from(rules).every((li) => li.classList.contains('text-success'))).toBeTrue();
  });

  it('refuses a password built on the e-mail, the name or the surname, also when they are typed after it', () => {
    fillInEverything();
    setValue('password', 'evviva-anna-2026-xyz');
    giveTheConsent();
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/register');
    expect(text()).toContain('Non contiene la tua email');
    const personal = (fixture.nativeElement as HTMLElement).querySelectorAll('app-password-rules li')[3];
    expect(personal.classList.contains('text-danger')).toBeTrue();
  });

  it('refuses an e-mail without a dot in the domain', () => {
    fillInEverything();
    setValue('email', 'anna@localhost');
    giveTheConsent();
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/register');
    expect((fixture.nativeElement as HTMLElement).querySelector('#email')!.classList.contains('is-invalid')).toBeTrue();
  });

  it('tells the password managers that this is a new password', () => {
    expect(passwordField().getAttribute('autocomplete')).toBe('new-password');
    expect((fixture.nativeElement as HTMLElement).querySelector('#email')!.getAttribute('autocomplete')).toBe('email');
  });

  it('does not stop the user from pasting into the password field', () => {
    const event = new Event('paste', { cancelable: true });

    passwordField().dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
  });

  it('shows what the server says when it refuses the password as too common', () => {
    fillInEverything();
    setValue('password', 'Forza-Torino-2026-ok');
    giveTheConsent();
    submit();

    http.expectOne('/api/v1/auth/register').flush(
      { code: 'WEAK_PASSWORD', message: 'Questa password è troppo comune.', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.alert-danger')?.textContent).toContain('troppo comune');
  });
});