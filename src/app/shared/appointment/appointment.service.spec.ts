import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppointmentService } from './appointment.service';

const APPOINTMENT = {
  id: 5, status: 'BOOKED', patientId: 1, patientFirstName: 'Anna', patientLastName: 'Bianchi', noShowRisk: null,
  slot: { id: 10, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
          startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: true },
};

describe('AppointmentService', () => {
  let http: HttpTestingController;
  let service: AppointmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AppointmentService);
  });

  afterEach(() => http.verify());

  it('books a slot sending the slot id', () => {
    let result: unknown;
    service.createAppointment(10).subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ slotId: 10 });
    req.flush(APPOINTMENT);

    expect((result as { id: number }).id).toBe(5);
  });

  it('cancels an appointment', () => {
    let result: unknown;
    service.cancelAppointment(5).subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/appointments/5/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ ...APPOINTMENT, status: 'CANCELLED' });

    expect((result as { status: string }).status).toBe('CANCELLED');
  });

  it('loads the appointments of the logged user', () => {
    let result: unknown;
    service.getMyAppointments().subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/appointments/me');
    expect(req.request.method).toBe('GET');
    req.flush([APPOINTMENT]);

    expect((result as unknown[]).length).toBe(1);
  });
});