import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { errorInterceptor } from "../../shared/http/error.interceptor";
import { DoctorDelegations } from "./doctor-delegations";

const ME = { id: 1, firstName: 'Lica', lastName: 'Nervi', specialization: 'Cardioogia'};
const DOCTORS = [
    ME,
    { id: 2, firstName: 'Ana', lastName: 'Alba', specialization: 'DErmatologia'},
    { id: 3, firstName: 'Remo', lastName: 'Bianchi', specialization: 'Ortopedia'},
];

const NAMES: Record<number, [string, string]> = { 1: ['Lica', 'Nervi'], 2: ['Ana', 'Alba'] };

const delegation = (id: number, status: string, delegatingId: number, delegateId: number,
                    start = '2020-01-01', end = '2099-12-31') => ({
  id, status, startDate: start, endDate: end,
  delegatingDoctorId: delegatingId,
  delegatingDoctorFirstName: NAMES[delegatingId][0], delegatingDoctorLastName: NAMES[delegatingId][1],
  delegateDoctorId: delegateId,
  delegateDoctorFirstName: NAMES[delegateId][0], delegateDoctorLastName: NAMES[delegateId][1],
});

describe('DoctorDelegations', () => {
  let fixture: ComponentFixture<DoctorDelegations>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => element().querySelectorAll('tbody tr');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorDelegations],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(DoctorDelegations);
    fixture.detectChanges();
    http.expectOne('/api/v1/doctors/me').flush(ME);
    http.expectOne('/api/v1/doctors').flush(DOCTORS);
    http.expectOne('/api/v1/doctor-delegations/me').flush(list);
    fixture.detectChanges();
  };

  const setValue = (id: string, value: string) => {
    const f = element().querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
    f.value = value;
    f.dispatchEvent(new Event(f instanceof HTMLSelectElement ? 'change' : 'input'));
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const fillInTheForm = () => {
    setValue('delegateDoctorId', '2');
    setValue('startDate', '2026-11-02');
    setValue('endDate', '2026-11-09');
  };

  it('shows the delegations with actions, colleague and status', () => {
    open([delegation(10, 'PROPOSED', 2, 1), delegation(11, 'ACCEPTED', 1, 2), delegation(12, 'REJECTED', 1, 2)]);

    expect(rows().length).toBe(3);
    expect(rows()[0].textContent).toContain('Delegato a te');
    expect(rows()[0].textContent).toContain('Ana Alba');
    expect(rows()[0].textContent).toContain('In attesa');
    expect(rows()[1].textContent).toContain('Hai delegato');
    expect(rows()[1].textContent).toContain('Attiva');
    expect(rows()[2].textContent).toContain('Rifiutata');
  });

  it('shows an accepted delegation as scheduled or ended according to its dates', () => {
    open([delegation(10, 'ACCEPTED', 1, 2, '2020-01-01', '2020-12-31'),
          delegation(11, 'ACCEPTED', 1, 2, '2098-01-01', '2099-12-31')]);

    expect(rows()[0].textContent).toContain('Terminata');
    expect(rows()[1].textContent).toContain('Programmata');
  });

  it('offers accept and reject only on the proposals received', () => {
    open([delegation(10, 'PROPOSED', 2, 1), delegation(11, 'PROPOSED', 1, 2), delegation(12, 'ACCEPTED', 2, 1)]);

    expect(rows()[0].querySelectorAll('button').length).toBe(2);
    expect(rows()[1].querySelectorAll('button').length).toBe(0);
    expect(rows()[2].querySelectorAll('button').length).toBe(0);
  });

  it('accepts a proposal and updates the row', () => {
    open([delegation(10, 'PROPOSED', 2, 1)]);

    (rows()[0].querySelectorAll('button')[0] as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/doctor-delegations/10/accept');
    expect(req.request.method).toBe('POST');
    req.flush(delegation(10, 'ACCEPTED', 2, 1));
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Attiva');
    expect(rows()[0].querySelectorAll('button').length).toBe(0);
  });

  it('rejects a proposal and updates the row', () => {
    open([delegation(10, 'PROPOSED', 2, 1)]);

    (rows()[0].querySelectorAll('button')[1] as HTMLButtonElement).click();
    http.expectOne('/api/v1/doctor-delegations/10/reject').flush(delegation(10, 'REJECTED', 2, 1));
    fixture.detectChanges();

    expect(rows()[0].textContent).toContain('Rifiutata');
  });

  it('proposes to the colleagues only, not to the doctor himself', () => {
    open([]);

    const options = Array.from(element().querySelectorAll('#delegateDoctorId option')).map((o) => o.textContent);
    expect(options.length).toBe(3);
    expect(options.join(' ')).toContain('Alba');
    expect(options.join(' ')).not.toContain('Nervi');
  });

  it('does not send the form when it is not valid', () => {
    open([]);

    submit();

    http.expectNone('/api/v1/doctor-delegations');
    expect(element().querySelectorAll('.is-invalid').length).toBe(3);
  });

  it('does not send the form when the end is before the start', () => {
    open([]);
    setValue('delegateDoctorId', '2');
    setValue('startDate', '2026-11-09');
    setValue('endDate', '2026-11-02');

    submit();

    http.expectNone('/api/v1/doctor-delegations');
    expect(element().querySelector('.alert-danger')?.textContent).toContain('non può precedere');
  });

  it('proposes a delegation with the colleague id as a number and adds it to the table', () => {
    open([]);
    fillInTheForm();

    submit();

    const req = http.expectOne('/api/v1/doctor-delegations');
    expect(req.request.body).toEqual({ delegateDoctorId: 2, startDate: '2026-11-02', endDate: '2026-11-09' });
    req.flush(delegation(20, 'PROPOSED', 1, 2, '2026-11-02', '2026-11-09'));
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Hai delegato');
    expect(element().querySelector('.alert-success')?.textContent).toContain('Proposta inviata');
  });

  it('shows the Italian message when the backend refuses the proposal', () => {
    open([]);
    fillInTheForm();

    submit();
    http.expectOne('/api/v1/doctor-delegations').flush(
      { code: 'INVALID_ARGUMENT', message: 'x', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('I dati inseriti non sono validi.');
  });

  it('shows a message when there are no delegations', () => {
    open([]);

    expect(element().textContent).toContain('Non hai ancora deleghe');
    expect(element().querySelector('table')).toBeNull();
  });
});