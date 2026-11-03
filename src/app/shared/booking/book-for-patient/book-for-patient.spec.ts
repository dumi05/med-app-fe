import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays } from '../../calendar/calendar-grid';
import { todayIso } from '../../format/format';
import { errorInterceptor } from '../../http/error.interceptor';
import { BookForPatient } from './book-for-patient';

const TOKEN = 'h.eyJleHAiOjk5OTk5OTk5OTl9.s';
const TODAY = todayIso();
const ME = { id: 1, firstName: 'Mario', lastName: 'Rossi', specializationId: 7, specialization: 'Cardiologia' };
const ADMIN_DOCTORS = [
  { ...ME, email: 'a@x.it', delegationConsent: true, active: true },
  { id: 2, firstName: 'Anna', lastName: 'Verdi', specializationId: 8, specialization: 'Dermatologia', email: 'b@x.it', delegationConsent: true, active: true },
  { id: 3, firstName: 'Piero', lastName: 'Neri', specializationId: 7, specialization: 'Cardiologia', email: 'c@x.it', delegationConsent: true, active: false },
];
const PATIENT = { id: 42, firstName: 'Pippo', lastName: 'Baudo', email: 'pippo.baudo@gmail.com' };
const slot = (id: number, day: string, time: string, price: number | null = 120.5) => ({
  id, doctorId: 1, doctorFirstName: 'Mario', doctorLastName: 'Rossi', startTime: `${day}T${time}:00`, durationMinutes: 30, booked: false, price,
});

