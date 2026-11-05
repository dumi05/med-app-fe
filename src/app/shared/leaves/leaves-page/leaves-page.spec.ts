import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays } from '../../calendar/calendar-grid';
import { todayIso } from '../../format/format';
import { errorInterceptor } from '../../http/error.interceptor';
import { LeavesPage } from './leaves-page';

const TOKEN = 'h.eyJleHAiOjk5OTk5OTk5OTl9.s';
const TODAY = todayIso();
const START = addDays(TODAY, 10);
const END = addDays(TODAY, 14);

const ME = { id: 1, firstName: 'Mario', lastName: 'Rossi', specializationId: 7, specialization: 'Cardiologia' };
const COLLEAGUE = { id: 2, firstName: 'Luca', lastName: 'Bianchi', specializationId: 7, specialization: 'Cardiologia' };
const OTHER_SPECIALIZATION = { id: 3, firstName: 'Anna', lastName: 'Verdi', specializationId: 8, specialization: 'Dermatologia' };
const ACTIVE_DOCTORS = [ME, COLLEAGUE, OTHER_SPECIALIZATION];
const ADMIN_DOCTORS = [
  ...ACTIVE_DOCTORS.map((doctor) => ({ ...doctor, email: 'x@x.it', delegationConsent: true, active: true })),
  { id: 4, firstName: 'Piero', lastName: 'Neri', specializationId: 7, specialization: 'Cardiologia', email: 'n@x.it', delegationConsent: true, active: false },
];

const leave = (id: number, startDate: string, endDate: string, replacement: string | null = null) => ({
  id, doctorId: 1, startDate, endDate, replacementDoctorId: replacement === null ? null : 2, replacementDoctorName: replacement,
});

const affected = (id: number, outcome: 'REASSIGN' | 'CANCEL') => ({
  id, startTime: `${START}T09:00:00`, patientFirstName: 'Pippo', patientLastName: `Baudo${id}`, outcome,
});

const PREVIEW = {
  daysOfNotice: 10, shortNotice: false, reassign: 1, cancel: 1,
  appointments: [affected(1, 'REASSIGN'), affected(2, 'CANCEL')],
  newsTitle: 'Dott. Mario Rossi: assente dal giorno A al giorno B',
  newsBody: 'Il dott. Mario Rossi sarà assente.',
};

