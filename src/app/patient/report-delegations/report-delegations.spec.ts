import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { ReportDelegations } from './report-delegations';

const delegation = (id: number, overrides: Record<string, unknown> = {}) => ({
  id, delegateName: 'Luigi Neri', delegateEmail: 'luigi@example.com', token: `token-${id}`,
  expiresAt: '2099-12-31', revoked: false, active: true, createdAt: '2026-10-24T10:00:00Z', ...overrides,
});

describe('ReportDelegations', () => {
  let fixture: ComponentFixture<ReportDelegations>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => element().querySelectorAll('tbody tr');
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const click = (selector: string) => {
    button(selector).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportDelegations],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(ReportDelegations);
    fixture.detectChanges();
    http.expectOne('/api/v1/report-delegations/me').flush(list);
    fixture.detectChanges();
  };

  const setValue = (id: string, value: string) => {
    const field = element().querySelector(`#${id}`) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const fillInTheForm = (expiresAt = '') => {
    setValue('delegateName', 'Anna Neri');
    setValue('delegateEmail', 'anna@example.com');
    setValue('expiresAt', expiresAt);
  };

  // ---- the table ------------------------------------------------------------------------------

  it('shows the delegations with the person, the expiry and the status', () => {
    open([
      delegation(1),
      delegation(2, { revoked: true, active: false }),
      delegation(3, { expiresAt: '2020-01-01', active: false }),
    ]);

    expect(rows().length).toBe(3);
    expect(rows()[0].textContent).toContain('Luigi Neri');
    expect(rows()[0].textContent).toContain('luigi@example.com');
    expect(rows()[0].textContent).toContain('31/12/2099');
    expect(rows()[0].textContent).toContain('Attiva');
    expect(rows()[1].textContent).toContain('Revocata');
    expect(rows()[2].textContent).toContain('Scaduta');
  });

  it('writes "Nessuna" when the delegation does not expire', () => {
    open([delegation(1, { expiresAt: null })]);

    expect(rows()[0].textContent).toContain('Nessuna');
  });

  it('says so when there are no delegations yet', () => {
    open([]);

    expect(element().textContent).toContain('Non hai ancora creato deleghe.');
    expect(rows().length).toBe(0);
  });

  it('offers "Mostra link" and "Revoca" only on the active delegations', () => {
    open([delegation(1), delegation(2, { revoked: true, active: false }), delegation(3, { active: false })]);

    expect(rows()[0].querySelector('.show-link-button')).not.toBeNull();
    expect(rows()[0].querySelector('.revoke-button')).not.toBeNull();
    expect(rows()[1].querySelector('button')).toBeNull();
    expect(rows()[2].querySelector('button')).toBeNull();
  });

    it('does not include the attachments unless the patient chooses to', () => {
    open([]);

    const box = element().querySelector('#includeAttachments') as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBeFalse();
  });

  it('sends the choice of including the attachments', () => {
    open([]);
    fillInTheForm();
    const box = element().querySelector('#includeAttachments') as HTMLInputElement;
    box.click();
    submit();

    const req = http.expectOne('/api/v1/report-delegations');
    expect(req.request.body.includeAttachments).toBeTrue();
    req.flush(delegation(9, { includeAttachments: true }));
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Si');
    expect(box.checked).toBeFalse();
  });

  it('says in the table which delegations include the attachments', () => {
    open([delegation(1, { includeAttachments: true }), delegation(2)]);

    expect(rows()[0].querySelectorAll('td')[2].textContent).toBe('Si');
    expect(rows()[1].querySelectorAll('td')[2].textContent).toBe('No');
  });

  it('shows the Italian message when the list cannot be loaded', () => {
    fixture = TestBed.createComponent(ReportDelegations);
    fixture.detectChanges();
    http.expectOne('/api/v1/report-delegations/me').flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
  });

  // ---- create ---------------------------------------------------------------------------------

  it('does not send the form when it is not valid', () => {
    open([]);
    submit();

    http.expectNone('/api/v1/report-delegations');
    expect(element().querySelectorAll('.is-invalid').length).toBeGreaterThan(0);
  });

  it('does not send the form when the email is not an email', () => {
    open([]);
    fillInTheForm();
    setValue('delegateEmail', 'not-an-email');
    submit();

    http.expectNone('/api/v1/report-delegations');
  });

  it('does not send the form when the expiry is a day that has gone', () => {
    open([]);
    fillInTheForm('2020-01-01');
    submit();

    http.expectNone('/api/v1/report-delegations');
    expect(element().querySelector('#expiresAt')?.classList).toContain('is-invalid');
  });

  it('creates the delegation, adds it to the table and shows the link to share', () => {
    open([]);
    fillInTheForm('2099-06-30');
    submit();

    const req = http.expectOne('/api/v1/report-delegations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ delegateName: 'Anna Neri', delegateEmail: 'anna@example.com', expiresAt: '2099-06-30', includeAttachments: false });
    req.flush(delegation(9, { delegateName: 'Anna Neri', token: 'new-token' }));
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Anna Neri');
    expect((element().querySelector('#sharedLink') as HTMLInputElement).value).toBe(`${window.location.origin}/delegation/new-token`);
    expect(element().querySelector('.alert-success')?.textContent).toContain('Delega creata');
  });

  it('sends no expiry when the field is left empty', () => {
    open([]);
    fillInTheForm();
    submit();

    const req = http.expectOne('/api/v1/report-delegations');
    expect(req.request.body.expiresAt).toBeNull();
    req.flush(delegation(9));
  });

  it('shows the Italian message when the backend refuses the creation', () => {
    open([]);
    fillInTheForm();
    submit();

    http.expectOne('/api/v1/report-delegations').flush(
      { code: 'VALIDATION_FAILED', message: 'x', timestamp: 'x' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Controlla i campi');
    expect(element().querySelector('#sharedLink')).toBeNull();
  });

  // ---- the link -------------------------------------------------------------------------------

  it('shows the link of a delegation on request', () => {
    open([delegation(1), delegation(2)]);
    expect(element().querySelector('#sharedLink')).toBeNull();

    click('tbody tr:nth-child(2) .show-link-button');

    expect((element().querySelector('#sharedLink') as HTMLInputElement).value).toBe(`${window.location.origin}/delegation/token-2`);
  });

  it('copies the link to the clipboard', async () => {
    const write = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    open([delegation(1)]);
    click('.show-link-button');

    click('.copy-button');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(write).toHaveBeenCalledWith(`${window.location.origin}/delegation/token-1`);
    expect(element().querySelector('.alert-success')?.textContent).toContain('Link copiato');
  });

  it('asks to copy by hand when the browser refuses the clipboard, leaving the link on screen', async () => {
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('denied'));
    open([delegation(1)]);
    click('.show-link-button');

    click('.copy-button');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('copialo a mano');
    expect(element().querySelector('#sharedLink')).not.toBeNull();
  });

  // ---- revoke ---------------------------------------------------------------------------------

  it('asks for a confirmation before revoking, and can be cancelled', () => {
    open([delegation(1)]);

    click('.revoke-button');

    expect(element().querySelector('.confirm-button')).not.toBeNull();
    http.expectNone('/api/v1/report-delegations/1/revoke');

    click('.cancel-confirm-button');

    expect(element().querySelector('.confirm-button')).toBeNull();
    expect(element().querySelector('.revoke-button')).not.toBeNull();
  });

  it('revokes the delegation after the confirmation and hides the link', () => {
    open([delegation(1)]);
    click('.show-link-button');
    click('.revoke-button');
    click('.confirm-button');

    const req = http.expectOne('/api/v1/report-delegations/1/revoke');
    expect(req.request.method).toBe('POST');
    req.flush(delegation(1, { revoked: true, active: false }));
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Revocata');
    expect(rows()[0].querySelector('button')).toBeNull();
    expect(element().querySelector('#sharedLink')).toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Delega revocata');
  });

  it('shows the Italian message when the revocation is refused', () => {
    open([delegation(1)]);
    click('.revoke-button');
    click('.confirm-button');

    http.expectOne('/api/v1/report-delegations/1/revoke').flush(
      { code: 'UNAUTHORIZED_ACCESS', message: 'x', timestamp: 'x' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Non hai i permessi');
    expect(rows()[0].textContent).toContain('Attiva');
  });

  it('does not send the form when the email has no dot in the domain', () => {
    open([]);
    fillInTheForm();
    setValue('delegateEmail', 'luigi@localhost');
    submit();

    http.expectNone('/api/v1/report-delegations');
  });
});