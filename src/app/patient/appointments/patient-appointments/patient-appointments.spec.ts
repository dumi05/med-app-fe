import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../../shared/http/error.interceptor';
import { PatientAppointments } from './patient-appointments';
import { provideRouter } from '@angular/router';

const appointment = (id: number, status: string) => ({
  id, status, patientId: 1, patientFirstName: 'Anna', patientLastName: 'Bianchi', noShowRisk: null,
  slot: { id: 10 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
          startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: true },
});

describe('PatientAppointments', () => {
  let fixture: ComponentFixture<PatientAppointments>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointments],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(PatientAppointments);
    fixture.detectChanges();
    http.expectOne('/api/v1/appointments/me').flush(list);
    fixture.detectChanges();
  };

  it('shows one row per appointment with its status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'CANCELLED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Verdi');
    expect(rows[0].textContent).toContain('Prenotata');
    expect(rows[1].textContent).toContain('Cancellata');
  });

  it('shows the cancel button only for booked appointments', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'CANCELLED')]);

    expect(element().querySelectorAll('tbody button').length).toBe(1);
  });

  it('shows a message when there are no appointments', () => {
    open([]);

    expect(element().textContent).toContain('Non hai ancora prenotazioni');
    expect(element().querySelector('table')).toBeNull();
  });

  it('cancels an appointment and updates its status in the table', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/appointments/1/cancel');
    expect(req.request.method).toBe('POST');
    req.flush(appointment(1, 'CANCELLED'));
    fixture.detectChanges();

    expect(element().querySelectorAll('tbody tr').length).toBe(1);
    expect(element().querySelector('tbody')!.textContent).toContain('Cancellata');
    expect(element().querySelectorAll('tbody button').length).toBe(0);
  });

  it('shows the Italian message when the cancellation is refused', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/1/cancel').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
  });
  it('offers the report link when the report is available', () => {
    open([appointment(1, 'INVOICED'), appointment(2, 'BOOKED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Referto disponibile');
    expect(rows[0].querySelector('a')!.textContent).toContain('Vedi referto');
    expect(rows[1].querySelector('a')).toBeNull();
  });

  it('says when the studio made the booking, and says nothing when the patient did', () => {
    open([
      { ...appointment(1, 'BOOKED'), bookedByRole: 'DOCTOR' },
      { ...appointment(2, 'BOOKED'), bookedByRole: 'ADMIN' },
      { ...appointment(3, 'BOOKED'), bookedByRole: 'PATIENT' },
      appointment(4, 'BOOKED'),
    ]);

    const notes = Array.from(element().querySelectorAll('tbody tr')).map((row) => row.querySelector('.booked-by-studio') !== null);
    expect(notes).toEqual([true, true, false, false]);
  });
});