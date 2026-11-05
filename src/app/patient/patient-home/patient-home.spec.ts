import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { PatientHome } from './patient-home';

// The clock is stopped at Wednesday 4 November 2026, 12:00, so that "past", "today" and "to come" are not a matter of luck.
const NOW = new Date(2026, 10, 4, 12, 0, 0);

const appointment = (id: number, status: string, startTime: string, doctorLastName = 'Verdi') => ({
  id, status, patientId: 1, patientFirstName: 'Mario', patientLastName: 'Rossi', noShowRisk: null,
  slot: { id: 100 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName, startTime, durationMinutes: 30, booked: true },
});

describe('PatientHome', () => {
  let fixture: ComponentFixture<PatientHome>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
    await TestBed.configureTestingModule({
      imports: [PatientHome],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PatientHome);
    fixture.detectChanges();
  });

  afterEach(() => {
    try {
      http.match('/api/v1/news').forEach((request) => request.flush([]));
      http.verify();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  const open = (appointments: unknown[]) => {
    http.expectOne('/api/v1/appointments/me').flush(appointments);
    fixture.detectChanges();
  };

  // ---- next visit -----------------------------------------------------------------------------

  it('shows the nearest visit still to come, with day, hour, doctor and duration', () => {
    open([
      appointment(1, 'BOOKED', '2026-11-20T09:00:00', 'Neri'),
      appointment(2, 'BOOKED', '2026-11-06T10:30:00', 'Bianchi'),
    ]);

    const text = element().querySelector('.next-visit')?.textContent ?? '';
    expect(text).toContain('venerdì 6 novembre alle 10:30');
    expect(element().textContent).toContain('con Luca Bianchi');
    expect(element().textContent).toContain('30 min');
  });

  it('does not take as next a visit of the past, a cancelled one or one with a report', () => {
    open([
      appointment(1, 'BOOKED', '2026-11-04T08:00:00'),     // earlier today: the time has gone
      appointment(2, 'CANCELLED', '2026-11-05T09:00:00'),
      appointment(3, 'INVOICED', '2026-11-03T09:00:00'),
      appointment(4, 'BOOKED', '2026-11-12T09:00:00', 'Neri'),
    ]);

    expect(element().querySelector('.next-visit')?.textContent).toContain('giovedì 12 novembre');
  });

  it('counts a visit later today as the next one', () => {
    open([appointment(1, 'BOOKED', '2026-11-04T17:00:00')]);

    expect(element().querySelector('.next-visit')?.textContent).toContain('mercoledì 4 novembre alle 17:00');
  });

  it('invites to look for a slot when there is no visit to come', () => {
    open([]);

    expect(element().querySelector('.no-next-visit')?.textContent).toContain('Non hai visite prenotate');
    expect(element().querySelector('a[href="/patient/availability"]')).not.toBeNull();
  });

  // ---- reports --------------------------------------------------------------------------------

  it('lists the latest three reports, the most recent first, each with a link to it', () => {
    open([
      appointment(1, 'REPORTED', '2026-10-01T09:00:00'),
      appointment(2, 'INVOICED', '2026-10-20T09:00:00'),
      appointment(3, 'INVOICED', '2026-10-10T09:00:00'),
      appointment(4, 'INVOICED', '2026-09-15T09:00:00'),
      appointment(5, 'COMPLETED', '2026-10-30T09:00:00'),   // no report yet
    ]);

    const items = Array.from(element().querySelectorAll('li'));
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('20/10/2026');
    expect(items[1].textContent).toContain('10/10/2026');
    expect(items[2].textContent).toContain('01/10/2026');
    expect(items[0].querySelector('a')?.getAttribute('href')).toBe('/patient/appointments/2/report');
  });

  it('says so when there are no reports yet', () => {
    open([appointment(1, 'BOOKED', '2026-11-12T09:00:00')]);

    expect(element().querySelector('.no-reports')?.textContent).toContain('Non hai ancora referti');
  });

  // ---- shortcuts and errors -------------------------------------------------------------------

  it('has the shortcuts of the menu of the patient, even before the data arrives', () => {
    const hrefs = Array.from(element().querySelectorAll('a.shortcut')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/patient/availability');
    expect(hrefs).toContain('/patient/appointments');
    expect(hrefs).not.toContain('/patient');
    open([]);
  });

  it('shows the Italian message when the visits cannot be loaded, and keeps the shortcuts', () => {
    http.expectOne('/api/v1/appointments/me').flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
    expect(element().querySelectorAll('a.shortcut').length).toBeGreaterThan(0);
  });

  it('shows the notices of the studio in the Home', () => {
    open([]);
    http.expectOne('/api/v1/news').flush([
      { id: 1, title: 'Studio chiuso il 24', body: 'Riapriamo il 27.', authorFirstName: 'Mario', authorLastName: 'Rossi',
        createdAt: '2026-11-02T09:00:00', expiresAt: '2026-12-24', automatic: false },
    ]);
    fixture.detectChanges();

    expect(element().querySelector('app-news-card')?.textContent).toContain('Studio chiuso il 24');
  });
  
  it('warns about the visits to come that the absence of a doctor moved or cancelled, and only those', () => {
    open([
      { ...appointment(1, 'BOOKED', '2026-11-12T09:00:00', 'Bianchi'), reassignedFromName: 'Mario Rossi' },
      { ...appointment(2, 'CANCELLED', '2026-11-13T09:00:00'), cancellationReason: 'DOCTOR_ABSENCE' },
      { ...appointment(3, 'CANCELLED', '2026-10-01T09:00:00'), cancellationReason: 'DOCTOR_ABSENCE' },
      { ...appointment(4, 'CANCELLED', '2026-11-14T09:00:00'), cancellationReason: 'PATIENT' },
      appointment(5, 'BOOKED', '2026-11-15T09:00:00'),
      // moved to a colleague, and then cancelled by the patient: it is not a change of the absence any more
      { ...appointment(6, 'CANCELLED', '2026-11-16T09:00:00'), reassignedFromName: 'Mario Rossi', cancellationReason: 'PATIENT' },
    ]);

    const items = element().querySelectorAll('.changed-visits li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('spostata');
    expect(items[0].textContent).toContain('era con il dott. Mario Rossi');
    expect(items[0].textContent).toContain('Luca Bianchi');
    expect(items[1].textContent).toContain('annullata');
  });

  it('does not show the warning when no visit was changed by an absence', () => {
    open([appointment(1, 'BOOKED', '2026-11-12T09:00:00'), { ...appointment(2, 'CANCELLED', '2026-11-13T09:00:00'), cancellationReason: 'PATIENT' }]);

    expect(element().querySelector('.changed-visits')).toBeNull();
  });
});