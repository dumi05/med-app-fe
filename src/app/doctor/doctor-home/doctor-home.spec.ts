import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DoctorHome } from './doctor-home';

// The clock is stopped at Wednesday 4 November 2026, 12:00.
const NOW = new Date(2026, 10, 4, 12, 0, 0);

const appointment = (id: number, status: string, startTime: string, risk = false) => ({
  id, status, patientId: id, patientFirstName: 'Anna', patientLastName: `Paziente${id}`, noShowRisk: risk,
  slot: { id: 100 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi', startTime, durationMinutes: 30, booked: true },
});

const slot = (id: number, startTime: string, booked = false) => ({
  id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi', startTime, durationMinutes: 30, booked,
});

const delegation = (id: number, status: string, delegatingDoctorId: number, delegateDoctorId: number) => ({
  id, status, startDate: '2026-11-10', endDate: '2026-11-20', delegatingDoctorId, delegateDoctorId,
  delegatingDoctorFirstName: 'A', delegatingDoctorLastName: 'B', delegateDoctorFirstName: 'C', delegateDoctorLastName: 'D',
});

describe('DoctorHome', () => {
  let fixture: ComponentFixture<DoctorHome>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const stat = (label: string) =>
    Array.from(element().querySelectorAll('app-stat-card')).find((card) => card.textContent!.includes(label))!
      .querySelector('.stat-value')!.textContent;
  const slotsMe = (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/slots/me' && r.params.get('from') === '2026-11-04' && r.params.get('to') === '2026-11-10';

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
    await TestBed.configureTestingModule({
      imports: [DoctorHome],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DoctorHome);
    fixture.detectChanges();
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  /** The four requests of the opening. */
  const open = (appointments: unknown[] = [], slots: unknown[] = [slot(1, '2026-11-05T09:00:00')], delegations: unknown[] = []) => {
    http.expectOne('/api/v1/appointments/me').flush(appointments);
    http.expectOne(slotsMe).flush(slots);
    http.expectOne('/api/v1/doctors/me').flush({ id: 1, firstName: 'Luca', lastName: 'Verdi', specializationId: 1, specialization: 'Cardiologia' });
    http.expectOne('/api/v1/doctor-delegations/me').flush(delegations);
    fixture.detectChanges();
  };

  // ---- counters -------------------------------------------------------------------------------

  it('counts the visits of today, the ones to complete and the ones to report', () => {
    open([
      appointment(1, 'BOOKED', '2026-11-04T08:30:00'),    // today, already begun: today AND to complete
      appointment(2, 'BOOKED', '2026-11-04T15:00:00'),    // today, still to come
      appointment(3, 'BOOKED', '2026-11-02T10:00:00'),    // a past day: to complete
      appointment(4, 'BOOKED', '2026-11-06T10:00:00'),    // future: counts nowhere
      appointment(5, 'COMPLETED', '2026-11-03T10:00:00'), // to report
      appointment(6, 'COMPLETED', '2026-11-01T10:00:00'), // to report
      appointment(7, 'CANCELLED', '2026-11-04T10:00:00'), // counts nowhere
      appointment(8, 'INVOICED', '2026-11-04T09:00:00'),  // counts nowhere
    ]);

    expect(stat('Visite di oggi')).toBe('2');
    expect(stat('Da completare')).toBe('2');
    expect(stat('Da refertare')).toBe('2');
  });

  it('counts only the free slots that are still to come', () => {
    open([], [
      slot(1, '2026-11-04T08:00:00'),         // today, but gone
      slot(2, '2026-11-04T16:00:00'),         // today, free
      slot(3, '2026-11-05T09:00:00'),         // free
      slot(4, '2026-11-05T09:30:00', true),   // booked
    ]);

    expect(stat('Posti liberi')).toBe('2');
  });

  it('asks for the slots of the next 7 days, today included', () => {
    http.expectOne(slotsMe).flush([]);
    http.expectOne('/api/v1/appointments/me').flush([]);
    http.expectOne('/api/v1/doctors/me').flush({ id: 1 });
    http.expectOne('/api/v1/doctor-delegations/me').flush([]);
  });

  // ---- the day --------------------------------------------------------------------------------

  it('lists the visits of today by hour, with the patient and the risk of no-show', () => {
    open([
      appointment(2, 'BOOKED', '2026-11-04T15:00:00', true),
      appointment(1, 'BOOKED', '2026-11-04T08:30:00'),
      appointment(3, 'BOOKED', '2026-11-05T09:00:00'),
    ]);

    const items = Array.from(element().querySelectorAll('li.list-group-item'));
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('08:30');
    expect(items[0].textContent).toContain('Anna Paziente1');
    expect(items[0].querySelector('.badge')).toBeNull();
    expect(items[1].textContent).toContain('15:00');
    expect(items[1].querySelector('.badge')?.textContent).toContain('Rischio no-show');
  });

  it('says so when there are no visits today', () => {
    open([appointment(1, 'BOOKED', '2026-11-05T09:00:00')]);

    expect(element().querySelector('.no-visits-today')?.textContent).toContain('Nessuna visita oggi');
  });

  // ---- notices --------------------------------------------------------------------------------

  it('warns about the proposals of delegation received and not answered yet', () => {
    open([], [slot(1, '2026-11-05T09:00:00')], [
      delegation(1, 'PROPOSED', 2, 1),   // proposed to me
      delegation(2, 'PROPOSED', 3, 1),   // proposed to me
      delegation(3, 'PROPOSED', 1, 2),   // proposed BY me: not mine to answer
      delegation(4, 'ACCEPTED', 2, 1),   // already answered
      delegation(5, 'REJECTED', 3, 1),   // already answered
    ]);

    const notice = element().querySelector('.pending-delegations');
    expect(notice?.textContent).toContain('Hai 2 deleghe da accettare');
    expect(notice?.querySelector('a')?.getAttribute('href')).toBe('/doctor/delegations');
  });

  it('writes the singular for one proposal', () => {
    open([], [slot(1, '2026-11-05T09:00:00')], [delegation(1, 'PROPOSED', 2, 1)]);

    expect(element().querySelector('.pending-delegations')?.textContent).toContain('Hai 1 delega da accettare');
  });

  it('shows no notice of delegations when there is none to answer', () => {
    open([], [slot(1, '2026-11-05T09:00:00')], [delegation(1, 'PROPOSED', 1, 2)]);

    expect(element().querySelector('.pending-delegations')).toBeNull();
  });

  it('warns when there is no free slot in the next 7 days, pointing to the agenda', () => {
    open([], [slot(1, '2026-11-05T09:00:00', true)]);

    const notice = element().querySelector('.no-free-slots');
    expect(notice?.textContent).toContain('Non hai posti liberi nei prossimi 7 giorni');
    expect(notice?.querySelector('a')?.getAttribute('href')).toBe('/doctor/schedule');
  });

  it('does not warn about the slots before it knows them', () => {
    expect(element().querySelector('.no-free-slots')).toBeNull();
    open();
  });

  // ---- errors and shortcuts -------------------------------------------------------------------

  it('shows one message when the sources fail for the same reason, and keeps the shortcuts', () => {
    const fail = { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' };
    const options = { status: 500, statusText: 'Server Error' };
    http.expectOne('/api/v1/appointments/me').flush(fail, options);
    http.expectOne(slotsMe).flush(fail, options);
    http.expectOne('/api/v1/doctor-delegations/me').flush([]);
    http.expectOne('/api/v1/doctors/me').flush(fail, options);
    fixture.detectChanges();

    expect(element().querySelectorAll('.alert-danger').length).toBe(1);
    expect(element().querySelectorAll('a.shortcut').length).toBeGreaterThan(0);
  });

  it('keeps showing what it could load when only one source fails', () => {
    http.expectOne('/api/v1/appointments/me').flush([appointment(1, 'COMPLETED', '2026-11-03T10:00:00')]);
    http.expectOne(slotsMe).flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/v1/doctors/me').flush({ id: 1 });
    http.expectOne('/api/v1/doctor-delegations/me').flush([]);
    fixture.detectChanges();

    expect(stat('Da refertare')).toBe('1');
    expect(element().querySelectorAll('.alert-danger').length).toBe(1);
  });
});