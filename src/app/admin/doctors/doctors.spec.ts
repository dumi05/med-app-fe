import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Doctors } from './doctors';

describe('Doctors', () => {
  let fixture: ComponentFixture<Doctors>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctors],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Doctors);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/v1/doctors').flush([
      { id: 1, firstName: 'Luca', lastName: 'Verdi', specialization: 'Cardiologia' },
    ]);
    http.expectOne('/api/v1/specializations').flush([
      { id: 1, name: 'Cardiologia' },
      { id: 2, name: 'Dermatologia' },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const setValue = (id: string, value: string) => {
    const field = element().querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    field.value = value;
    field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
  };

  const fillIn = () => {
    setValue('email', 'anna@studio-medico.it');
    setValue('password', 'password123');
    setValue('firstName', 'Anna');
    setValue('lastName', 'Neri');
    setValue('specializationId', '2');
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('shows one table row per doctor', () => {
    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Verdi');
    expect(rows[0].textContent).toContain('Cardiologia');
  });

  it('does not send the form when it is not valid', () => {
    submit();

    http.expectNone('/api/v1/doctors');
    expect(element().querySelectorAll('.is-invalid').length).toBeGreaterThan(0);
  });

  it('creates the doctor with the specialization id as a number and adds it to the table', () => {
    fillIn();
    submit();

    const req = http.expectOne('/api/v1/doctors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'anna@studio-medico.it', password: 'password123', firstName: 'Anna', lastName: 'Neri',
      specializationId: 2, delegationConsent: false,
    });
    req.flush({ id: 2, firstName: 'Anna', lastName: 'Neri', email: 'anna@studio-medico.it',
                specialization: 'Dermatologia', delegationConsent: false });
    fixture.detectChanges();

    expect(element().querySelectorAll('tbody tr').length).toBe(2);
  });

  it('shows the Italian message when the backend refuses the request', () => {
    fillIn();
    submit();

    http.expectOne('/api/v1/doctors').flush(
      { code: 'INVALID_ARGUMENT', message: 'Email gia registrata', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert')?.textContent).toContain('I dati inseriti non sono validi.');
  });
});