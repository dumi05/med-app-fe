import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { errorInterceptor } from '../../http/error.interceptor';
import { Register } from './register';

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
    setValue('password', 'password123');
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
      email: 'anna@test.it', password: 'password123', firstName: 'Anna', lastName: 'Bianchi',
      birthDate: '1990-01-01', gdprConsent: true, gdprConsentVersion: 'v1.0',
    });
    req.flush({ token: 'h.eyJleHAiOjk5OTk5OTk5OTl9.s', email: 'anna@test.it', role: 'PATIENT' });
  });

  it('rejects a password shorter than 8 characters', () => {
    fillInEverything();
    setValue('password', 'short');
    ((fixture.nativeElement as HTMLElement).querySelector('#consent') as HTMLInputElement).click();
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/auth/register');
    const password = (fixture.nativeElement as HTMLElement).querySelector('#password') as HTMLInputElement;
    expect(password.classList.contains('is-invalid')).toBeTrue();
  });
});