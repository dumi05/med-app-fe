import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from '../../../shared/http/error.interceptor';
import { DoctorVisits } from './doctor-visits';

const appointment = (id: number, status: string, noShowRisk = false) => ({
  id, status, noShowRisk, patientId: 1, patientFirstName: 'Anna', patientLastName: 'Bianchi',
  slot: { id: 10 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
          startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: true },
});

describe('DoctorVisits', () => {
  let fixture: ComponentFixture<DoctorVisits>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorVisits],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(DoctorVisits);
    fixture.detectChanges();
    http.expectOne('/api/v1/appointments/me').flush(list);
    fixture.detectChanges();
  };

  it('shows one row per appointment with the patient and the status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'COMPLETED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Anna Bianchi');
    expect(rows[0].textContent).toContain('Prenotata');
    expect(rows[1].textContent).toContain('Visita effettuata');
  });

  it('flags the appointments with no-show risk', () => {
    open([appointment(1, 'BOOKED', true), appointment(2, 'BOOKED', false)]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Rischio no-show');
    expect(rows[1].textContent).not.toContain('Rischio no-show');
  });

  it('shows a message when there are no appointments', () => {
    open([]);
    expect(element().textContent).toContain('Non hai ancora visite');
  });

  it('shows the Italian message when the completion is refused', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/1/complete').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
  });

  it('offers the right action for each status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'COMPLETED'), appointment(3, 'INVOICED'), appointment(4, 'REPORTED'), appointment(5, 'CANCELLED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].querySelector('button')!.textContent).toContain('Completa visita');
    expect(rows[1].querySelector('button')!.textContent).toContain('Registra pagamento ed emetti fattura');
    expect(rows[1].querySelector('a')).toBeNull();
    expect(rows[2].querySelector('a')!.textContent).toContain('Scrivi referto');
    expect(rows[2].querySelector('button')).toBeNull();
    expect(rows[3].querySelector('a')!.textContent).toContain('Vedi referto');
    expect(rows[4].querySelector('button, a')).toBeNull();
  });

  it('completes a visit and updates the row', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/appointments/1/complete');
    expect(req.request.method).toBe('POST');
    req.flush(appointment(1, 'COMPLETED'));
    fixture.detectChanges();

    const row = element().querySelector('tbody tr')!;
    expect(row.textContent).toContain('Visita effettuata');
    expect(row.querySelector('button')!.textContent).toContain('Registra pagamento');
    expect(row.querySelector('a')).toBeNull();
  });

  // payment and invoice

  const INVOICE = { appointmentId: 2, number: 'FT-2026-00002', amount: 120.5, issuedAt: '2026-10-20T10:00:00Z', paidAt: '2026-10-20T10:00:00Z' };
  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  it('asks "Il paziente ha pagato?" first, and sends nothing before the doctor confirms', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');

    http.expectNone('/api/v1/appointments/2/invoice');
    expect(element().textContent).toContain('Il paziente ha pagato?');
    expect(element().querySelector('.invoice-button')).toBeNull();
  });

  it('registers the payment: sends the request, says the number and the amount, and the visit is ready for its report', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');
    click('.confirm-invoice-button');
    const req = http.expectOne('/api/v1/appointments/2/invoice');
    expect(req.request.method).toBe('POST');
    req.flush(INVOICE);
    fixture.detectChanges();

    const row = element().querySelector('tbody tr')!;
    expect(row.textContent).toContain('Pagata, referto in arrivo');
    expect(row.querySelector('a')!.textContent).toContain('Scrivi referto');
    expect(row.querySelector('button')).toBeNull();
    const message = element().querySelector('.alert-success')?.textContent ?? '';
    expect(message).toContain('FT-2026-00002');
    expect(message).toContain('120,50');
  });

  it('does nothing if the doctor says that the patient has not paid', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');
    click('.cancel-invoice-button');

    http.expectNone('/api/v1/appointments/2/invoice');
    expect(element().querySelector('.invoice-button')).not.toBeNull();
    expect(element().querySelector('.confirm-invoice-button')).toBeNull();
  });

  it('does not send the request twice while the first is on its way', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');
    click('.confirm-invoice-button');

    expect((element().querySelector('.confirm-invoice-button') as HTMLButtonElement | null)?.disabled ?? true).toBeTrue();
    http.expectOne('/api/v1/appointments/2/invoice').flush(INVOICE);
  });

  it('says that the price is missing in the list when the server does not find it, and keeps the visit as it was', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');
    click('.confirm-invoice-button');
    http.expectOne('/api/v1/appointments/2/invoice').flush(
      { code: 'RESOURCE_NOT_FOUND', message: 'x', timestamp: 'x' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('manca il prezzo');
    expect(element().querySelector('tbody tr')!.textContent).toContain('Visita effettuata');
    expect(element().querySelector('.invoice-button')).not.toBeNull();
  });

  it('shows the usual message for the other refusals', () => {
    open([appointment(2, 'COMPLETED')]);

    click('.invoice-button');
    click('.confirm-invoice-button');
    http.expectOne('/api/v1/appointments/2/invoice').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
    expect(element().querySelector('.alert-danger')?.textContent).not.toContain('prezzo');
  });

  it('forgets the message of the invoice when the doctor completes another visit', () => {
    open([appointment(2, 'COMPLETED'), appointment(1, 'BOOKED')]);
    click('.invoice-button');
    click('.confirm-invoice-button');
    http.expectOne('/api/v1/appointments/2/invoice').flush(INVOICE);
    fixture.detectChanges();
    expect(element().querySelector('.alert-success')).not.toBeNull();

    (element().querySelectorAll('tbody tr')[1].querySelector('button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/1/complete').flush(appointment(1, 'COMPLETED'));
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')).toBeNull();
  });
});