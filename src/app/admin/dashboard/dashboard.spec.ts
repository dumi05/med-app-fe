import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;

  const KPI = {
    totalAppointments: 12,
    appointmentsByStatus: { BOOKED: 5, COMPLETED: 2, CANCELLED: 1, REPORTED: 1, INVOICED: 3 },
    upcomingAtRisk: 2,
    attendanceRate: 0.75,
    totalRevenue: 230,
    revenueBySpecialization: [
      { specialization: 'Cardiologia', revenue: 150 },
      { specialization: 'Dermatologia', revenue: 80 },
    ],
  };

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => (element().textContent ?? '').replace(/ /g, ' ');
  const canvases = () => Array.from(element().querySelectorAll('canvas'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the indicators once the KPI arrive', () => {
    http.expectOne('/api/v1/dashboard/kpi').flush(KPI);
    fixture.detectChanges();

    expect(text()).toContain('12');
    expect(text()).toContain('75%');
    expect(text()).toContain('230,00 €');
    expect(text()).toContain('2');
  });

  it('draws the appointments by status in the order of the pipeline', () => {
    http.expectOne('/api/v1/dashboard/kpi').flush(KPI);
    fixture.detectChanges();

    const chart = Chart.getChart(canvases()[0])!;
    expect(chart.data.labels).toEqual(['Prenotate', 'Visite effettuate', 'Refertate', 'Fatturate', 'Cancellate']);
    expect(chart.data.datasets[0].data).toEqual([5, 2, 1, 3, 1]);
  });

  it('draws the revenue by specialization', () => {
    http.expectOne('/api/v1/dashboard/kpi').flush(KPI);
    fixture.detectChanges();

    const chart = Chart.getChart(canvases()[1])!;
    expect(chart.data.labels).toEqual(['Cardiologia', 'Dermatologia']);
    expect(chart.data.datasets[0].data).toEqual([150, 80]);
  });

  it('says so when no invoice has been issued yet', () => {
    http.expectOne('/api/v1/dashboard/kpi').flush({ ...KPI, totalRevenue: 0, revenueBySpecialization: [] });
    fixture.detectChanges();

    expect(text()).toContain('Nessuna fattura emessa');
    expect(canvases().length).toBe(1);
  });

  it('shows the Italian message when the backend refuses', () => {
    http.expectOne('/api/v1/dashboard/kpi').flush(
      { code: 'UNAUTHORIZED_ACCESS', message: 'denied', timestamp: 'x' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('permessi');
  });
});