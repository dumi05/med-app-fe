import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../../shared/http/error.interceptor';
import { DoctorVisits } from './doctor-visits';

const appointment = (id: number, status: string, noShowRisk = false) => ({
  id, status, noShowRisk, patientId: 1, patientFirstName: 'Anna', patientLastName: 'Bianchi',
  slot: { id: 10 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
          startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: true },
});

describe('DoctorVisits', () => {
  let fixture: ComponentFixture<DoctorVisits>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorVisits],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(DoctorVisits);
    fixture.detectChanges();
    http.expectOne('/api/v1/appointments/me').flush(list);
    fixture.detectChanges();
  };

  it('shows one row per appointment with the patient and the status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'COMPLETED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Anna Bianchi');
    expect(rows[0].textContent).toContain('Prenotata');
    expect(rows[1].textContent).toContain('Visita effettuata');
  });

  it('flags the appointments with no-show risk', () => {
    open([appointment(1, 'BOOKED', true), appointment(2, 'BOOKED', false)]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Rischio no-show');
    expect(rows[1].textContent).not.toContain('Rischio no-show');
  });

  it('offers the right action for each status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'COMPLETED'), appointment(3, 'INVOICED'), appointment(4, 'CANCELLED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].querySelector('button')!.textContent).toContain('Completa visita');
    expect(rows[1].querySelector('a')!.textContent).toContain('Scrivi referto');
    expect(rows[2].querySelector('a')!.textContent).toContain('Vedi referto');
    expect(rows[3].querySelector('button, a')).toBeNull();
  });

  it('completes a visit and updates the row', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/appointments/1/complete');
    expect(req.request.method).toBe('POST');
    req.flush(appointment(1, 'COMPLETED'));
    fixture.detectChanges();

    const row = element().querySelector('tbody tr')!;
    expect(row.textContent).toContain('Visita effettuata');
    expect(row.querySelector('a')!.textContent).toContain('Scrivi referto');
    expect(row.querySelector('button')).toBeNull();
  });

  it('shows a message when there are no appointments', () => {
    open([]);
    expect(element().textContent).toContain('Non hai ancora visite');
  });

  it('shows the Italian message when the completion is refused', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/1/complete').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
  });
});