import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Role } from '../../auth/auth.model';
import { AuthService } from '../../auth/auth.service';
import { errorInterceptor } from '../../http/error.interceptor';
import { AppointmentReport } from './appointment-report';

const REPORT = { id: 3, appointmentId: 5, diagnosisText: 'Nessun rilievo.', attachment: null,
                 completedAt: '2026-10-20T09:45:00' };
const LOOKUP = (r: { url: string; params: { get(k: string): string | null } }) =>
  r.url === '/api/v1/medical-reports' && r.params.get('appointmentId') === '5';

describe('AppointmentReport', () => {
  let fixture: ComponentFixture<AppointmentReport>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  const open = (role: Role) => {
    TestBed.configureTestingModule({
      imports: [AppointmentReport],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { role: signal<Role | null>(role) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ appointmentId: '5' }) } } },
      ],
    });
    fixture = TestBed.createComponent(AppointmentReport);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  };

  const notFound = () =>
    http.expectOne(LOOKUP).flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'x', timestamp: 'x' },
      { status: 404, statusText: 'Not Found' },
    );

  const setDiagnosis = (value: string) => {
    const field = element().querySelector('#diagnosisText') as HTMLTextAreaElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  };

  const chooseFile = (file: File) => {
    const input = element().querySelector('#attachment') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  it('shows the report when it exists (patient)', () => {
    open('PATIENT');
    http.expectOne(LOOKUP).flush(REPORT);
    fixture.detectChanges();

    expect(element().textContent).toContain('Nessun rilievo.');
    expect(element().querySelector('form')).toBeNull();
  });

  it('tells the patient that the report is not available yet', () => {
    open('PATIENT');
    notFound();
    fixture.detectChanges();

    expect(element().textContent).toContain('non è ancora disponibile');
    expect(element().querySelector('form')).toBeNull();
  });

  it('shows the writing form to the doctor when there is no report', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    expect(element().querySelector('form')).not.toBeNull();
  });

  it('does not send the report when the diagnosis is empty', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    submit();

    http.expectNone('/api/v1/medical-reports');
    expect(element().querySelector('#diagnosisText')!.classList.contains('is-invalid')).toBeTrue();
  });

  it('sends the report, then shows it with a confirmation', async () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    setDiagnosis('Nessun rilievo.');
    submit();

    const req = http.expectOne('/api/v1/medical-reports');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(JSON.parse(await (body.get('report') as Blob).text())).toEqual({ appointmentId: 5, diagnosisText: 'Nessun rilievo.' });
    expect(body.has('file')).toBeFalse();
    req.flush(REPORT);
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Referto salvato');
    expect(element().querySelector('form')).toBeNull();
    expect(element().textContent).toContain('Nessun rilievo.');
  });

  it('shows the Italian message when the backend refuses the report', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    setDiagnosis('Nessun rilievo.');
    submit();
    http.expectOne('/api/v1/medical-reports').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
    expect(element().querySelector('form')).not.toBeNull();
  });

  // ---- the attachment -------------------------------------------------------------------------

  it('offers a file chooser that is limited to PDF, JPEG and PNG', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    const input = element().querySelector('#attachment') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.pdf,image/jpeg,image/png');
  });

  it('sends the chosen file together with the report', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    setDiagnosis('Nessun rilievo.');
    chooseFile(new File(['%PDF-1.4'], 'esame.pdf', { type: 'application/pdf' }));
    submit();

    const req = http.expectOne('/api/v1/medical-reports');
    const sent = (req.request.body as FormData).get('file') as File;
    expect(sent.name).toBe('esame.pdf');
    req.flush({ ...REPORT, attachment: { contentType: 'application/pdf', sizeBytes: 8 } });
    fixture.detectChanges();

    expect(element().textContent).toContain('Scarica allegato');
  });

  it('refuses a file of another type at once, with the reason, and does not send it', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    setDiagnosis('Nessun rilievo.');
    chooseFile(new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' }));

    expect(element().querySelector('#attachment + .invalid-feedback')?.textContent).toContain('Sono ammessi solo file PDF, JPEG e PNG.');
    expect((element().querySelector('#attachment') as HTMLInputElement).value).toBe('');

    submit();
    const req = http.expectOne('/api/v1/medical-reports');
    expect((req.request.body as FormData).has('file')).toBeFalse();
    req.flush(REPORT);
  });

  it('refuses a file over 10 MB at once', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    chooseFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' }));

    expect(element().querySelector('#attachment + .invalid-feedback')?.textContent).toContain('10 MB');
  });

  it('forgets the problem when a good file is chosen afterwards', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    chooseFile(new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' }));
    chooseFile(new File(['%PDF-1.4'], 'esame.pdf', { type: 'application/pdf' }));

    expect(element().querySelector('#attachment + .invalid-feedback')).toBeNull();
    expect(element().querySelector('#attachment')!.classList).not.toContain('is-invalid');
  });

  it('shows the Italian message when the backend says that the file is too large', () => {
    open('DOCTOR');
    notFound();
    fixture.detectChanges();

    setDiagnosis('Nessun rilievo.');
    chooseFile(new File(['%PDF-1.4'], 'esame.pdf', { type: 'application/pdf' }));
    submit();
    http.expectOne('/api/v1/medical-reports').flush(
      { code: 'FILE_TOO_LARGE', message: 'x', timestamp: 'x' }, { status: 413, statusText: 'Payload Too Large' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('10 MB');
    expect(element().querySelector('form')).not.toBeNull();
  });

  it('shows the error and no form when the lookup is refused', () => {
    open('DOCTOR');
    http.expectOne(LOOKUP).flush(
      { code: 'UNAUTHORIZED_ACCESS', message: 'x', timestamp: 'x' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
    expect(element().querySelector('form')).toBeNull();
  });
});