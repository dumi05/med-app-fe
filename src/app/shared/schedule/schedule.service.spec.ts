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

    it('reads the slots of the doctor in a range', () => {
    service.getMySlots('2026-11-01', '2026-11-30').subscribe();

    const req = http.expectOne((r) => r.url === '/api/v1/schedule/slots/me' && r.params.get('from') === '2026-11-01' && r.params.get('to') === '2026-11-30');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates many slots with a POST that carries the plan', () => {
    let result: unknown;
    const request = { date: '2026-11-02', startTime: '09:00', endTime: '11:00', slotMinutes: 30 };

    service.createSlots(request).subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/schedule/slots/bulk');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush([{ id: 1 }, { id: 2 }]);

    expect((result as unknown[]).length).toBe(2);
  });
});