describe('BookForPatient', () => {
  let fixture: ComponentFixture<BookForPatient>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => (element().textContent ?? '').replace(/ /g, ' ');
  const tomorrow = addDays(TODAY, 1);

  const availability = (specializationId: string, doctorId: string) => (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/availability' &&
    r.params.get('specializationId') === specializationId &&
    r.params.get('doctorId') === doctorId &&
    r.params.get('from') === TODAY &&
    r.params.get('to') === addDays(TODAY, 29);

  const create = (role: 'DOCTOR' | 'ADMIN') => {
    localStorage.setItem('medapp.session', JSON.stringify({ token: TOKEN, email: 'x@x.it', role, mustChangePassword: false }));
    TestBed.configureTestingModule({
      imports: [BookForPatient],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BookForPatient);
    fixture.detectChanges();
  };

  /** A doctor: the page reads who they are. */
  const openAsDoctor = () => {
    create('DOCTOR');
    http.expectOne('/api/v1/doctors/me').flush(ME);
    fixture.detectChanges();
  };

  const openAsAdmin = () => {
    create('ADMIN');
    http.expectOne('/api/v1/doctors/admin').flush(ADMIN_DOCTORS);
    fixture.detectChanges();
  };

  const type = (value: string) => {
    const input = element().querySelector('#query') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submitSearch = () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const searchAndChoose = (found = [PATIENT]) => {
    type('baudo');
    submitSearch();
    http.expectOne((r) => r.url === '/api/v1/patients/search').flush(found);
    fixture.detectChanges();
    (element().querySelector('.choose-button') as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  // ---- the patient ----------------------------------------------------------------------------

  it('starts with the search of the patient, and shows no place before the patient is chosen', () => {
    openAsDoctor();

    expect(element().querySelector('#query')).not.toBeNull();
    expect(element().querySelector('.free-slots')).toBeNull();
    http.expectNone((r) => r.url === '/api/v1/schedule/availability');
  });

  it('does not search with less than three letters, spaces apart', () => {
    openAsDoctor();

    for (const value of ['', 'ro', ' ro ', 'a b']) {
      type(value);
      submitSearch();
      http.expectNone((r) => r.url === '/api/v1/patients/search');
    }
    expect(element().querySelector('#query')!.classList.contains('is-invalid')).toBeTrue();
  });

  it('sends the search and lists the patients found, with the e-mail to tell the homonyms apart', () => {
    openAsDoctor();

    type('baudo');
    submitSearch();
    const req = http.expectOne((r) => r.url === '/api/v1/patients/search' && r.params.get('query') === 'baudo');
    req.flush([PATIENT, { id: 43, firstName: 'Pippo', lastName: 'Baudo', email: 'altro.baudo@gmail.com' }]);
    fixture.detectChanges();

    const rows = element().querySelectorAll('.patient-results li');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('pippo.baudo@gmail.com');
    expect(rows[1].textContent).toContain('altro.baudo@gmail.com');
  });

  it('says that the patient must register first when nobody is found', () => {
    openAsDoctor();

    type('zzzz');
    submitSearch();
    http.expectOne((r) => r.url === '/api/v1/patients/search').flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.no-patients')?.textContent).toContain('deve prima registrarsi');
  });

  it('suggests to be more precise when the list is full', () => {
    openAsDoctor();
    const many = Array.from({ length: 10 }, (_, i) => ({ ...PATIENT, id: i + 1 }));

    type('baudo');
    submitSearch();
    http.expectOne((r) => r.url === '/api/v1/patients/search').flush(many);
    fixture.detectChanges();

    expect(text()).toContain('al massimo 10 risultati');
  });

  it('shows the message of the server when the search is refused', () => {
    openAsDoctor();

    type('baudo');
    submitSearch();
    http.expectOne((r) => r.url === '/api/v1/patients/search').flush(
      { code: 'INVALID_ARGUMENT', message: 'x', timestamp: 'x' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('I dati inseriti non sono validi');
  });

  it('shows the chosen patient and asks the places of the doctor', () => {
    openAsDoctor();
    searchAndChoose();

    expect(element().querySelector('.chosen-patient')?.textContent).toContain('Pippo Baudo');
    expect(element().querySelector('#query')).toBeNull();
    http.expectOne(availability('7', '1')).flush([slot(10, tomorrow, '09:00'), slot(11, tomorrow, '09:30')]);
    fixture.detectChanges();

    expect(element().querySelectorAll('.free-slots li').length).toBe(2);
  });

  it('goes back to the search when the patient is changed', () => {
    openAsDoctor();
    searchAndChoose();
    http.expectOne(availability('7', '1')).flush([]);
    fixture.detectChanges();

    click('.change-patient-button');

    expect(element().querySelector('#query')).not.toBeNull();
    expect(element().querySelector('.chosen-patient')).toBeNull();
  });

  // ---- the place ------------------------------------------------------------------------------

  const chooseAndShowSlots = (slots: unknown[] = [slot(10, tomorrow, '09:00', 120.5)]) => {
    openAsDoctor();
    searchAndChoose();
    http.expectOne(availability('7', '1')).flush(slots);
    fixture.detectChanges();
  };

  it('asks for a confirmation that names the patient, the doctor, the time and the cost', () => {
    chooseAndShowSlots();

    click('.book-button');

    expect(element().querySelector('.confirm-text')?.textContent).toContain('Pippo Baudo');
    expect(element().querySelector('.confirm-text')?.textContent).toContain('Mario Rossi');
    expect(text()).toContain('120,50 €');
  });

  it('says that the cost is to be defined when the list has no price', () => {
    chooseAndShowSlots([slot(10, tomorrow, '09:00', null)]);

    click('.book-button');

    expect(element().querySelector('.confirm-price')?.textContent).toContain('da definire');
  });

  it('closes the question without booking when it is cancelled', () => {
    chooseAndShowSlots();
    click('.book-button');

    click('.cancel-button');

    http.expectNone('/api/v1/appointments');
    expect(element().querySelector('.confirm-text')).toBeNull();
  });

  it('books the place for the patient, says it, and asks the places again', () => {
    chooseAndShowSlots();
    click('.book-button');

    click('.confirm-button');
    const req = http.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ slotId: 10, patientId: 42 });
    req.flush({ id: 5 });
    http.expectOne(availability('7', '1')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Visita prenotata per Pippo Baudo');
    expect(element().querySelector('.confirm-text')).toBeNull();
  });

  it('says why when the place is no longer free, and shows the places that are', () => {
    chooseAndShowSlots();
    click('.book-button');

    click('.confirm-button');
    http.expectOne('/api/v1/appointments').flush(
      { code: 'SLOT_NOT_AVAILABLE', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    http.expectOne(availability('7', '1')).flush([slot(11, tomorrow, '10:00')]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non e\' piu\' disponibile');
    expect(element().querySelectorAll('.free-slots li').length).toBe(1);
  });

  it('says so when the patient has another visit at that time', () => {
    chooseAndShowSlots();
    click('.book-button');

    click('.confirm-button');
    http.expectOne('/api/v1/appointments').flush(
      { code: 'APPOINTMENT_OVERLAP', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    http.expectOne(availability('7', '1')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('gia\' una prenotazione');
  });

  it('shows ten places at a time, and the others on request', () => {
    const many = Array.from({ length: 12 }, (_, i) => slot(100 + i, tomorrow, `${String(8 + i).padStart(2, '0')}:00`));
    chooseAndShowSlots(many);
    expect(element().querySelectorAll('.free-slots li').length).toBe(10);

    click('.more-button');

    expect(element().querySelectorAll('.free-slots li').length).toBe(12);
    expect(element().querySelector('.more-button')).toBeNull();
  });

  it('says so when the doctor has no free place in the next 30 days', () => {
    chooseAndShowSlots([]);

    expect(element().querySelector('.no-slots')).not.toBeNull();
  });

  // ---- the admin ------------------------------------------------------------------------------

  it('lets the admin choose among the active doctors, and shows no place until one is chosen', () => {
    openAsAdmin();
    searchAndChoose();

    expect(element().querySelector('.no-doctor')).not.toBeNull();
    const options = Array.from(element().querySelectorAll('#doctor option')).map((o) => o.textContent!.trim()).filter((t) => t !== 'Seleziona...');
    expect(options).toEqual(['Rossi Mario (Cardiologia)', 'Verdi Anna (Dermatologia)']);
    http.expectNone((r) => r.url === '/api/v1/schedule/availability');
  });

  it('asks the places of the doctor that the admin chooses, with the specialization of that doctor', () => {
    openAsAdmin();
    searchAndChoose();

    const select = element().querySelector('#doctor') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    http.expectOne(availability('8', '2')).flush([{ ...slot(20, tomorrow, '09:00'), doctorId: 2 }]);
    fixture.detectChanges();

    expect(element().querySelectorAll('.free-slots li').length).toBe(1);
  });

  it('does not offer the admin the choice of the doctor to a doctor', () => {
    openAsDoctor();
    searchAndChoose();
    http.expectOne(availability('7', '1')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('#doctor')).toBeNull();
  });
});