import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DelegationReports } from './delegation-reports';

const REPORT = {
  id: 7, visitDate: '2026-10-20T09:30:00', doctorFirstName: 'Giulia', doctorLastName: 'Verdi', specialization: 'Cardiologia',
  diagnosisText: 'Nessuna criticità riscontrata.', attachmentAvailable: false, completedAt: '2026-10-20T10:15:00Z',
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

  it('shows the download button only for the reports whose attachment is available', () => {
    answer([REPORT, { ...REPORT, id: 8, attachmentAvailable: true }]);

    const buttons = element().querySelectorAll('.download-button');
    expect(buttons.length).toBe(1);
    expect(element().querySelectorAll('.card')[1].contains(buttons[0])).toBeTrue();
  });

  it('downloads the attachment of the report with the token in the address', () => {
    const clicked: HTMLAnchorElement[] = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    answer([{ ...REPORT, id: 8, attachmentAvailable: true }]);

    (element().querySelector('.download-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports/8/attachment').flush(
      new Blob(['%PDF-1.4']), { headers: { 'Content-Disposition': 'attachment; filename="referto-8.pdf"' } });
    fixture.detectChanges();

    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('referto-8.pdf');
    expect(element().querySelector('.alert-danger')).toBeNull();
  });

  it('says that the attachment is not available when the server answers 404, and keeps the reports on screen', () => {
    answer([{ ...REPORT, id: 8, attachmentAvailable: true }]);

    (element().querySelector('.download-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/report-delegations/abc-123/medical-reports/8/attachment').flush(
      new Blob(['{}']), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non è disponibile');
    expect(element().querySelector('.card')).not.toBeNull();
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