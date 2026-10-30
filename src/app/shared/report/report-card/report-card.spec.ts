import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../http/error.interceptor';
import { MedicalReport } from '../medical-report.model';
import { ReportCard } from './report-card';

const REPORT: MedicalReport = {
  id: 3, appointmentId: 5, diagnosisText: 'Nessun rilievo.\nControllo tra 6 mesi.',
  attachment: null, completedAt: '2026-10-20T09:45:00',
};
const WITH_FILE: MedicalReport = { ...REPORT, attachment: { contentType: 'application/pdf', sizeBytes: 250_880 } };

describe('ReportCard', () => {
  let fixture: ComponentFixture<ReportCard>;
  let http: HttpTestingController;
  let clicked: HTMLAnchorElement[];

  const element = () => fixture.nativeElement as HTMLElement;
  const button = () => element().querySelector('.download-button') as HTMLButtonElement | null;

  const show = (report: MedicalReport) => {
    fixture.componentRef.setInput('report', report);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    clicked = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    await TestBed.configureTestingModule({
      imports: [ReportCard],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReportCard);
  });

  afterEach(() => http.verify());

  it('shows the diagnosis and the date', () => {
    show(REPORT);
    expect(element().textContent).toContain('Nessun rilievo.');
    expect(element().textContent).toContain('20/10/2026');
  });

  it('shows the download button, with the type and the size, only when there is an attachment', () => {
    show(REPORT);
    expect(button()).toBeNull();

    show(WITH_FILE);
    expect(button()!.textContent).toContain('Scarica allegato');
    expect(element().textContent).toContain('PDF, 245 KB');
  });

  it('downloads the attachment with the name that the server proposes', () => {
    show(WITH_FILE);

    button()!.click();
    fixture.detectChanges();
    expect(button()!.disabled).toBeTrue();
    http.expectOne('/api/v1/medical-reports/3/attachment').flush(
      new Blob(['%PDF-1.4']), { headers: { 'Content-Disposition': 'attachment; filename="referto-3.pdf"' } });
    fixture.detectChanges();

    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('referto-3.pdf');
    expect(button()!.disabled).toBeFalse();
    expect(element().querySelector('.alert-danger')).toBeNull();
  });

  it('proposes a name of its own when the server proposes none', () => {
    show(WITH_FILE);

    button()!.click();
    http.expectOne('/api/v1/medical-reports/3/attachment').flush(new Blob(['%PDF-1.4']));

    expect(clicked[0].download).toBe('referto-3');
  });

  it('says why the download failed and lets the user try again', () => {
    show(WITH_FILE);

    button()!.click();
    http.expectOne('/api/v1/medical-reports/3/attachment').flush(
      new Blob(['{}']), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(clicked.length).toBe(0);
    expect(element().querySelector('.alert-danger')?.textContent).toContain('non è disponibile');
    expect(button()!.disabled).toBeFalse();
  });

  it('clears the old error when the user tries again', () => {
    show(WITH_FILE);
    button()!.click();
    http.expectOne('/api/v1/medical-reports/3/attachment').flush(new Blob(['{}']), { status: 500, statusText: 'x' });
    fixture.detectChanges();
    expect(element().querySelector('.alert-danger')).not.toBeNull();

    button()!.click();
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).toBeNull();
    http.expectOne('/api/v1/medical-reports/3/attachment').flush(new Blob(['x']));
  });
});