describe('LeavesPage', () => {
  let fixture: ComponentFixture<LeavesPage>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent ?? '';
  const field = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;

  const previewRequest = (r: HttpRequest<unknown>) => r.url === '/api/v1/doctor-leaves/preview';

  const create = (role: 'DOCTOR' | 'ADMIN') => {
    localStorage.setItem('medapp.session', JSON.stringify({ token: TOKEN, email: 'x@x.it', role, mustChangePassword: false }));
    TestBed.configureTestingModule({
      imports: [LeavesPage],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LeavesPage);
    fixture.detectChanges();
  };

  /** A doctor: the page reads who they are, the colleagues and their own leaves. */
  const openAsDoctor = (leaves: unknown[] = []) => {
    create('DOCTOR');
    http.expectOne('/api/v1/doctors/me').flush(ME);
    http.expectOne('/api/v1/doctors').flush(ACTIVE_DOCTORS);
    http.expectOne('/api/v1/doctor-leaves').flush(leaves);
    fixture.detectChanges();
  };

  const openAsAdmin = () => {
    create('ADMIN');
    http.expectOne('/api/v1/doctors/admin').flush(ADMIN_DOCTORS);
    fixture.detectChanges();
  };

  const choose = (id: string, value: string) => {
    const select = field(id) as unknown as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  const fill = (id: string, value: string) => {
    const input = field(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const check = () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const fillDates = () => {
    fill('startDate', START);
    fill('endDate', END);
  };

  /** Dates and colleague, the check, and the answer of the server. */
  const checked = (preview: unknown = PREVIEW, colleague = '2') => {
    fillDates();
    choose('replacement', colleague);
    check();
    http.expectOne(previewRequest).flush(preview as object);
    fixture.detectChanges();
  };

  const fail = (status: number, code: string, message: string) => ({
    body: { code, message, timestamp: 'x' },
    options: { status, statusText: 'Error' },
  });

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  // ---- the leaves in programme ----------------------------------------------------------------

  it('reads the leaves of the logged doctor without saying who, and shows them with the colleague', () => {
    openAsDoctor([leave(1, START, END, 'Luca Bianchi'), leave(2, addDays(TODAY, 40), addDays(TODAY, 41))]);

    const items = element().querySelectorAll('.leave-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('sostituto: Luca Bianchi');
    expect(items[1].textContent).toContain('nessun sostituto');
  });

  it('says that there are no leaves in programme', () => {
    openAsDoctor([]);

    expect(element().querySelector('.no-leaves')?.textContent).toContain('Nessuna assenza in programma');
  });

  it('offers as the colleague only the other doctors of the same specialization, after "nessuno"', () => {
    openAsDoctor();

    const labels = Array.from(element().querySelectorAll('#replacement option')).map((o) => o.textContent?.trim());
    expect(labels).toEqual(['Seleziona...', 'Nessuno: le visite prenotate si annullano', 'Bianchi Luca']);
  });

  // ---- the check ------------------------------------------------------------------------------

  it('does not show a problem before the user tries, and sends nothing when the dates are wrong', () => {
    openAsDoctor();
    fill('startDate', END);
    fill('endDate', START);

    expect(element().querySelector('.problem')).toBeNull();

    check();
    http.expectNone(previewRequest);
    expect(element().querySelector('.problem')?.textContent).toContain('L\'ultimo giorno non può precedere il primo');
  });

  it('sends nothing when the dates are missing', () => {
    openAsDoctor();

    check();

    http.expectNone(previewRequest);
    expect(element().querySelector('.problem')?.textContent).toContain('Scegli il primo e l\'ultimo giorno');
  });

  it('asks the preview with the dates and the colleague, without the doctor (the server knows who is logged)', () => {
    openAsDoctor();
    fillDates();
    choose('replacement', '2');

    check();

    const request = http.expectOne(previewRequest);
    expect(request.request.params.get('startDate')).toBe(START);
    expect(request.request.params.get('endDate')).toBe(END);
    expect(request.request.params.get('replacementDoctorId')).toBe('2');
    expect(request.request.params.has('doctorId')).toBeFalse();
    request.flush(PREVIEW);
  });

  it('asks the preview without a colleague when the user chose "nessuno"', () => {
    openAsDoctor();
    fillDates();

    check();

    const request = http.expectOne(previewRequest);
    expect(request.request.params.has('replacementDoctorId')).toBeFalse();
    request.flush(PREVIEW);
  });

  it('shows how many visits move and how many are cancelled, the list, and the notice the patients will read', () => {
    openAsDoctor();
    checked();

    expect(element().querySelector('.reassign-count')?.textContent).toBe('1');
    expect(element().querySelector('.cancel-count')?.textContent).toBe('1');
    const rows = element().querySelectorAll('.affected tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Pippo Baudo1');
    expect(rows[0].querySelector('.outcome-reassign')).not.toBeNull();
    expect(rows[1].querySelector('.outcome-cancel')).not.toBeNull();
    expect(element().querySelector('.news-title')?.textContent).toContain('Dott. Mario Rossi: assente');
    expect(element().querySelector('.news-body')?.textContent).toContain('sarà assente');
  });

  it('warns in red when the notice is short, and only then', () => {
    openAsDoctor();
    checked({ ...PREVIEW, shortNotice: true, daysOfNotice: 2 });
    expect(element().querySelector('.short-notice')?.textContent).toContain('Preavviso breve');

    fill('endDate', addDays(TODAY, 15));
    check();
    http.expectOne(previewRequest).flush(PREVIEW);
    fixture.detectChanges();
    expect(element().querySelector('.short-notice')).toBeNull();
  });

  it('says that no visit is touched when nobody booked in those days', () => {
    openAsDoctor();
    checked({ ...PREVIEW, reassign: 0, cancel: 0, appointments: [] });

    expect(element().querySelector('.no-appointments')?.textContent).toContain('Nessuna visita prenotata');
    expect(element().querySelector('.affected')).toBeNull();
  });

  it('shows the text of the server when the check is refused (a colleague who is not active)', () => {
    openAsDoctor();
    fillDates();
    choose('replacement', '2');

    check();
    const refused = fail(400, 'INVALID_ARGUMENT', 'Il sostituto non è attivo.');
    http.expectOne(previewRequest).flush(refused.body, refused.options);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Il sostituto non è attivo.');
    expect(element().querySelector('.confirm-button')).toBeNull();
  });

  it('does not offer to confirm before the check', () => {
    openAsDoctor();
    fillDates();

    expect(element().querySelector('.confirm-button')).toBeNull();
  });

  // ---- what was seen is what is confirmed -----------------------------------------------------

  it('throws the preview away when a date changes: it would not be true any more', () => {
    openAsDoctor();
    checked();
    expect(element().querySelector('.confirm-button')).not.toBeNull();

    fill('endDate', addDays(TODAY, 20));

    expect(element().querySelector('.confirm-button')).toBeNull();
    expect(element().querySelector('.news-preview')).toBeNull();
  });

  it('throws the preview away when the colleague changes', () => {
    openAsDoctor();
    checked();

    choose('replacement', 'none');

    expect(element().querySelector('.confirm-button')).toBeNull();
  });

  it('"Annulla" closes the preview and sends nothing', () => {
    openAsDoctor();
    checked();

    click('.discard-button');

    expect(element().querySelector('.confirm-button')).toBeNull();
    http.expectNone('/api/v1/doctor-leaves');
  });

  // ---- the confirmation -----------------------------------------------------------------------

  it('registers the leave with the dates and the colleague of the preview, says the result and empties the form', () => {
    openAsDoctor();
    checked();

    click('.confirm-button');
    const request = http.expectOne('/api/v1/doctor-leaves');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ startDate: START, endDate: END, replacementDoctorId: 2 });
    request.flush({ id: 5, reassigned: 2, cancelled: 1 });
    http.expectOne('/api/v1/doctor-leaves').flush([leave(5, START, END, 'Luca Bianchi')]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Visite spostate: 2');
    expect(element().querySelector('.alert-success')?.textContent).toContain('Visite annullate: 1');
    expect(field('startDate').value).toBe('');
    expect(field('endDate').value).toBe('');
    expect(element().querySelector('.confirm-button')).toBeNull();
    expect(element().querySelectorAll('.leave-item').length).toBe(1);
  });

  it('registers a leave without a colleague by sending no colleague', () => {
    openAsDoctor();
    checked(PREVIEW, 'none');

    click('.confirm-button');

    const request = http.expectOne('/api/v1/doctor-leaves');
    expect(request.request.body).toEqual({ startDate: START, endDate: END });
    request.flush({ id: 5, reassigned: 0, cancelled: 2 });
    http.expectOne('/api/v1/doctor-leaves').flush([]);
  });

  it('keeps the preview and shows the message when the registration is refused', () => {
    openAsDoctor();
    checked();

    click('.confirm-button');
    const refused = fail(400, 'INVALID_ARGUMENT', 'Esiste già un\'assenza in quel periodo.');
    http.expectOne('/api/v1/doctor-leaves').flush(refused.body, refused.options);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Esiste già un\'assenza in quel periodo');
    expect(element().querySelector('.confirm-button')).not.toBeNull();
  });

  // ---- coming back early ----------------------------------------------------------------------

  it('asks a confirmation, then cancels the leave and says what does not come back', () => {
    openAsDoctor([leave(1, START, END), leave(2, addDays(TODAY, 40), addDays(TODAY, 41))]);

    click('.cancel-leave-button');
    http.expectNone('/api/v1/doctor-leaves/1');
    expect(text()).toContain('non tornano come prima');

    click('.confirm-cancel-button');
    const request = http.expectOne('/api/v1/doctor-leaves/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    expect(element().querySelectorAll('.leave-item').length).toBe(1);
    expect(element().querySelector('.alert-success')?.textContent).toContain('restano come sono');
  });

  it('keeps the leave if the user changes their mind', () => {
    openAsDoctor([leave(1, START, END)]);

    click('.cancel-leave-button');
    click('.keep-button');

    http.expectNone('/api/v1/doctor-leaves/1');
    expect(element().querySelectorAll('.leave-item').length).toBe(1);
    expect(element().querySelector('.confirm-cancel-button')).toBeNull();
  });

  it('keeps the leave and shows the message when the server refuses to cancel it', () => {
    openAsDoctor([leave(1, START, END)]);

    click('.cancel-leave-button');
    click('.confirm-cancel-button');
    const refused = fail(400, 'INVALID_ARGUMENT', 'Un\'assenza già finita non si può annullare.');
    http.expectOne('/api/v1/doctor-leaves/1').flush(refused.body, refused.options);
    fixture.detectChanges();

    expect(element().querySelectorAll('.leave-item').length).toBe(1);
    expect(element().querySelector('.alert-danger')?.textContent).toContain('già finita');
  });

  // ---- the admin ------------------------------------------------------------------------------

  it('offers the admin the active doctors, and shows nothing (and asks nothing) before one is chosen', () => {
    openAsAdmin();

    const labels = Array.from(element().querySelectorAll('#doctor option')).map((o) => o.textContent?.trim());
    expect(labels).toEqual([
      'Seleziona...', 'Rossi Mario (Cardiologia)', 'Bianchi Luca (Cardiologia)', 'Verdi Anna (Dermatologia)',
    ]);
    expect(element().querySelector('.no-doctor')).not.toBeNull();
    expect(element().querySelector('form')).toBeNull();
  });

  it('reads the leaves of the chosen doctor, and offers as the colleague the doctors of that specialization', () => {
    openAsAdmin();

    choose('doctor', '3');
    http.expectOne('/api/v1/doctor-leaves?doctorId=3').flush([]);
    fixture.detectChanges();

    const labels = Array.from(element().querySelectorAll('#replacement option')).map((o) => o.textContent?.trim());
    expect(labels).toEqual(['Seleziona...', 'Nessuno: le visite prenotate si annullano']);

    choose('doctor', '1');
    http.expectOne('/api/v1/doctor-leaves?doctorId=1').flush([]);
    fixture.detectChanges();
    const colleagues = Array.from(element().querySelectorAll('#replacement option')).map((o) => o.textContent?.trim());
    expect(colleagues).toEqual(['Seleziona...', 'Nessuno: le visite prenotate si annullano', 'Bianchi Luca']);
  });

  it('sends the doctor in the preview and in the registration', () => {
    openAsAdmin();
    choose('doctor', '1');
    http.expectOne('/api/v1/doctor-leaves?doctorId=1').flush([]);
    fixture.detectChanges();

    fillDates();
    check();
    const preview = http.expectOne(previewRequest);
    expect(preview.request.params.get('doctorId')).toBe('1');
    preview.flush(PREVIEW);
    fixture.detectChanges();

    click('.confirm-button');
    const request = http.expectOne('/api/v1/doctor-leaves');
    expect(request.request.body).toEqual({ doctorId: 1, startDate: START, endDate: END });
    request.flush({ id: 5, reassigned: 0, cancelled: 0 });
    http.expectOne('/api/v1/doctor-leaves?doctorId=1').flush([]);
  });

  it('forgets the dates, the preview and the message when the admin changes the doctor', () => {
    openAsAdmin();
    choose('doctor', '1');
    http.expectOne('/api/v1/doctor-leaves?doctorId=1').flush([]);
    fixture.detectChanges();
    checked();

    choose('doctor', '2');
    http.expectOne('/api/v1/doctor-leaves?doctorId=2').flush([]);
    fixture.detectChanges();

    expect(field('startDate').value).toBe('');
    expect(element().querySelector('.confirm-button')).toBeNull();
    expect(element().querySelector('.problem')).toBeNull();
  });
});