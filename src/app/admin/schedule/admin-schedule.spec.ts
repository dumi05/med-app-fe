import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays, monthOf, monthRange, shiftMonth } from '../../shared/calendar/calendar-grid';
import { todayIso } from '../../shared/format/format';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { AdminSchedule } from './admin-schedule';

const THIS_MONTH = monthOf(todayIso());
const TOMORROW = addDays(todayIso(), 1);

const doctor = (id: number, last: string, active = true) => ({
  id, firstName: 'Mario', lastName: last, specializationId: 7, specialization: 'Cardiologia', email: `${last}@x.it`, delegationConsent: true, active,
});
const slot = (id: number, day: string, time: string) => ({
  id, doctorId: 1, doctorFirstName: 'Mario', doctorLastName: 'Rossi', startTime: `${day}T${time}:00`, durationMinutes: 30, booked: false,
});

describe('AdminSchedule', () => {
  let fixture: ComponentFixture<AdminSchedule>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const availability = (month: string, doctorId = 1) => (r: HttpRequest<unknown>) =>
    r.url === '/api/v1/schedule/availability' &&
    r.params.get('specializationId') === '7' &&
    r.params.get('doctorId') === String(doctorId) &&
    r.params.get('from') === monthRange(month).from &&
    r.params.get('to') === monthRange(month).to;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSchedule],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminSchedule);
    fixture.detectChanges();
    http.expectOne('/api/v1/doctors/admin').flush([doctor(1, 'Rossi'), doctor(2, 'Verdi'), doctor(3, 'Bianchi', false)]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const choose = (id: number, slots: unknown[] = []) => {
    const select = element().querySelector('#doctor') as HTMLSelectElement;
    select.value = String(id);
    select.dispatchEvent(new Event('change'));
    http.expectOne(availability(THIS_MONTH, id)).flush(slots);
    fixture.detectChanges();
  };

  const setValue = (id: string, value: string) => {
    const field = element().querySelector(`#${id}`) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const fillIn = (date: string, start = '09:00', end = '11:00') => {
    setValue('date', date);
    setValue('startTime', start);
    setValue('endTime', end);
    setValue('slotMinutes', '30');
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('offers the active doctors only, and asks to choose one before showing anything', () => {
    const options = Array.from(element().querySelectorAll('#doctor option')).map((o) => o.textContent!.trim()).filter((t) => t !== 'Seleziona...');
    expect(options).toEqual(['Rossi Mario (Cardiologia)', 'Verdi Mario (Cardiologia)']);
    expect(element().querySelector('.no-doctor')).not.toBeNull();
    expect(element().querySelector('form')).toBeNull();
  });

  it('shows the free places of the month of the chosen doctor, with the specialization of that doctor', () => {
    choose(1, [slot(10, TOMORROW, '09:00'), slot(11, TOMORROW, '09:30')]);

    expect(element().querySelector('.no-doctor')).toBeNull();
    expect(element().querySelector(`button[data-day="${TOMORROW}"] .free-badge`)?.textContent?.trim()).toBe('2');
    expect(element().querySelector('h2.h5.mb-3')?.textContent).toContain('Mario Rossi');
  });

  it('lists the free places of the day that is selected', () => {
    choose(1, [slot(10, TOMORROW, '09:00'), slot(11, TOMORROW, '09:30')]);

    (element().querySelector(`button[data-day="${TOMORROW}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element().querySelectorAll('.list-group-item').length).toBe(2);
    expect((element().querySelector('#date') as HTMLInputElement).value).toBe(TOMORROW);
  });

  it('loads the other month when it moves, for the same doctor', () => {
    choose(1);

    (element().querySelector('.next-month') as HTMLButtonElement).click();
    http.expectOne(availability(shiftMonth(THIS_MONTH, 1))).flush([]);
  });

  it('loads the places of the other doctor when the choice changes', () => {
    choose(1, [slot(10, TOMORROW, '09:00')]);

    choose(2, []);

    expect(element().querySelector(`button[data-day="${TOMORROW}"] .free-badge`)).toBeNull();
  });

  it('creates the slots for the chosen doctor, sending the id of the doctor', () => {
    choose(2);
    fillIn(TOMORROW);
    submit();

    const req = http.expectOne('/api/v1/schedule/slots/bulk');
    expect(req.request.body).toEqual({ doctorId: 2, date: TOMORROW, startTime: '09:00', endTime: '11:00', slotMinutes: 30 });
    req.flush([slot(20, TOMORROW, '09:00'), slot(21, TOMORROW, '09:30'), slot(22, TOMORROW, '10:00'), slot(23, TOMORROW, '10:30')]);
    http.expectOne(availability(monthOf(TOMORROW), 2)).flush([]);
    fixture.detectChanges();

    expect(element().textContent).toContain('Creati 4 slot.');
  });

  it('does not send the form for a past date, or when the end is not after the start', () => {
    choose(1);
    fillIn(addDays(todayIso(), -1));
    submit();
    http.expectNone('/api/v1/schedule/slots/bulk');
    expect(element().querySelector('.problem')?.textContent).toContain('passato');

    fillIn(TOMORROW, '11:00', '09:00');
    submit();
    http.expectNone('/api/v1/schedule/slots/bulk');
    expect(element().querySelector('.problem')).not.toBeNull();
  });

  it('shows the message of the server when the slots overlap others', () => {
    choose(1);
    fillIn(TOMORROW);
    submit();

    http.expectOne('/api/v1/schedule/slots/bulk').flush(
      { code: 'SLOT_OVERLAP', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Esistono gia');
  });
});