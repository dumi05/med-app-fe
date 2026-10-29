import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays, monthOf, monthRange, shiftMonth } from '../../shared/calendar/calendar-grid';
import { todayIso } from '../../shared/format/format';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Availability } from './availability';

const TODAY = todayIso();
const NEXT_MONTH = shiftMonth(monthOf(TODAY), 1);

const DOCTORS = [
  { id: 1, firstName: 'Luca', lastName: 'Verdi', specializationId: 1, specialization: 'Cardiologia' },
  { id: 2, firstName: 'Anna', lastName: 'Neri', specializationId: 1, specialization: 'Cardiologia' },
  { id: 3, firstName: 'Piero', lastName: 'Rossi', specializationId: 2, specialization: 'Dermatologia' },
];

const slot = (id: number, day: string, time: string, doctor = DOCTORS[0], durationMinutes = 30) => ({
  id, doctorId: doctor.id, doctorFirstName: doctor.firstName, doctorLastName: doctor.lastName,
  startTime: `${day}T${time}:00`, durationMinutes, booked: false,
});

const appointment = (id: number, status: string, day: string, time: string) => ({
  id, status, slot: slot(100 + id, day, time, DOCTORS[1]), patientId: 1, patientFirstName: 'Mario', patientLastName: 'Rossi', noShowRisk: null,
});

