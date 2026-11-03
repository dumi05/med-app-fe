import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../http/error.interceptor';
import { WorkingHoursPage } from './working-hours-page';

const TOKEN = 'h.eyJleHAiOjk5OTk5OTk5OTl9.s';
const PATH = '/api/v1/schedule/working-hours';
const answer = (bands: object[] = [], createdSlots = 0, removedSlots = 0) => ({ doctorId: 1, bands, createdSlots, removedSlots });
const band = (dayOfWeek: string, startTime: string, endTime: string) => ({ dayOfWeek, startTime, endTime });
const DOCTORS = [
  { id: 1, firstName: 'Mario', lastName: 'Rossi', specializationId: 7, specialization: 'Cardiologia', email: 'a@x.it', delegationConsent: true, active: true },
  { id: 2, firstName: 'Anna', lastName: 'Verdi', specializationId: 8, specialization: 'Dermatologia', email: 'b@x.it', delegationConsent: true, active: true },
  { id: 3, firstName: 'Piero', lastName: 'Neri', specializationId: 7, specialization: 'Cardiologia', email: 'c@x.it', delegationConsent: true, active: false },
];

describe('WorkingHoursPage', () => {
  let fixture: ComponentFixture<WorkingHoursPage>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const card = (day: string) => element().querySelector(`[data-day="${day}"]`) as HTMLElement;
  const bandsOf = (day: string) => Array.from(card(day).querySelectorAll('.band')).map((b) =>
    `${(b.querySelector('.start-input') as HTMLInputElement).value}-${(b.querySelector('.end-input') as HTMLInputElement).value}`);

  const create = (role: 'DOCTOR' | 'ADMIN') => {
    localStorage.clear();
    localStorage.setItem('medapp.session', JSON.stringify({ token: TOKEN, email: 'x@x.it', role, mustChangePassword: false }));
    TestBed.configureTestingModule({
      imports: [WorkingHoursPage],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(WorkingHoursPage);
    fixture.detectChanges();
  };

  /** A doctor: the page reads their hours at once. */
  const openAsDoctor = (bands: object[] = []) => {
    create('DOCTOR');
    http.expectOne((r) => r.url === PATH && !r.params.has('doctorId')).flush(answer(bands));
    fixture.detectChanges();
  };

  const click = (selector: string, within: ParentNode = element()) => {
    (within.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const setTime = (day: string, index: number, which: 'start' | 'end', value: string) => {
    const input = card(day).querySelectorAll('.band')[index].querySelector(`.${which}-input`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  afterEach(() => http.verify());

  // ---- the hours of a doctor ------------------------------------------------------------------

  it('reads the hours of the logged doctor when it opens, without asking for a doctor', () => {
    openAsDoctor([band('MONDAY', '15:00:00', '19:00:00'), band('MONDAY', '09:00:00', '13:00:00'), band('SATURDAY', '09:00:00', '13:00:00')]);

    expect(bandsOf('MONDAY')).toEqual(['09:00-13:00', '15:00-19:00']);
    expect(bandsOf('SATURDAY')).toEqual(['09:00-13:00']);
    expect(card('TUESDAY').querySelector('.closed')?.textContent).toContain('Chiuso');
  });

  it('has the days from Monday to Saturday and no Sunday', () => {
    openAsDoctor();

    const days = Array.from(element().querySelectorAll('[data-day]')).map((c) => c.getAttribute('data-day'));
    expect(days).toEqual(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
    expect(element().textContent).toContain('La domenica è sempre chiusa');
  });

  it('adds a morning first and an afternoon after, and no more than three bands in a day', () => {
    openAsDoctor();

    click('.add-band-button', card('MONDAY'));
    click('.add-band-button', card('MONDAY'));
    click('.add-band-button', card('MONDAY'));

    expect(bandsOf('MONDAY')).toEqual(['09:00-13:00', '15:00-19:00', '15:00-19:00']);
    expect((card('MONDAY').querySelector('.add-band-button') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('takes a band away', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00'), band('MONDAY', '15:00', '19:00')]);

    click('.remove-band-button', card('MONDAY').querySelector('.band')!);

    expect(bandsOf('MONDAY')).toEqual(['15:00-19:00']);
  });

  it('changes a time', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00')]);

    setTime('MONDAY', 0, 'end', '12:30');

    expect(bandsOf('MONDAY')).toEqual(['09:00-12:30']);
  });

  // ---- saving ---------------------------------------------------------------------------------

  it('sends the bands from Monday to Saturday with "HH:mm" and says how many places were created and taken away', () => {
    openAsDoctor();
    click('.add-band-button', card('WEDNESDAY'));
    click('.add-band-button', card('MONDAY'));
    click('.add-band-button', card('MONDAY'));

    click('.save-button');
    const req = http.expectOne(PATH);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ bands: [
      band('MONDAY', '09:00', '13:00'), band('MONDAY', '15:00', '19:00'), band('WEDNESDAY', '09:00', '13:00'),
    ] });
    req.flush(answer([band('MONDAY', '09:00:00', '13:00:00')], 24, 3));
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('24 posti creati, 3 tolti');
    expect(element().querySelector('.alert-success')?.textContent).toContain('prenotazioni già fatte non cambiano');
  });

  it('can save a week with no hours at all', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00')]);
    click('.remove-band-button', card('MONDAY').querySelector('.band')!);

    click('.save-button');

    expect(http.expectOne(PATH).request.body).toEqual({ bands: [] });
  });

  it('does not send anything, and says where, when a day has a problem', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00'), band('TUESDAY', '09:00', '13:00')]);
    setTime('MONDAY', 0, 'end', '08:00');

    click('.save-button');

    http.expectNone(PATH);
    expect(card('MONDAY').querySelector('.problem')?.textContent).toContain('dopo l\'inizio');
    expect(card('TUESDAY').querySelector('.problem')).toBeNull();
  });

  it('does not shout about a problem before the user tries to save', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00')]);

    setTime('MONDAY', 0, 'end', '08:00');

    expect(element().querySelector('.problem')).toBeNull();
  });

  it('shows the message of the server when the save is refused, and keeps what was typed', () => {
    openAsDoctor([band('MONDAY', '09:00', '13:00')]);
    setTime('MONDAY', 0, 'end', '12:00');

    click('.save-button');
    http.expectOne(PATH).flush({ code: 'INVALID_ARGUMENT', message: 'x', timestamp: 'x' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('I dati inseriti non sono validi');
    expect(bandsOf('MONDAY')).toEqual(['09:00-12:00']);
  });

  it('does not offer the choice of the doctor to a doctor', () => {
    openAsDoctor();

    expect(element().querySelector('#doctor')).toBeNull();
  });

  // ---- the admin ------------------------------------------------------------------------------

  const openAsAdmin = () => {
    create('ADMIN');
    http.expectOne('/api/v1/doctors/admin').flush(DOCTORS);
    fixture.detectChanges();
  };

  const chooseDoctor = (id: string, bands: object[] = []) => {
    const select = element().querySelector('#doctor') as HTMLSelectElement;
    select.value = id;
    select.dispatchEvent(new Event('change'));
    http.expectOne((r) => r.url === PATH && r.params.get('doctorId') === id).flush({ ...answer(bands), doctorId: Number(id) });
    fixture.detectChanges();
  };

  it('offers the admin the active doctors, and shows no hours until one is chosen', () => {
    openAsAdmin();

    const options = Array.from(element().querySelectorAll('#doctor option')).map((o) => o.textContent!.trim()).filter((t) => t !== 'Seleziona...');
    expect(options).toEqual(['Rossi Mario (Cardiologia)', 'Verdi Anna (Dermatologia)']);
    expect(element().querySelector('.no-doctor')).not.toBeNull();
    expect(element().querySelector('[data-day]')).toBeNull();
    http.expectNone((r) => r.url === PATH);
  });

  it('reads the hours of the doctor that the admin chooses', () => {
    openAsAdmin();

    chooseDoctor('2', [band('FRIDAY', '09:00', '12:00')]);

    expect(bandsOf('FRIDAY')).toEqual(['09:00-12:00']);
  });

  it('saves the hours of that doctor, sending his id', () => {
    openAsAdmin();
    chooseDoctor('2');
    click('.add-band-button', card('MONDAY'));

    click('.save-button');

    const req = http.expectOne(PATH);
    expect(req.request.body).toEqual({ doctorId: 2, bands: [band('MONDAY', '09:00', '13:00')] });
    req.flush({ ...answer([band('MONDAY', '09:00:00', '13:00:00')], 8, 0), doctorId: 2 });
  });

  it('reads again, and forgets the unsaved changes, when the admin changes doctor', () => {
    openAsAdmin();
    chooseDoctor('1', [band('MONDAY', '09:00', '13:00')]);
    click('.add-band-button', card('TUESDAY'));

    chooseDoctor('2', []);

    expect(bandsOf('MONDAY')).toEqual([]);
    expect(bandsOf('TUESDAY')).toEqual([]);
  });
});