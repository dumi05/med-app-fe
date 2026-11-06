import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { PatientAdmin } from '../../shared/patient/patient-admin.model';
import { Patients } from './patients';

const patient = (id: number, overrides: Partial<PatientAdmin> = {}): PatientAdmin => ({
  id, firstName: 'Carla', lastName: 'Neri', email: `carla${id}@example.com`,
  registeredAt: '2026-10-20T08:30:00Z', mustChangePassword: false, ...overrides,
});

describe('Patients', () => {
  let fixture: ComponentFixture<Patients>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(element().querySelectorAll('tbody tr'));
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const click = (selector: string) => {
    button(selector).click();
    fixture.detectChanges();
  };

  const open = (patients: PatientAdmin[]) => {
    http.expectOne('/api/v1/patients').flush(patients);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patients],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Patients);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows one row per patient, with name, e-mail and the date of the registration', () => {
    open([patient(1, { lastName: 'Verdi', firstName: 'Luca' }), patient(2)]);

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Verdi');
    expect(rows()[0].textContent).toContain('Luca');
    expect(rows()[0].textContent).toContain('carla1@example.com');
    expect(rows()[0].textContent).toContain('20/10/2026');
  });

  it('says so when there are no patients', () => {
    open([]);

    expect(element().querySelector('.no-results')?.textContent).toContain('Nessun risultato');
  });

  it('shows the badge only for the patients with a pending change', () => {
    open([patient(1), patient(2, { mustChangePassword: true })]);

    expect(rows()[0].querySelector('.pending-badge')).toBeNull();
    expect(rows()[1].querySelector('.pending-badge')?.textContent).toContain('Cambio richiesto');
  });

  it('filters the table, and the filter finds the pending changes', () => {
    open([patient(1, { lastName: 'Verdi' }), patient(2, { lastName: 'Neri', mustChangePassword: true })]);

    const input = element().querySelector('input.data-table-filter') as HTMLInputElement;
    input.value = 'richiesto';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Neri');
  });

  it('shows the error when the patients cannot be loaded', () => {
    http.expectOne('/api/v1/patients').flush(
      { code: 'UNAUTHORIZED_ACCESS', message: 'x', timestamp: 'x' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
    expect(rows().length).toBe(1);
  });

  it('asks for a confirmation first, and sends nothing until the admin confirms', () => {
    open([patient(1)]);

    click('.confirm-action-ask');
    expect(button('.confirm-action-yes')).not.toBeNull();
    http.expectNone('/api/v1/patients/1/force-password-change');
    click('.confirm-action-no');
    http.expectNone('/api/v1/patients/1/force-password-change');
    expect(element().querySelector('.confirm-action-yes')).toBeNull();
  });

  it('asks the patient to change the password after the confirmation, and shows it in the row', () => {
    open([patient(1, { firstName: 'Luca', lastName: 'Verdi' })]);

    click('.confirm-action-ask');
    click('.confirm-action-yes');

    const req = http.expectOne('/api/v1/patients/1/force-password-change');
    expect(req.request.method).toBe('POST');
    req.flush(patient(1, { firstName: 'Luca', lastName: 'Verdi', mustChangePassword: true }));
    fixture.detectChanges();

    expect(rows()[0].querySelector('.pending-badge')).not.toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Luca Verdi dovrà scegliere una nuova password');
  });

  it('disables the button while the request is on its way', () => {
    open([patient(1), patient(2)]);

    click('.confirm-action-ask');
    click('.confirm-action-yes');

    expect((rows()[0].querySelector('.confirm-action-ask') as HTMLButtonElement).disabled).toBeTrue();
    expect((rows()[1].querySelector('.confirm-action-ask') as HTMLButtonElement).disabled).toBeFalse();
    http.expectOne('/api/v1/patients/1/force-password-change').flush(patient(1, { mustChangePassword: true }));
  });

  it('shows the error and changes nothing when the request fails', () => {
    open([patient(1)]);

    click('.confirm-action-ask');
    click('.confirm-action-yes');
    http.expectOne('/api/v1/patients/1/force-password-change').flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'x', timestamp: 'x' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
    expect(element().querySelector('.alert-success')).toBeNull();
    expect(rows()[0].querySelector('.pending-badge')).toBeNull();
    expect((rows()[0].querySelector('.confirm-action-ask') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('clears the old messages when a new request starts', () => {
    open([patient(1), patient(2)]);

    click('.confirm-action-ask');
    click('.confirm-action-yes');
    http.expectOne('/api/v1/patients/1/force-password-change').flush(patient(1, { mustChangePassword: true }));
    fixture.detectChanges();
    expect(element().querySelector('.alert-success')).not.toBeNull();

    (rows()[1].querySelector('.confirm-action-ask') as HTMLButtonElement).click();
    fixture.detectChanges();
    (rows()[1].querySelector('.confirm-action-yes') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')).toBeNull();
    http.expectOne('/api/v1/patients/2/force-password-change').flush(patient(2, { mustChangePassword: true }));
  });
});