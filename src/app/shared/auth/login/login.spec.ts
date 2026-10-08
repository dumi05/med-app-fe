import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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
    http.expectNone('/api/v1/auth/login');
  });

  it('logs in with valid credentials and goes to the home of the role', () => {
    fillIn('admin@studio-medico.it', 'admin123');
    submit();

    const req = http.expectOne('/api/v1/auth/login');
    req.flush({ token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'admin@studio-medico.it', role: 'ADMIN' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('shows the Italian message of the error code when the login fails', () => {
    fillIn('a@b.it', 'wrong-password');
    submit();

    http.expectOne('/api/v1/auth/login').flush(
      { code: 'INVALID_ARGUMENT', message: 'Invalid credentials', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('non sono validi');
  });
});