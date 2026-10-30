import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MedicalReportService } from './medical-report.service';

const REPORT = { id: 3, appointmentId: 5, diagnosisText: 'Nessun rilievo.', attachment: null,
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

  it('creates a report as a multipart request whose part "report" holds the JSON', async () => {
    let result: unknown;
    service.createReport({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' }).subscribe((v) => (result = v));

    const req = http.expectOne('/api/v1/medical-reports');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    const part = body.get('report') as Blob;
    expect(part.type).toBe('application/json');
    expect(JSON.parse(await part.text())).toEqual({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' });
    expect(body.has('file')).toBeFalse();
    req.flush(REPORT);

    expect((result as { id: number }).id).toBe(3);
  });

  it('adds the file as the part "file" when there is one', () => {
    const file = new File(['%PDF-1.4'], 'esame.pdf', { type: 'application/pdf' });
    service.createReport({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' }, file).subscribe();

    const req = http.expectOne('/api/v1/medical-reports');
    const sent = (req.request.body as FormData).get('file') as File;
    expect(sent.name).toBe('esame.pdf');
    expect(sent.type).toBe('application/pdf');
    req.flush(REPORT);
  });

  it('loads the report of an appointment', () => {
    let result: unknown;
    service.getReportByAppointment(5).subscribe((v) => (result = v));

    const req = http.expectOne((r) => r.url === '/api/v1/medical-reports' && r.params.get('appointmentId') === '5');
    expect(req.request.method).toBe('GET');
    req.flush(REPORT);

    expect((result as { appointmentId: number }).appointmentId).toBe(5);
  });

  it('downloads the attachment as a file, keeping the headers', () => {
    const seen = { name: null as string | null, size: 0 };
    service.downloadAttachment(3).subscribe((response) => {
      seen.name = response.headers.get('Content-Disposition');
      seen.size = response.body!.size;
    });

    const req = http.expectOne('/api/v1/medical-reports/3/attachment');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF-1.4']), { headers: { 'Content-Disposition': 'attachment; filename="referto-3.pdf"' } });

    expect(seen.name).toBe('attachment; filename="referto-3.pdf"');
    expect(seen.size).toBe(8);
  });
});