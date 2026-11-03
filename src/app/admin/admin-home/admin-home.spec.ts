import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { AdminHome } from './admin-home';

const KPI = {
  totalAppointments: 42, appointmentsByStatus: {}, upcomingAtRisk: 3, attendanceRate: 0.875,
  totalRevenue: 12500.5, revenueBySpecialization: [],
};

const doctor = (id: number, active: boolean) => ({
  id, firstName: 'Luca', lastName: `Medico${id}`, email: `m${id}@studio.it`, specializationId: 1,
  specialization: 'Cardiologia', delegationConsent: true, active,
});

const entry = (id: number, action: string, outcome = 'SUCCESS', entityId: number | null = 7) => ({
  id, userEmail: `utente${id}@studio.it`, action, entityName: 'MedicalReport', entityId,
  occurredAt: '2026-11-04T10:30:00Z', outcome, failureReason: outcome === 'FAILURE' ? 'UnauthorizedAccessException' : null,
});

describe('AdminHome', () => {
  let fixture: ComponentFixture<AdminHome>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
  const card = (label: string) =>
    Array.from(element().querySelectorAll('app-stat-card')).find((c) => c.textContent!.includes(label))!;
  const rows = () => element().querySelectorAll('.activity-table tbody tr');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHome],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminHome);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** The three requests of the opening. */
  const open = (kpi: unknown = KPI, doctors: unknown[] = [], activity: unknown[] = []) => {
    http.expectOne('/api/v1/dashboard/kpi').flush(kpi as object);
    http.expectOne('/api/v1/doctors/admin').flush(doctors);
    http.expectOne((r) => r.url === '/api/v1/audit-logs' && r.params.get('limit') === '10').flush(activity);
    fixture.detectChanges();
  };

  // ---- indicators -----------------------------------------------------------------------------

  it('shows the four indicators of the dashboard, with money in euro and the rate in percent', () => {
    open();

    expect(card('Visite totali').querySelector('.stat-value')?.textContent).toBe('42');
    expect(plain(card('Ricavi').querySelector('.stat-value')?.textContent)).toBe('12.500,50 €');
    expect(plain(card('Presenze').querySelector('.stat-value')?.textContent)).toBe('88%');
    expect(card('A rischio no-show').querySelector('.stat-value')?.textContent).toBe('3');
  });

  it('links each indicator to the dashboard', () => {
    open();

    const links = ['Visite totali', 'Ricavi', 'Presenze', 'A rischio no-show']
      .map((label) => card(label).querySelector('a')?.getAttribute('href'));
    expect(links).toEqual(['/admin/dashboard', '/admin/dashboard', '/admin/dashboard', '/admin/dashboard']);
  });

  // ---- doctors --------------------------------------------------------------------------------

  it('counts the active and the deactivated doctors', () => {
    open(KPI, [doctor(1, true), doctor(2, true), doctor(3, true), doctor(4, false)]);

    expect(card('Medici').querySelector('.stat-value')?.textContent).toBe('3 attivi');
    expect(card('Medici').querySelector('.stat-hint')?.textContent).toContain('1 disattivato');
    expect(card('Medici').querySelector('a')?.getAttribute('href')).toBe('/admin/doctors');
  });

  it('writes the plural for the deactivated doctors', () => {
    open(KPI, [doctor(1, true), doctor(2, false), doctor(3, false)]);

    expect(card('Medici').querySelector('.stat-hint')?.textContent).toContain('2 disattivati');
  });

  // ---- latest activity ------------------------------------------------------------------------

  it('lists the latest activity with the action in words and the outcome', () => {
    open(KPI, [], [entry(1, 'BOOK_APPOINTMENT'), entry(2, 'READ_REPORT', 'FAILURE')]);

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('utente1@studio.it');
    expect(rows()[0].textContent).toContain('Prenotazione di una visita');
    expect(rows()[0].textContent).toContain('MedicalReport #7');
    expect(rows()[0].textContent).toMatch(/\d{2}\/\d{2}\/2026 \d{2}:\d{2}/);
    expect(rows()[0].querySelector('.badge')?.textContent).toContain('Riuscito');
    expect(rows()[1].querySelector('.badge')?.textContent).toContain('Negato');
    expect(rows()[1].querySelector('.badge')?.getAttribute('title')).toBe('UnauthorizedAccessException');
  });

  it('shows an action that it does not know as it is, and a record without id without the number', () => {
    open(KPI, [], [entry(1, 'SOMETHING_NEW', 'SUCCESS', null)]);

    expect(rows()[0].textContent).toContain('SOMETHING_NEW');
    expect(rows()[0].textContent).not.toContain('#');
  });

  it('says so when nothing has been registered yet', () => {
    open(KPI, [], []);

    expect(element().querySelector('.no-activity')?.textContent).toContain('Nessuna attività registrata');
    expect(element().querySelector('.activity-table')).toBeNull();
  });

  // ---- shortcuts and errors -------------------------------------------------------------------

  it('has the shortcuts of the menu of the admin', () => {
    open();

    const hrefs = Array.from(element().querySelectorAll('a.shortcut')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/admin/doctors', '/admin/schedule','/admin/book', '/admin/hours', '/admin/specializations', '/admin/dashboard', '/admin/price-list']);
  });

  it('shows an error only in the block that failed, and still shows the others', () => {
    const fail = { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' };
    http.expectOne('/api/v1/dashboard/kpi').flush(KPI);
    http.expectOne('/api/v1/doctors/admin').flush([doctor(1, true)]);
    http.expectOne((r) => r.url === '/api/v1/audit-logs').flush(fail, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.activity-error')?.textContent).toContain('errore imprevisto');
    expect(element().querySelector('.kpi-error')).toBeNull();
    expect(card('Visite totali')).toBeTruthy();
    expect(card('Medici')).toBeTruthy();
    expect(element().querySelectorAll('a.shortcut').length).toBe(7);
  });

  it('shows the error of the indicators and keeps the log', () => {
    const fail = { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' };
    http.expectOne('/api/v1/dashboard/kpi').flush(fail, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/v1/doctors/admin').flush([]);
    http.expectOne((r) => r.url === '/api/v1/audit-logs').flush([entry(1, 'BOOK_APPOINTMENT')]);
    fixture.detectChanges();

    expect(element().querySelector('.kpi-error')).not.toBeNull();
    expect(rows().length).toBe(1);
  });
});