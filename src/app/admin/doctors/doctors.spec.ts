import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Doctors } from './doctors';

const STRONG = 'Tavolo-Viola-Nuvola-42';

describe('Doctors', () => {
  let fixture: ComponentFixture<Doctors>;
  let http: HttpTestingController;

  const VERDI = { id: 1, firstName: 'Luca', lastName: 'Verdi', email: 'luca@studio-medico.it',
                  specialization: 'Cardiologia', delegationConsent: false, active: true, mustChangePassword: false };
  const NERI = { id: 2, firstName: 'Anna', lastName: 'Neri', email: 'anna@studio-medico.it',
                 specialization: 'Dermatologia', delegationConsent: true, active: false, mustChangePassword: true };

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(element().querySelectorAll('tbody tr'));
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const click = (selector: string) => {
    button(selector).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctors],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Doctors);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/v1/doctors/admin').flush([VERDI, NERI]);
    http.expectOne('/api/v1/specializations').flush([
      { id: 1, name: 'Cardiologia' },
      { id: 2, name: 'Dermatologia' },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const setValue = (id: string, value: string) => {
    const field = element().querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    field.value = value;
    field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  // the table

  it('shows one row per doctor, the deactivated ones included, with the state', () => {
    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Verdi');
    expect(rows()[0].textContent).toContain('Attivo');
    expect(rows()[1].textContent).toContain('Disattivato');
  });

  it('offers to deactivate an active doctor and to reactivate a deactivated one', () => {
    expect(rows()[0].querySelector('.deactivate-button')).not.toBeNull();
    expect(rows()[0].querySelector('.activate-button')).toBeNull();
    expect(rows()[1].querySelector('.activate-button')).not.toBeNull();
    expect(rows()[1].querySelector('.deactivate-button')).toBeNull();
  });

  it('filters the table', () => {
    const input = element().querySelector('input.data-table-filter') as HTMLInputElement;
    input.value = 'neri';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Neri');
  });

  // create

  it('hides the creation form until "Aggiungi medico" is pressed', () => {
    expect(element().querySelector('form')).toBeNull();

    click('.add-button');

    expect(element().querySelector('form')).not.toBeNull();
    expect(button('.add-button').textContent).toContain('Chiudi');
  });

  it('does not send the creation form when it is not valid', () => {
    click('.add-button');
    submit();

    http.expectNone('/api/v1/doctors');
    expect(element().querySelectorAll('.is-invalid').length).toBeGreaterThan(0);
  });

  it('creates the doctor with the specialization id as a number, adds it to the table and closes the form', () => {
    click('.add-button');
    setValue('email', 'paolo@studio-medico.it');
    setValue('password', STRONG);
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();

    const req = http.expectOne('/api/v1/doctors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'paolo@studio-medico.it', password: STRONG, firstName: 'Paolo', lastName: 'Bianchi',
      specializationId: 2, delegationConsent: false,
    });
    req.flush({ id: 3, firstName: 'Paolo', lastName: 'Bianchi', email: 'paolo@studio-medico.it',
                specialization: 'Dermatologia', delegationConsent: false, active: true });
    fixture.detectChanges();

    expect(rows().length).toBe(3);
    expect(element().querySelector('form')).toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Medico creato');
  });

  it('lists the rules of the password under the field and ticks them as the admin types', () => {
    click('.add-button');
    setValue('password', STRONG);
    fixture.detectChanges();

    const rules = (fixture.nativeElement as HTMLElement).querySelectorAll('app-password-rules li');
    expect(rules.length).toBe(4);
    expect(Array.from(rules).every((li) => li.classList.contains('text-success'))).toBeTrue();
  });

  it('does not send the creation form when the password is too short', () => {
    click('.add-button');
    setValue('email', 'paolo@studio-medico.it');
    setValue('password', 'corta');
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();

    http.expectNone('/api/v1/doctors');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-password-rules .text-danger').length).toBeGreaterThan(0);
  });

  it('does not send the creation form when the password is built on the name of the doctor', () => {
    click('.add-button');
    setValue('email', 'paolo@studio-medico.it');
    setValue('password', 'dottor-paolo-bianchi-26');
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/doctors');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Non contiene la tua email');
  });

  it('does not send the creation form when the e-mail has no dot in the domain', () => {
    click('.add-button');
    setValue('email', 'paolo@localhost');
    setValue('password', STRONG);
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();

    http.expectNone('/api/v1/doctors');
  });

  it('tells that the password is the initial one and a new one for the password managers', () => {
    click('.add-button');

    const field = (fixture.nativeElement as HTMLElement).querySelector('#password') as HTMLInputElement;
    expect(field.getAttribute('autocomplete')).toBe('new-password');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Password iniziale');
  });

  it('shows the Italian message when the backend refuses the creation', () => {
    click('.add-button');
    setValue('email', 'paolo@studio-medico.it');
    setValue('password', STRONG);
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();

    http.expectOne('/api/v1/doctors').flush(
      { code: 'INVALID_ARGUMENT', message: 'Email gia registrata', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('I dati inseriti non sono validi.');
  });

  // edit

  it('opens the edit form with the data of the doctor', () => {
    click('.edit-button');

    expect((element().querySelector('#editFirstName') as HTMLInputElement).value).toBe('Luca');
    expect((element().querySelector('#editLastName') as HTMLInputElement).value).toBe('Verdi');
    expect((element().querySelector('#editSpecializationId') as HTMLSelectElement).value).toBe('1');
    expect(element().querySelector('#email')).toBeNull();
  });

  it('saves the changes and shows them in the table', () => {
    click('.edit-button');
    setValue('editFirstName', 'Luigi');
    setValue('editSpecializationId', '2');
    submit();

    const req = http.expectOne('/api/v1/doctors/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ firstName: 'Luigi', lastName: 'Verdi', specializationId: 2, delegationConsent: false });
    req.flush({ ...VERDI, firstName: 'Luigi', specialization: 'Dermatologia' });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Luigi');
    expect(rows()[0].textContent).toContain('Dermatologia');
    expect(element().querySelector('form')).toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Medico aggiornato');
  });

  it('closes the edit form on cancel without sending anything', () => {
    click('.edit-button');
    click('.cancel-edit-button');

    expect(element().querySelector('form')).toBeNull();
  });

  // deactivate / activate

  it('asks for a confirmation before deactivating, and can be cancelled', () => {
    click('.deactivate-button');

    expect(element().querySelector('.confirm-button')).not.toBeNull();
    http.expectNone('/api/v1/doctors/1/deactivate');

    click('.cancel-confirm-button');

    expect(element().querySelector('.confirm-button')).toBeNull();
    expect(element().querySelector('.deactivate-button')).not.toBeNull();
  });

  it('deactivates the doctor after the confirmation', () => {
    click('.deactivate-button');
    click('.confirm-button');

    const req = http.expectOne('/api/v1/doctors/1/deactivate');
    expect(req.request.method).toBe('POST');
    req.flush({ ...VERDI, active: false });
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Disattivato');
    expect(rows()[0].querySelector('.activate-button')).not.toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Medico disattivato');
  });

  it('explains why the deactivation was refused when the doctor has visits to come', () => {
    click('.deactivate-button');
    click('.confirm-button');

    http.expectOne('/api/v1/doctors/1/deactivate').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'visite future', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('visite prenotate future');
    expect(rows()[0].textContent).toContain('Attivo');
  });

  it('reactivates a deactivated doctor', () => {
    click('tbody tr:nth-child(2) .activate-button');

    const req = http.expectOne('/api/v1/doctors/2/activate');
    expect(req.request.method).toBe('POST');
    req.flush({ ...NERI, active: true });
    fixture.detectChanges();

    expect(rows()[1].textContent).toContain('Attivo');
    expect(element().querySelector('.alert-success')?.textContent).toContain('Medico riattivato');
  });

    it('lets the admin see the initial password that is being typed', () => {
    click('.add-button');
    const eye = element().querySelector('button.show-password') as HTMLButtonElement;

    eye.click();
    fixture.detectChanges();

    expect((element().querySelector('#password') as HTMLInputElement).type).toBe('text');
  });

  it('says that the e-mail is already registered when the backend refuses the creation for that', () => {
    click('.add-button');
    setValue('email', 'paolo@studio-medico.it');
    setValue('password', STRONG);
    setValue('firstName', 'Paolo');
    setValue('lastName', 'Bianchi');
    setValue('specializationId', '2');
    submit();

    http.expectOne('/api/v1/doctors').flush(
      { code: 'EMAIL_ALREADY_IN_USE', message: 'Questa email è già registrata.', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Questa email è già registrata.');
  });

  
  // forced change of the password

  it('shows the badge only for the doctors with a pending change', () => {
    expect(rows()[0].querySelector('.pending-badge')).toBeNull();
    expect(rows()[1].querySelector('.pending-badge')?.textContent).toContain('Cambio password richiesto');
  });

  it('sends nothing until the admin confirms the request of a new password', () => {
    click('.confirm-action-ask');
    expect(button('.confirm-action-yes')).not.toBeNull();
    http.expectNone('/api/v1/doctors/1/force-password-change');
    click('.confirm-action-no');
    http.expectNone('/api/v1/doctors/1/force-password-change');
    expect(element().querySelector('.confirm-action-yes')).toBeNull();
  });

  it('asks the doctor to change the password after the confirmation, and shows it in the row', () => {
    click('.confirm-action-ask');
    click('.confirm-action-yes');

    const req = http.expectOne('/api/v1/doctors/1/force-password-change');
    expect(req.request.method).toBe('POST');
    req.flush({ ...VERDI, mustChangePassword: true });
    fixture.detectChanges();

    expect(rows()[0].querySelector('.pending-badge')).not.toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Luca Verdi dovrà scegliere una nuova password');
  });

  it('shows the error and changes nothing when the request of a new password fails', () => {
    click('.confirm-action-ask');
    click('.confirm-action-yes');

    http.expectOne('/api/v1/doctors/1/force-password-change').flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'x', timestamp: 'x' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
    expect(rows()[0].querySelector('.pending-badge')).toBeNull();
  });
});