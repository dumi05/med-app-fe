import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MedicalReportService } from './medical-report.service';

const REPORT = { id: 3, appointmentId: 5, diagnosisText: 'Nessun rilievo.', attachmentUrl: null,
                 completedAt: '2026-10-20T09:45:00Z' };

describe('MedicalReportService', () => {
  let http: HttpTestingController;
  let service: MedicalReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(MedicalReportService);
  });

  afterEach(() => http.verify());

  it('creates a report sending the request as body', () => {
    let result: unknown;
    service.createReport({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' }).subscribe((v) => (result = v));

    const req = http.expectOne('/api/v1/medical-reports');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' });
    req.flush(REPORT);

    expect((result as { id: number }).id).toBe(3);
  });

  it('loads the report of an appointment', () => {
    let result: unknown;
    service.getReportByAppointment(5).subscribe((v) => (result = v));

    const req = http.expectOne((r) => r.url === '/api/v1/medical-reports' && r.params.get('appointmentId') === '5');
    expect(req.request.method).toBe('GET');
    req.flush(REPORT);

    expect((result as { appointmentId: number }).appointmentId).toBe(5);
  });
});