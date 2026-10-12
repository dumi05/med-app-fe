import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let http: HttpTestingController;
  let service: ScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ScheduleService);
  });

  afterEach(() => http.verify());

  it('searches the availability sending specialization and date as query parameters', () => {
    let result: unknown;
    service.searchAvailability(2, '2026-10-20').subscribe((value) => (result = value));

    const req = http.expectOne(
      (r) =>
        r.url === '/api/v1/schedule/availability' &&
        r.params.get('specializationId') === '2' &&
        r.params.get('date') === '2026-10-20',
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 10, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Verdi',
                 startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: false }]);

    expect((result as { id: number }[])[0].id).toBe(10);
  });

  it('creates a slot without a doctorId', () => {
    let result: unknown;

    service.createSlot({ startTime: '2026-10-20T09:30:00', durationMinutes: 30, }).subscribe((value) => (result = value));

    const request = http.expectOne('/api/v1/schedule/slot');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ startTime: '2026-10-20T09:30:00', durationMinutes: 30 });

    request.flush({ id: 11, doctorId: 1, doctorFirstName: 'Luca', doctorLastName: 'Neri', startTime: '2026-10-20T09:30:00', durationMinutes: 30, booked: false });

    expect((result as { id: number }).id).toBe(11);
  });
});