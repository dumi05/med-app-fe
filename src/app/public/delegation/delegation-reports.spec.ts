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
const ACCESS = '/api/v1/report-delegations/abc-123/access';
const REPORTS = '/api/v1/report-delegations/abc-123/medical-reports';

describe('DelegationReports', () => {
  let fixture: ComponentFixture<DelegationReports>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const fail = (code: string, status: number, message = 'x') => ({ body: { code, message, timestamp: 'x' }, opts: { status, statusText: 'Error' } });

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
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

  const typeCode = (code: string) => {
    const input = element().querySelector('#code') as HTMLInputElement;
    input.value = code;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submitCode = () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  /** The caregiver writes the code, the server gives the token, and then the reports arrive. */
  const open = (reports: object[] = [], code = 'K7MQ-4XPD') => {
    typeCode(code);
    submitCode();
    http.expectOne(ACCESS).flush({ accessToken: 'jwt-1', expiresInSeconds: 900 });
    http.expectOne(REPORTS).flush(reports);
    fixture.detectChanges();
  };

  // ---- the code first -------------------------------------------------------------------------

  it('asks for the access code and reads nothing before it is typed', () => {
    http.expectNone(REPORTS);
    http.expectNone(ACCESS);
    expect(element().querySelector('.code-card')).not.toBeNull();
    expect(element().querySelector('.card .card-title')?.textContent).toContain('codice di accesso');
    expect(element().querySelector('.download-button')).toBeNull();
  });

  it('shows the logo of the studio on top of the page', () => {
    const logo = element().querySelector('img.page-logo') as HTMLImageElement;
    expect(logo.getAttribute('src')).toBe('brand/logo-full.png');
    expect(logo.getAttribute('alt')).toContain('La Mole');
  });

  it('does not send an empty code', () => {
    submitCode();

    http.expectNone(ACCESS);
    expect(element().querySelector('#code')!.classList.contains('is-invalid')).toBeTrue();
  });

  it('does not send a code made of spaces', () => {
    typeCode('   ');
    submitCode();

    http.expectNone(ACCESS);
  });

  it('sends the code typed (without the spaces around it) with the token of the address, and then asks the reports with the access token', () => {
    typeCode('  K7MQ-4XPD ');
    submitCode();

    const unlock = http.expectOne(ACCESS);
    expect(unlock.request.method).toBe('POST');
    expect(unlock.request.body).toEqual({ code: 'K7MQ-4XPD' });
    unlock.flush({ accessToken: 'jwt-1', expiresInSeconds: 900 });

    const reports = http.expectOne(REPORTS);
    expect(reports.request.headers.get('X-Delegation-Access')).toBe('jwt-1');
    reports.flush([REPORT]);
    fixture.detectChanges();

    expect(element().querySelector('.code-card')).toBeNull();
    expect(element().textContent).toContain('Cardiologia');
  });

  it('keeps the access token in memory only: nothing is saved in the browser', () => {
    open([REPORT]);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain('jwt-1');
  });

  it('says that the code is wrong, and keeps the form with what was typed', () => {
    typeCode('AAAA-AAAA');
    submitCode();

    const answer = fail('INVALID_ACCESS_CODE', 403);
    http.expectOne(ACCESS).flush(answer.body, answer.opts);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Il codice non è corretto');
    expect((element().querySelector('#code') as HTMLInputElement).value).toBe('AAAA-AAAA');
    http.expectNone(REPORTS);
  });

  it('shows what the server says when too many codes were wrong', () => {
    typeCode('AAAA-AAAA');
    submitCode();

    const answer = fail('ACCESS_CODE_LOCKED', 429, 'Troppi codici sbagliati. Riprova tra 15 minuti.');
    http.expectOne(ACCESS).flush(answer.body, answer.opts);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Riprova tra 15 minuti.');
  });

  it('explains that the link is not valid anymore, whatever the reason', () => {
    typeCode('K7MQ-4XPD');
    submitCode();

    const answer = fail('RESOURCE_NOT_FOUND', 404);
    http.expectOne(ACCESS).flush(answer.body, answer.opts);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non è valido o non è più attivo');
  });

  // ---- the reports ----------------------------------------------------------------------------

  it('shows the reports with specialization, doctor, dates and text', () => {
    open([REPORT]);

    const text = element().textContent;
    expect(text).toContain('Cardiologia');
    expect(text).toContain('Giulia Verdi');
    expect(text).toContain('20/10/2026 09:30');
    expect(text).toContain('Nessuna criticità riscontrata.');
  });

  it('says so when there are no reports yet', () => {
    open([]);

    expect(element().textContent).toContain('Non ci sono ancora referti disponibili.');
  });

  it('shows the download button only for the reports whose attachment is available', () => {
    open([REPORT, { ...REPORT, id: 8, attachmentAvailable: true }]);

    const buttons = element().querySelectorAll('.download-button');
    expect(buttons.length).toBe(1);
    expect(element().querySelectorAll('.card')[1].contains(buttons[0])).toBeTrue();
  });

  it('downloads the attachment sending the access token', () => {
    const clicked: HTMLAnchorElement[] = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    open([{ ...REPORT, id: 8, attachmentAvailable: true }]);

    (element().querySelector('.download-button') as HTMLButtonElement).click();
    const req = http.expectOne(`${REPORTS}/8/attachment`);
    expect(req.request.headers.get('X-Delegation-Access')).toBe('jwt-1');
    req.flush(new Blob(['%PDF-1.4']), { headers: { 'Content-Disposition': 'attachment; filename="referto-8.pdf"' } });
    fixture.detectChanges();

    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('referto-8.pdf');
    expect(element().querySelector('.alert-danger')).toBeNull();
  });

  it('says that the attachment is not available when the server answers 404, and keeps the reports on screen', () => {
    open([{ ...REPORT, id: 8, attachmentAvailable: true }]);

    (element().querySelector('.download-button') as HTMLButtonElement).click();
    http.expectOne(`${REPORTS}/8/attachment`).flush(new Blob(['{}']), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non è disponibile');
    expect(element().querySelector('.card')).not.toBeNull();
  });

  it('takes the reports off the screen and asks for the code again when the few minutes are over', () => {
    open([{ ...REPORT, id: 8, attachmentAvailable: true }]);

    (element().querySelector('.download-button') as HTMLButtonElement).click();
    http.expectOne(`${REPORTS}/8/attachment`).flush(
      new Blob([JSON.stringify({ code: 'ACCESS_CODE_REQUIRED' })]), { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(element().textContent).not.toContain('Nessuna criticità riscontrata.');
    expect(element().querySelector('.code-card')).not.toBeNull();
    expect(element().querySelector('.alert-danger')?.textContent).toContain('il tempo a disposizione è scaduto'.replace('il', 'Il'));
  });

  it('asks for the code again when the server refuses the token while the reports are read', () => {
    typeCode('K7MQ-4XPD');
    submitCode();
    http.expectOne(ACCESS).flush({ accessToken: 'jwt-1', expiresInSeconds: 900 });
    const answer = fail('ACCESS_CODE_REQUIRED', 403);
    http.expectOne(REPORTS).flush(answer.body, answer.opts);
    fixture.detectChanges();

    expect(element().querySelector('.code-card')).not.toBeNull();
    expect(element().querySelector('.alert-danger')?.textContent).toContain('scaduto');
  });

  it('shows the generic Italian message for the other errors', () => {
    typeCode('K7MQ-4XPD');
    submitCode();
    http.expectOne(ACCESS).flush({ accessToken: 'jwt-1', expiresInSeconds: 900 });
    const answer = fail('SERVER_ERROR', 500);
    http.expectOne(REPORTS).flush(answer.body, answer.opts);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
  });

  it('keeps the address out of the Referer header and out of the search engines, and only while it is open', () => {
    const meta = TestBed.inject(Meta);

    expect(meta.getTag('name="referrer"')?.content).toBe('no-referrer');
    expect(meta.getTag('name="robots"')?.content).toBe('noindex');

    fixture.destroy();

    expect(meta.getTag('name="referrer"')).toBeNull();
    expect(meta.getTag('name="robots"')).toBeNull();
  });
});