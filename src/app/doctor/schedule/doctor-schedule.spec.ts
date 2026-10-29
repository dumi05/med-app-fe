import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { addDays, monthLabel, monthOf, monthRange, shiftMonth } from '../../shared/calendar/calendar-grid';
import { todayIso } from '../../shared/format/format';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DoctorSchedule } from './doctor-schedule';

const THIS_MONTH = monthOf(todayIso());

const slot = (id: number, day: string, time: string, booked = false) => ({
  id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
  startTime: `${day}T${time}:00`, durationMinutes: 30, booked,
});

describe('DoctorSchedule', () => {
  let fixture: ComponentFixture<DoctorSchedule>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const day = (iso: string) => element().querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement;
  const mySlots = (month: string) => (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/slots/me' &&
    r.params.get('from') === monthRange(month).from &&
    r.params.get('to') === monthRange(month).to;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSchedule],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DoctorSchedule);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** The page asks for the slots of the month when it opens. */
  const open = (slots: unknown[] = []) => {
    http.expectOne(mySlots(THIS_MONTH)).flush(slots);
    fixture.detectChanges();
  };

  const setValue = (id: string, value: string) => {
    const field = element().querySelector(`#${id}`) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const fillIn = (date: string, start = '09:00', end = '11:00', minutes = '30') => {
    setValue('date', date);
    setValue('startTime', start);
    setValue('endTime', end);
    setValue('slotMinutes', minutes);
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  // ---- the calendar ---------------------------------------------------------------------------

  it('asks for the slots of the current month when it opens', () => {
    const req = http.expectOne(mySlots(THIS_MONTH));

    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('shows the free and the booked slots on each day of the calendar', () => {
    const d = `${THIS_MONTH}-10`;
    open([slot(1, d, '09:00'), slot(2, d, '09:30'), slot(3, d, '10:00', true)]);

    expect(day(d).querySelector('.free-badge')?.textContent).toBe('2');
    expect(day(d).querySelector('.booked-badge')?.textContent).toBe('1');
  });

  it('lists the slots of the day pressed, with their range and their state', () => {
    const d = `${THIS_MONTH}-10`;
    open([slot(1, d, '09:00'), slot(2, d, '09:30', true)]);

    day(d).click();
    fixture.detectChanges();

    const rows = element().querySelectorAll('li.list-group-item');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('09:00–09:30');
    expect(rows[0].textContent).toContain('Libero');
    expect(rows[1].textContent).toContain('09:30–10:00');
    expect(rows[1].textContent).toContain('Prenotato');
  });

  it('points to "Le mie visite" for a booked slot, and does not show the name of the patient', () => {
    const d = `${THIS_MONTH}-10`;
    open([slot(1, d, '09:00', true)]);

    day(d).click();
    fixture.detectChanges();

    expect(element().querySelector('li a')?.getAttribute('href')).toBe('/doctor/visits');
  });

  it('says so when the day pressed has no slots', () => {
    open([]);

    day(`${THIS_MONTH}-11`).click();
    fixture.detectChanges();

    expect(element().querySelector('.no-slots')?.textContent).toContain('Nessuno slot');
  });

  it('asks for the slots of another month when the user moves, and forgets the day', () => {
    open([]);
    day(`${THIS_MONTH}-10`).click();

    click('.prev-month');

    const previous = shiftMonth(THIS_MONTH, -1);
    http.expectOne(mySlots(previous)).flush([]);
    fixture.detectChanges();
    expect(element().querySelector('.month-title')?.textContent).toContain(monthLabel(previous));
    expect(element().querySelector('li.list-group-item')).toBeNull();
    expect(element().querySelector('.no-slots')).toBeNull();
  });

  it('shows the Italian message when the slots cannot be loaded', () => {
    http.expectOne(mySlots(THIS_MONTH)).flush(
      { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
  });

  // ---- the form takes the day -----------------------------------------------------------------

  it('fills the date of the form when a day from today on is pressed', () => {
    open([]);
    click('.next-month');
    const next = shiftMonth(THIS_MONTH, 1);
    http.expectOne(mySlots(next)).flush([]);
    fixture.detectChanges();

    day(`${next}-10`).click();
    fixture.detectChanges();

    expect((element().querySelector('#date') as HTMLInputElement).value).toBe(`${next}-10`);
  });

  it('leaves the date alone when a day in the past is pressed (it can only be looked at)', () => {
    open([]);
    click('.prev-month');
    const previous = shiftMonth(THIS_MONTH, -1);
    http.expectOne(mySlots(previous)).flush([]);
    fixture.detectChanges();

    day(`${previous}-10`).click();
    fixture.detectChanges();

    expect((element().querySelector('#date') as HTMLInputElement).value).toBe('');
  });

  // ---- the plan -------------------------------------------------------------------------------

  it('shows, while the user types, the slots that will be created', () => {
    open();
    fillIn('2099-03-10', '09:00', '11:00', '30');

    const preview = element().querySelector('.preview')?.textContent ?? '';
    expect(preview).toContain('4');
    expect(preview).toContain('09:00, 09:30, 10:00, 10:30');
  });

  it('abbreviates the preview when there are many slots', () => {
    open();
    fillIn('2099-03-10', '08:00', '12:00', '15');

    expect(element().querySelector('.preview')?.textContent).toContain('08:00, 08:15, 08:30, 08:45, 09:00, 09:15…');
  });

  it('says why the plan is wrong, and sends nothing', () => {
    open();
    fillIn('2099-03-10', '11:00', '09:00', '30');

    expect(element().querySelector('.problem')?.textContent).toContain('dopo quello di inizio');
    expect(element().querySelector('.preview')).toBeNull();

    submit();
    http.expectNone('/api/v1/schedule/slots/bulk');
  });

  it('refuses a date in the past', () => {
    open();
    fillIn(addDays(todayIso(), -1));

    expect(element().querySelector('.problem')?.textContent).toContain('nel passato');
    submit();
    http.expectNone('/api/v1/schedule/slots/bulk');
  });

  it('refuses a start that has already gone today', () => {
    open();
    fillIn(todayIso(), '00:00', '01:00', '30');

    expect(element().querySelector('.problem')?.textContent).toContain('già passato');
  });

  it('refuses more than 48 slots', () => {
    open();
    fillIn('2099-03-10', '08:00', '12:05', '5');

    expect(element().querySelector('.problem')?.textContent).toContain('Al massimo 48');
  });

  it('does not send the form when it is empty', () => {
    open();
    submit();

    http.expectNone('/api/v1/schedule/slots/bulk');
    expect(element().querySelectorAll('.is-invalid').length).toBe(3);
  });

  // ---- creation -------------------------------------------------------------------------------

  it('sends the plan, says how many slots were created and shows them', () => {
    open();
    fillIn('2099-03-10', '09:00', '11:00', '30');
    submit();

    const req = http.expectOne('/api/v1/schedule/slots/bulk');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ date: '2099-03-10', startTime: '09:00', endTime: '11:00', slotMinutes: 30 });
    req.flush([slot(1, '2099-03-10', '09:00'), slot(2, '2099-03-10', '09:30'), slot(3, '2099-03-10', '10:00'), slot(4, '2099-03-10', '10:30')]);
    fixture.detectChanges();

    // the calendar goes where the new slots are and loads that month
    http.expectOne(mySlots('2099-03')).flush([slot(1, '2099-03-10', '09:00'), slot(2, '2099-03-10', '09:30')]);
    fixture.detectChanges();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Creati 4 slot.');
    expect(element().querySelectorAll('li.list-group-item').length).toBe(2);
  });

  it('keeps the date and clears the times after the creation, so that the next range can be typed', () => {
    open();
    fillIn('2099-03-10');
    submit();
    http.expectOne('/api/v1/schedule/slots/bulk').flush([slot(1, '2099-03-10', '09:00')]);
    http.expectOne(mySlots('2099-03')).flush([]);
    fixture.detectChanges();

    expect((element().querySelector('#date') as HTMLInputElement).value).toBe('2099-03-10');
    expect((element().querySelector('#startTime') as HTMLInputElement).value).toBe('');
    expect((element().querySelector('#endTime') as HTMLInputElement).value).toBe('');
    expect((element().querySelector('#slotMinutes') as HTMLInputElement).value).toBe('30');
  });

  it('writes "Creato 1 slot." for a single slot', () => {
    open();
    fillIn('2099-03-10', '09:00', '09:30', '30');
    submit();
    http.expectOne('/api/v1/schedule/slots/bulk').flush([slot(1, '2099-03-10', '09:00')]);
    http.expectOne(mySlots('2099-03')).flush([]);
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Creato 1 slot.');
  });

  it('tells that there are already slots in that time and keeps the form as it is', () => {
    open();
    fillIn('2099-03-10');
    submit();

    http.expectOne('/api/v1/schedule/slots/bulk').flush(
      { code: 'SLOT_OVERLAP', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain("Esistono gia' slot");
    expect((element().querySelector('#startTime') as HTMLInputElement).value).toBe('09:00');
  });
});