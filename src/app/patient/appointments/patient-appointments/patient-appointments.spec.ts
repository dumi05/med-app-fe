import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../../shared/http/error.interceptor';
import { PatientAppointments } from './patient-appointments';
import { provideRouter } from '@angular/router';

const appointment = (id: number, status: string) => ({
  id, status, patientId: 1, patientFirstName: 'Anna', patientLastName: 'Bianchi', noShowRisk: null,
  slot: { id: 10 + id, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
          startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: true },
});

describe('PatientAppointments', () => {
  let fixture: ComponentFixture<PatientAppointments>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAppointments],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const open = (list: unknown[]) => {
    fixture = TestBed.createComponent(PatientAppointments);
    fixture.detectChanges();
    http.expectOne('/api/v1/appointments/me').flush(list);
    fixture.detectChanges();
  };

  it('shows one row per appointment with its status', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'CANCELLED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Verdi');
    expect(rows[0].textContent).toContain('Prenotata');
    expect(rows[1].textContent).toContain('Cancellata');
  });

  it('shows the cancel button only for booked appointments', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'CANCELLED')]);

    expect(element().querySelectorAll('tbody button').length).toBe(1);
  });

  it('shows a message when there are no appointments', () => {
    open([]);

    expect(element().textContent).toContain('Non hai ancora prenotazioni');
    expect(element().querySelector('table')).toBeNull();
  });

  it('says that a visit was moved to a colleague because the doctor is away, with who was away', () => {
    open([
      { ...appointment(1, 'BOOKED'), reassignedFromName: 'Mario Rossi', reassignedAt: '2026-11-02T10:00:00Z' },
      appointment(2, 'BOOKED'),
    ]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].querySelector('.reassigned')?.textContent).toContain('il dott. Mario Rossi è assente');
    expect(rows[0].querySelector('.reassigned')?.textContent).toContain('ti riceve il dott. Verdi');
    expect(rows[1].querySelector('.reassigned')).toBeNull();
  });

  it('says that a visit was cancelled because the doctor is away, and offers to book another; a visit cancelled by the patient says nothing', () => {
    open([
      { ...appointment(1, 'CANCELLED'), cancellationReason: 'DOCTOR_ABSENCE' },
      { ...appointment(2, 'CANCELLED'), cancellationReason: 'PATIENT' },
      appointment(3, 'CANCELLED'),
      { ...appointment(4, 'CANCELLED'), reassignedFromName: 'Mario Rossi', cancellationReason: 'PATIENT' },
    ]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].querySelector('.cancelled-by-absence')?.textContent).toContain('il medico è assente');
    expect(rows[0].querySelector('.cancelled-by-absence a')?.getAttribute('href')).toBe('/patient/availability');
    expect(rows[1].querySelector('.cancelled-by-absence')).toBeNull();
    expect(rows[2].querySelector('.cancelled-by-absence')).toBeNull();
    // moved to a colleague and then cancelled by the patient: neither of the two notes
    expect(rows[3].querySelector('.cancelled-by-absence')).toBeNull();
    expect(rows[3].querySelector('.reassigned')).toBeNull();
  });

  it('cancels an appointment and updates its status in the table', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    const req = http.expectOne('/api/v1/appointments/1/cancel');
    expect(req.request.method).toBe('POST');
    req.flush(appointment(1, 'CANCELLED'));
    fixture.detectChanges();

    expect(element().querySelectorAll('tbody tr').length).toBe(1);
    expect(element().querySelector('tbody')!.textContent).toContain('Cancellata');
    expect(element().querySelectorAll('tbody button').length).toBe(0);
  });

  it('shows the Italian message when the cancellation is refused', () => {
    open([appointment(1, 'BOOKED')]);

    (element().querySelector('tbody button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/1/cancel').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
  });

  it('says when the studio made the booking, and says nothing when the patient did', () => {
    open([
      { ...appointment(1, 'BOOKED'), bookedByRole: 'DOCTOR' },
      { ...appointment(2, 'BOOKED'), bookedByRole: 'ADMIN' },
      { ...appointment(3, 'BOOKED'), bookedByRole: 'PATIENT' },
      appointment(4, 'BOOKED'),
    ]);

    const notes = Array.from(element().querySelectorAll('tbody tr')).map((row) => row.querySelector('.booked-by-studio') !== null);
    expect(notes).toEqual([true, true, false, false]);
  });

    it('offers the report link only when the report is written, and says that it is coming when the visit is only paid', () => {
    open([appointment(1, 'REPORTED'), appointment(2, 'INVOICED'), appointment(3, 'BOOKED')]);

    const rows = element().querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Referto disponibile');
    expect(rows[0].querySelector('a')!.textContent).toContain('Vedi referto');
    expect(rows[1].textContent).toContain('Pagata, referto in arrivo');
    expect(rows[1].querySelector('a')).toBeNull();
    expect(rows[2].querySelector('a')).toBeNull();
  })

  // ---- the invoice ----------------------------------------------------------------------------

  /** The browser's save is replaced: what the page would save is collected here. */
  const catchDownloads = () => {
    const clicked: HTMLAnchorElement[] = [];
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    return clicked;
  };
  const invoiceButtons = () => Array.from(element().querySelectorAll('tbody tr')).map((row) => row.querySelector('.invoice-button') !== null);

  it('offers the invoice once the visit is paid, before and after the report, and not before', () => {
    open([appointment(1, 'BOOKED'), appointment(2, 'COMPLETED'), appointment(3, 'INVOICED'), appointment(4, 'REPORTED'), appointment(5, 'CANCELLED')]);

    expect(invoiceButtons()).toEqual([false, false, true, true, false]);
    expect(element().querySelector('.invoice-button')!.textContent).toContain('Scarica fattura');
  });

  it('downloads the invoice with the name that the server proposes', () => {
    const clicked = catchDownloads();
    open([appointment(3, 'INVOICED')]);

    (element().querySelector('.invoice-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((element().querySelector('.invoice-button') as HTMLButtonElement).disabled).toBeTrue();
    http.expectOne('/api/v1/appointments/3/invoice/pdf').flush(
      new Blob(['%PDF-1.4']), { headers: { 'Content-Disposition': 'attachment; filename="FT-2026-00003.pdf"' } });
    fixture.detectChanges();

    expect(clicked.length).toBe(1);
    expect(clicked[0].download).toBe('FT-2026-00003.pdf');
    expect((element().querySelector('.invoice-button') as HTMLButtonElement).disabled).toBeFalse();
    expect(element().querySelector('.alert-danger')).toBeNull();
  });

  it('proposes a name of its own when the server proposes none', () => {
    const clicked = catchDownloads();
    open([appointment(3, 'INVOICED')]);

    (element().querySelector('.invoice-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/3/invoice/pdf').flush(new Blob(['%PDF-1.4']));

    expect(clicked[0].download).toBe('fattura-3.pdf');
  });

  it('says why the invoice cannot be downloaded and lets the user try again', () => {
    const clicked = catchDownloads();
    open([appointment(3, 'INVOICED')]);

    (element().querySelector('.invoice-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/appointments/3/invoice/pdf').flush(new Blob(['{}']), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(clicked.length).toBe(0);
    expect(element().querySelector('.alert-danger')?.textContent).toContain('La fattura non è disponibile');
    expect((element().querySelector('.invoice-button') as HTMLButtonElement).disabled).toBeFalse();
  });
});