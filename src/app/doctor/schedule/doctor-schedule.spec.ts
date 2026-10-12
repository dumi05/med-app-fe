import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DoctorSchedule } from './doctor-schedule';

describe('DoctorSchedule', () => {
  let fixture: ComponentFixture<DoctorSchedule>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSchedule],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(DoctorSchedule);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const setValue = (id: string, value: string) => {
    const input = element().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('does not send the form when it is not valid', () => {
    submit();

    http.expectNone('/api/v1/schedule/slot');
    expect(element().querySelector('#startTime')!.classList.contains('is-invalid')).toBeTrue();
    expect(element().querySelector('#durationMinutes')!.classList.contains('is-invalid')).toBeFalse();
  });

  it('rejects a duration that is not positive', () => {
    setValue('startTime', '2026-10-20T09:30');
    setValue('durationMinutes', '0');
    submit();

    http.expectNone('/api/v1/schedule/slot');
    expect(element().querySelector('#durationMinutes')!.classList.contains('is-invalid')).toBeTrue();
  });

  it('sends the slot with seconds added and confirms the creation', () => {
    setValue('startTime', '2026-10-20T09:30');
    setValue('durationMinutes', '30');
    submit();

    const req = http.expectOne('/api/v1/schedule/slot');
    expect(req.request.body).toEqual({ startTime: '2026-10-20T09:30:00', durationMinutes: 30 });
    req.flush({ id: 11, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
                startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: false });
    fixture.detectChanges();

    expect(element().querySelector('.alert-success')?.textContent).toContain('Slot creato');
  });

  it('shows the Italian message when the backend refuses the slot', () => {
    setValue('startTime', '2026-10-20T09:30');
    setValue('durationMinutes', '30');
    submit();

    http.expectOne('/api/v1/schedule/slot').flush(
      { code: 'INVALID_ARGUMENT', message: 'non valido', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('I dati inseriti non sono validi.');
    expect(element().querySelector('.alert-success')).toBeNull();
  });
});