describe('Availability', () => {
  let fixture: ComponentFixture<Availability>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => element().querySelectorAll('li.list-group-item');
  const day = (iso: string) => element().querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement;
  const text = () => element().textContent ?? '';

  const search = (specializationId: string, from: string, to: string, doctorId?: string) => (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/availability' &&
    r.params.get('specializationId') === specializationId &&
    r.params.get('from') === from &&
    r.params.get('to') === to &&
    r.params.get('doctorId') === (doctorId ?? null);
  const listSearch = (specializationId: string, doctorId?: string) =>
    search(specializationId, TODAY, addDays(TODAY, 29), doctorId);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Availability],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Availability);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** The three requests of the opening. */
  const open = (appointments: unknown[] = []) => {
    http.expectOne('/api/v1/specializations').flush([{ id: 1, name: 'Cardiologia' }, { id: 2, name: 'Dermatologia' }]);
    http.expectOne('/api/v1/doctors').flush(DOCTORS);
    http.expectOne('/api/v1/appointments/me').flush(appointments);
    fixture.detectChanges();
  };

  const choose = (id: string, value: string) => {
    const select = element().querySelector(`#${id}`) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  /** Chooses the specialization and answers the first search. */
  const searchCardiology = (slots: unknown[]) => {
    choose('specializationId', '1');
    http.expectOne(listSearch('1')).flush(slots);
    fixture.detectChanges();
  };

  const goToCalendarNextMonth = (slots: unknown[]) => {
    click('.calendar-view-button');
    http.expectOne(search('1', monthRange(monthOf(TODAY)).from, monthRange(monthOf(TODAY)).to)).flush([]);
    fixture.detectChanges();
    click('.next-month');
    http.expectOne(search('1', monthRange(NEXT_MONTH).from, monthRange(NEXT_MONTH).to)).flush(slots);
    fixture.detectChanges();
  };

  // ---- filters --------------------------------------------------------------------------------

  it('asks to choose a specialization and searches nothing before', () => {
    open();

    expect(element().querySelector('.no-specialization')).not.toBeNull();
    http.expectNone((r) => r.url === '/api/v1/schedule/availability');
  });

  it('searches the next 30 days of the specialization as soon as it is chosen, for any doctor', () => {
    open();

    choose('specializationId', '1');

    const req = http.expectOne(listSearch('1'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('offers "Qualsiasi medico" and only the doctors of the specialization chosen', () => {
    open();
    searchCardiology([]);

    const options = Array.from(element().querySelectorAll('#doctorId option')).map((o) => o.textContent!.trim());
    expect(options).toEqual(['Seleziona...', 'Qualsiasi medico', 'Luca Verdi', 'Anna Neri']);
  });

  it('searches again, for that doctor, when a doctor is chosen', () => {
    open();
    searchCardiology([]);

    choose('doctorId', '2');

    http.expectOne(listSearch('1', '2')).flush([]);
  });

  it('goes back to any doctor when the specialization changes', () => {
    open();
    searchCardiology([]);
    choose('doctorId', '2');
    http.expectOne(listSearch('1', '2')).flush([]);

    choose('specializationId', '2');

    http.expectOne(listSearch('2')).flush([]);
    expect((element().querySelector('#doctorId') as HTMLSelectElement).value).toBe('0');
  });

  it('ignores the answer of an old search that arrives after a newer one', () => {
    open();
    choose('specializationId', '1');
    const first = http.expectOne(listSearch('1'));
    choose('doctorId', '2');
    const second = http.expectOne(listSearch('1', '2'));

    second.flush([slot(2, addDays(TODAY, 3), '10:00', DOCTORS[1])]);
    first.flush([slot(1, addDays(TODAY, 3), '09:00'), slot(3, addDays(TODAY, 4), '09:00')]);
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Anna Neri');
  });

  it('shows the Italian message when the search fails', () => {
    open();
    choose('specializationId', '1');

    http.expectOne(listSearch('1')).flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
  });

  // ---- the list of the next availabilities ----------------------------------------------------

  it('lists the next availabilities with day, hour, doctor and duration', () => {
    open();
    searchCardiology([slot(1, addDays(TODAY, 3), '10:30'), slot(2, addDays(TODAY, 4), '09:00', DOCTORS[1], 45)]);

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('10:30');
    expect(rows()[0].textContent).toContain('Luca Verdi');
    expect(rows()[0].textContent).toContain('30 min');
    expect(rows()[1].textContent).toContain('Anna Neri');
    expect(rows()[1].textContent).toContain('45 min');
  });

  it('shows ten at a time and the others on request', () => {
    open();
    const many = Array.from({ length: 12 }, (_, i) => slot(i + 1, addDays(TODAY, 3), `${String(8 + i).padStart(2, '0')}:00`));
    searchCardiology(many);

    expect(rows().length).toBe(10);

    click('.more-button');

    expect(rows().length).toBe(12);
    expect(element().querySelector('.more-button')).toBeNull();
  });

  it('says so, and points to the calendar, when there is nothing in the next 30 days', () => {
    open();
    searchCardiology([]);

    expect(element().querySelector('.no-results')?.textContent).toContain('calendario');
  });

  // ---- slots that clash with the visits of the patient ----------------------------------------

  it('does not offer the slots that overlap a visit already booked, and says how many are left out', () => {
    open([appointment(1, 'BOOKED', addDays(TODAY, 3), '10:00')]);
    searchCardiology([
      slot(1, addDays(TODAY, 3), '10:15'),   // overlaps the visit 10:00-10:30
      slot(2, addDays(TODAY, 3), '10:30'),   // starts when the visit ends: fine
      slot(3, addDays(TODAY, 4), '10:15'),   // another day
    ]);

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('10:30');
    expect(rows()[0].textContent).not.toContain('10:15');
    expect(rows()[1].textContent).toContain('10:15');
    expect(element().querySelector('.hidden-note')?.textContent).toContain('1 orario non è mostrato');
  });

  it('does not count a cancelled visit', () => {
    open([appointment(1, 'CANCELLED', addDays(TODAY, 3), '10:00')]);
    searchCardiology([slot(1, addDays(TODAY, 3), '10:15')]);

    expect(rows().length).toBe(1);
    expect(element().querySelector('.hidden-note')).toBeNull();
  });

  // ---- the calendar ---------------------------------------------------------------------------

  it('searches the month when the calendar is chosen, and the list again when it is left', () => {
    open();
    searchCardiology([]);

    click('.calendar-view-button');
    http.expectOne(search('1', monthRange(monthOf(TODAY)).from, monthRange(monthOf(TODAY)).to)).flush([]);
    fixture.detectChanges();
    click('.list-view-button');

    http.expectOne(listSearch('1')).flush([]);
  });

  it('writes on each day the free slots, and only the days with slots can be pressed', () => {
    open();
    searchCardiology([]);
    goToCalendarNextMonth([
      slot(1, `${NEXT_MONTH}-15`, '09:00'), slot(2, `${NEXT_MONTH}-15`, '09:30', DOCTORS[1]), slot(3, `${NEXT_MONTH}-16`, '10:00'),
    ]);

    expect(day(`${NEXT_MONTH}-15`).querySelector('.free-badge')?.textContent).toBe('2');
    expect(day(`${NEXT_MONTH}-15`).disabled).toBeFalse();
    expect(day(`${NEXT_MONTH}-17`).disabled).toBeTrue();
  });

  it('shows the hours of the day pressed, by doctor', () => {
    open();
    searchCardiology([]);
    goToCalendarNextMonth([
      slot(1, `${NEXT_MONTH}-15`, '09:00'), slot(2, `${NEXT_MONTH}-15`, '09:30'), slot(3, `${NEXT_MONTH}-15`, '11:00', DOCTORS[1]),
    ]);

    day(`${NEXT_MONTH}-15`).click();
    fixture.detectChanges();

    expect(text()).toContain('Luca Verdi');
    expect(text()).toContain('Anna Neri');
    expect(Array.from(element().querySelectorAll('.hour-button')).map((b) => b.textContent!.trim())).toEqual(['09:00', '09:30', '11:00']);
  });

  it('asks to choose a day before showing any hour', () => {
    open();
    searchCardiology([]);
    goToCalendarNextMonth([slot(1, `${NEXT_MONTH}-15`, '09:00')]);

    expect(text()).toContain('Scegli un giorno');
    expect(element().querySelector('.hour-button')).toBeNull();
  });

  it('does not let the user go back before the current month', () => {
    open();
    searchCardiology([]);
    click('.calendar-view-button');
    http.expectOne(search('1', monthRange(monthOf(TODAY)).from, monthRange(monthOf(TODAY)).to)).flush([]);
    fixture.detectChanges();

    expect((element().querySelector('.prev-month') as HTMLButtonElement).disabled).toBeTrue();
  });

  // ---- booking --------------------------------------------------------------------------------

  const askFirstSlot = () => {
    open();
    searchCardiology([slot(7, addDays(TODAY, 3), '10:30')]);
    click('.book-button');
  };

  it('asks for a confirmation before booking, with doctor, day, hour and duration', () => {
    askFirstSlot();

    const confirm = element().querySelector('.confirm-text')?.textContent ?? '';
    expect(confirm).toContain('Luca Verdi');
    expect(confirm).toContain('alle 10:30');
    expect(confirm).toContain('30 min');
    http.expectNone('/api/v1/appointments');
  });

  it('forgets the booking when it is cancelled', () => {
    askFirstSlot();

    click('.cancel-button');

    expect(element().querySelector('.confirm-text')).toBeNull();
    http.expectNone('/api/v1/appointments');
  });

  it('books the slot, says so, and searches again', () => {
    askFirstSlot();

    click('.confirm-button');

    const req = http.expectOne('/api/v1/appointments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ slotId: 7 });
    req.flush(appointment(1, 'BOOKED', addDays(TODAY, 3), '10:30'));
    http.expectOne('/api/v1/appointments/me').flush([]);
    http.expectOne(listSearch('1')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Prenotazione confermata');
    expect(element().querySelector('.confirm-text')).toBeNull();
  });

  it('books from the hour buttons of the calendar too', () => {
    open();
    searchCardiology([]);
    goToCalendarNextMonth([slot(8, `${NEXT_MONTH}-15`, '09:00')]);
    day(`${NEXT_MONTH}-15`).click();
    fixture.detectChanges();

    click('.hour-button');
    click('.confirm-button');

    const req = http.expectOne('/api/v1/appointments');
    expect(req.request.body).toEqual({ slotId: 8 });
    req.flush({});
    http.expectOne('/api/v1/appointments/me').flush([]);
    http.expectOne(search('1', monthRange(NEXT_MONTH).from, monthRange(NEXT_MONTH).to)).flush([]);
  });

  it('shows the message and searches again when the slot was taken in the meantime', () => {
    askFirstSlot();
    click('.confirm-button');

    http.expectOne('/api/v1/appointments').flush(
      { code: 'SLOT_NOT_AVAILABLE', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    http.expectOne('/api/v1/appointments/me').flush([]);
    http.expectOne(listSearch('1')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('non e\' piu\' disponibile');
  });

  it('shows the message, and learns about the other visit, when the backend finds an overlap', () => {
    askFirstSlot();
    click('.confirm-button');

    http.expectOne('/api/v1/appointments').flush(
      { code: 'APPOINTMENT_OVERLAP', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    http.expectOne('/api/v1/appointments/me').flush([appointment(1, 'BOOKED', addDays(TODAY, 3), '10:15')]);
    http.expectOne(listSearch('1')).flush([slot(7, addDays(TODAY, 3), '10:30'), slot(9, addDays(TODAY, 3), '10:40')]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain("Hai gia' una prenotazione");
    // the slot 10:30-11:00 overlaps the visit 10:15-10:45 that the patient has just been told about
    expect(rows().length).toBe(0);
  });

  it('does not search again for an error that has nothing to do with the slots', () => {
    askFirstSlot();
    click('.confirm-button');

    http.expectOne('/api/v1/appointments').flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
  });
});