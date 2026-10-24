import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DelegationReports } from './delegation-reports';

const REPORT = {
  visitDate: '2026-10-20T09:30:00', doctorFirstName: 'Giulia', doctorLastName: 'Verdi', specialization: 'Cardiologia',
  diagnosisText: 'Nessuna criticità riscontrata.', attachmentUrl: null, completedAt: '2026-10-20T10:15:00Z',
};

describe('DelegationReports', () => {
  let fixture: ComponentFixture<DelegationReports>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelegationReports],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'abc-123' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DelegationReports);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const answer = (body: object[]) => {
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports').flush(body);
    fixture.detectChanges();
  };

  it('asks for the reports of the token in the address', () => {
    const req = http.expectOne('/api/v1/report-delegations/abc-123/medical-reports');

    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('shows the reports with specialization, doctor, dates and text', () => {
    answer([REPORT]);

    const text = element().textContent;
    expect(text).toContain('Cardiologia');
    expect(text).toContain('Giulia Verdi');
    expect(text).toContain('20/10/2026 09:30');
    expect(text).toContain('Nessuna criticità riscontrata.');
  });

  it('shows the attachment link only when there is an attachment, safe for the token in the address', () => {
    answer([REPORT, { ...REPORT, completedAt: '2026-10-21T10:15:00Z', attachmentUrl: 'https://files.example/referto.pdf' }]);

    const links = element().querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('https://files.example/referto.pdf');
    expect(links[0].getAttribute('rel')).toContain('noreferrer');
  });

  it('says so when there are no reports yet', () => {
    answer([]);

    expect(element().textContent).toContain('Non ci sono ancora referti disponibili.');
  });

  it('explains that the link is not valid anymore, whatever the reason', () => {
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports').flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'x', timestamp: 'x' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non è valido o non è più attivo');
    expect(element().querySelector('.card')).toBeNull();
  });

  it('shows the generic Italian message for the other errors', () => {
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports').flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
  });

  it('keeps the address out of the Referer header and out of the search engines, and only while it is open', () => {
    const meta = TestBed.inject(Meta);
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports').flush([]);

    expect(meta.getTag('name="referrer"')?.content).toBe('no-referrer');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');

    fixture.destroy();

    expect(meta.getTag('name="referrer"')).toBeNull();
    expect(meta.getTag('name="robots"')).toBeNull();
  });
});