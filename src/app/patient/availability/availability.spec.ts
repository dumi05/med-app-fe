import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Availability } from './availability';

describe('Availability', () => {
  let fixture: ComponentFixture<Availability>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const isAvailabilityRequest = (specializationId: string, date: string) => (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/availability' &&
    r.params.get('specializationId') === specializationId &&
    r.params.get('date') === date;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Availability],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Availability);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

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

  const search = () => {
    setValue('specializationId', '1');
    setValue('date', '2026-10-20');
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('shows nothing before the first search', () => {
    expect(element().querySelector('table')).toBeNull();
    expect(element().textContent).not.toContain('Nessuna disponibilità');
  });

  it('doesn\'t search when the form is not valid', () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectNone((r) => r.url === '/api/v1/schedule/availability');
    expect(element().querySelectorAll('.is-invalid').length).toBe(2);
  });

  it('shows one row per free slot', () => {
    search();

    http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush([
      { id: 10, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
        startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: false },
    ]);
    fixture.detectChanges();

    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Verdi');
    expect(rows[0].textContent).toContain('09:30');
  });

  it('shows a message when there is no availability', () => {
    search();

    http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush([]);
    fixture.detectChanges();

    expect(element().textContent).toContain('Nessuna disponibilità');
    expect(element().querySelector('table')).toBeNull();
  });

  it('shows a message when the backend fails', () => {
    search();

    http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush(
      { code: 'SERVER_ERROR', message: 'boom', timestamp: 'x' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert')?.textContent).toContain('errore imprevisto');
  });

  const FREE_SLOT = { id: 10, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
                    startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: false };

const bookFirstSlot = () => {
  search();
  http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush([FREE_SLOT]);
  fixture.detectChanges();
  (element().querySelector('tbody button') as HTMLButtonElement).click();
};

it('books the slot, confirms and reloads the list', () => {
  bookFirstSlot();

  const req = http.expectOne('/api/v1/appointments');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual({ slotId: 10 });
  req.flush({ id: 5, status: 'BOOKED', slot: { ...FREE_SLOT, booked: true }, patientId: 1,
              patientFirstName: 'Anna', patientLastName: 'Bianchi', noShowRisk: null });

  http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush([]);
  fixture.detectChanges();

  expect(element().querySelector('.alert-success')?.textContent).toContain('Prenotazione confermata');
  expect(element().textContent).toContain('Nessuna disponibilità');
});

it('shows the message and reloads the list when the slot was taken by someone else', () => {
  bookFirstSlot();

  http.expectOne('/api/v1/appointments').flush(
    { code: 'SLOT_NOT_AVAILABLE', message: 'taken', timestamp: 'x' },
    { status: 409, statusText: 'Conflict' },
  );
  http.expectOne(isAvailabilityRequest('1', '2026-10-20')).flush([]);
  fixture.detectChanges();

  expect(element().querySelector('.alert-danger')?.textContent).toContain('fascia oraria');
  expect(element().querySelector('.alert-success')).toBeNull();
});
});