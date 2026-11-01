import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { errorInterceptor } from '../../http/error.interceptor';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const fillIn = (email: string, password: string) => {
    const el: HTMLElement = fixture.nativeElement;
    const fields = el.querySelectorAll('input');
    (fields[0] as HTMLInputElement).value = email;
    fields[0].dispatchEvent(new Event('input'));
    (fields[1] as HTMLInputElement).value = password;
    fields[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () =>
    (fixture.nativeElement as HTMLElement).querySelector('form')!.dispatchEvent(new Event('submit'));

  it('does not send the form when the fields are empty', () => {
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/login');
    const invalid = (fixture.nativeElement as HTMLElement).querySelectorAll('.is-invalid');
    expect(invalid.length).toBe(2);
  });

  it('logs in with valid credentials and goes to the home of the role', () => {
    fillIn('admin@studio-medico.it', 'admin123');
    submit();

    const req = http.expectOne('/api/v1/auth/login');
    req.flush({ token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'admin@studio-medico.it', role: 'ADMIN' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('goes straight to the change of the password when the account must change it', () => {
    fillIn('doc@studio-medico.it', 'Tavolo-Viola-Nuvola-42');
    submit();

    http.expectOne('/api/v1/auth/login').flush(
      { token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'doc@studio-medico.it', role: 'DOCTOR', mustChangePassword: true });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/account/password');
  });

  it('tells the password managers which field is the user name and which the current password', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#email')!.getAttribute('autocomplete')).toBe('username');
    expect(el.querySelector('#password')!.getAttribute('autocomplete')).toBe('current-password');
  });

  it('does not apply the rules of the new passwords: an old, weaker password must still be sent', () => {
    fillIn('anna@test.it', 'abc');
    submit();

    http.expectOne('/api/v1/auth/login').flush({ token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'anna@test.it', role: 'PATIENT' });
  });

  it('shows the message of the server, with the minutes to wait, when the account is locked', () => {
    fillIn('anna@test.it', 'una-password-sbagliata');
    submit();

    http.expectOne('/api/v1/auth/login').flush(
      { code: 'ACCOUNT_LOCKED', message: 'Troppi tentativi di accesso falliti. Riprova tra 15 minuti.', timestamp: 'x' },
      { status: 429, statusText: 'Too Many Requests' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.alert-danger')?.textContent).toContain('Riprova tra 15 minuti.');
  });

  it('shows the Italian message of the error code when the login fails', () => {
    fillIn('a@b.it', 'wrong-password');
    submit();

    http.expectOne('/api/v1/auth/login').flush(
      { code: 'INVALID_CREDENTIALS', message: 'Credenziali non valide', timestamp: 'x' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email o password non corrette.');
  });
});

describe('Login after the account was deleted', () => {
  const create = (query: Record<string, string>) => {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('tells that the account was deleted when the page is opened with the mark', () => {
    const page = create({ deleted: '1' });

    expect(page.querySelector('.alert-success')?.textContent).toContain('Il tuo account è stato eliminato.');
  });

  it('shows no message when the mark is not there', () => {
    const page = create({});

    expect(page.querySelector('.alert-success')).toBeNull();
  });
});