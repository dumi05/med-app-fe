import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { errorInterceptor } from '../../http/error.interceptor';
import { ChangePassword } from './change-password';

const TOKEN = 'h.eyJleHAiOjk5OTk5OTk5OTl9.s';
const CURRENT = 'Tavolo-Viola-Nuvola-42';
const NEW = 'Nuvola-Viola-Tavolo-77';
const PATH = '/api/v1/auth/change-password';

describe('ChangePassword', () => {
  let fixture: ComponentFixture<ChangePassword>;
  let http: HttpTestingController;
  let router: Router;

  const element = () => fixture.nativeElement as HTMLElement;
  const field = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;

  const open = (mustChangePassword: boolean) => {
    localStorage.setItem('medapp.session',
      JSON.stringify({ token: TOKEN, email: 'anna@test.it', role: 'PATIENT', mustChangePassword }));
    TestBed.configureTestingModule({
      imports: [ChangePassword],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(ChangePassword);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  };

  const setValue = (id: string, value: string) => {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
  };

  const fillIn = (current = CURRENT, next = NEW, confirmation = next) => {
    setValue('currentPassword', current);
    setValue('newPassword', next);
    setValue('confirmation', confirmation);
    fixture.detectChanges();
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('asks for the current password, the new one and its confirmation', () => {
    open(false);

    expect(element().querySelector('h1')!.textContent).toContain('Cambia password');
    expect(element().querySelector('label[for="currentPassword"]')!.textContent).toContain('Password attuale');
    expect(element().querySelector('label[for="newPassword"]')!.textContent).toContain('Nuova password');
    expect(element().querySelector('label[for="confirmation"]')!.textContent).toContain('Ripeti');
  });

  it('tells the password managers which password is the current one and which is a new one', () => {
    open(false);

    expect(field('currentPassword').getAttribute('autocomplete')).toBe('current-password');
    expect(field('newPassword').getAttribute('autocomplete')).toBe('new-password');
    expect(field('confirmation').getAttribute('autocomplete')).toBe('new-password');
  });

  it('shows the notice of the first password only to an account that must change it', () => {
    open(false);
    expect(element().querySelector('.must-change-notice')).toBeNull();
  });

  it('explains why the page is the only one open, to an account that must change the password', () => {
    open(true);

    expect(element().querySelector('.must-change-notice')!.textContent).toContain('password è quella iniziale');
  });

  it('lists the rules of the new password and ticks them as it is typed', () => {
    open(false);
    expect(element().querySelectorAll('app-password-rules li.text-muted').length).toBe(4);

    setValue('newPassword', NEW);
    fixture.detectChanges();

    expect(element().querySelectorAll('app-password-rules li.text-success').length).toBe(4);
  });

  it('does not send the form when the fields are empty', () => {
    open(false);
    submit();

    http.expectNone(PATH);
    expect(element().querySelectorAll('.is-invalid').length).toBe(3);
  });

  it('does not send the form when the confirmation is different, and says so', () => {
    open(false);
    fillIn(CURRENT, NEW, 'Nuvola-Viola-Tavolo-78');
    submit();

    http.expectNone(PATH);
    expect(element().querySelector('.mismatch')!.textContent).toContain('non coincidono');
  });

  it('does not send the form when the new password breaks a rule', () => {
    open(false);
    fillIn(CURRENT, 'corta');
    submit();

    http.expectNone(PATH);
    expect(element().querySelectorAll('app-password-rules li.text-danger').length).toBeGreaterThan(0);
  });

  it('refuses a new password built on the e-mail of the account', () => {
    open(false);
    fillIn(CURRENT, 'evviva-anna-2026-xyz');
    submit();

    http.expectNone(PATH);
    expect(element().querySelectorAll('app-password-rules li')[3].classList.contains('text-danger')).toBeTrue();
  });

  it('sends the two passwords, and only those', () => {
    open(false);
    fillIn();
    submit();

    const req = http.expectOne(PATH);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ currentPassword: CURRENT, newPassword: NEW });
    req.flush({ token: TOKEN, email: 'anna@test.it', role: 'PATIENT', mustChangePassword: false });
  });

  it('confirms the change, empties the form and stays on the page', () => {
    open(false);
    fillIn();
    submit();

    http.expectOne(PATH).flush({ token: TOKEN, email: 'anna@test.it', role: 'PATIENT', mustChangePassword: false });
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')!.textContent).toContain('Password aggiornata');
    expect(field('newPassword').value).toBe('');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('goes to the home of the role after the first change of the password', () => {
    open(true);
    fillIn();
    submit();

    http.expectOne(PATH).flush({ token: TOKEN, email: 'anna@test.it', role: 'PATIENT', mustChangePassword: false });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/patient');
  });

  it('disables the button while the request is open', () => {
    open(false);
    fillIn();
    submit();

    expect((element().querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeTrue();
    http.expectOne(PATH).flush({ token: TOKEN, email: 'anna@test.it', role: 'PATIENT', mustChangePassword: false });
  });

  it('says that the current password is wrong', () => {
    open(false);
    fillIn();
    submit();

    http.expectOne(PATH).flush(
      { code: 'INVALID_CURRENT_PASSWORD', message: 'x', timestamp: 'x' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')!.textContent).toContain('password attuale non è corretta');
    expect(field('currentPassword').value).toBe(CURRENT);
  });

  it('shows what the server says when it refuses the new password', () => {
    open(false);
    fillIn();
    submit();

    http.expectOne(PATH).flush(
      { code: 'WEAK_PASSWORD', message: 'Questa password è troppo comune.', timestamp: 'x' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')!.textContent).toContain('troppo comune');
  });

  it('shows the message of the lock, with the minutes to wait', () => {
    open(false);
    fillIn();
    submit();

    http.expectOne(PATH).flush(
      { code: 'ACCOUNT_LOCKED', message: 'Troppi tentativi di accesso falliti. Riprova tra 15 minuti.', timestamp: 'x' },
      { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')!.textContent).toContain('Riprova tra 15 minuti.');
  });
});