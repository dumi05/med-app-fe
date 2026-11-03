import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WorkingHoursService } from './working-hours.service';

describe('WorkingHoursService', () => {
  let http: HttpTestingController;
  let service: WorkingHoursService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WorkingHoursService);
  });

  afterEach(() => http.verify());

  it('reads the hours of the logged doctor without saying the doctor', () => {
    service.get().subscribe();

    const req = http.expectOne((r) => r.url === '/api/v1/schedule/working-hours' && !r.params.has('doctorId'));
    expect(req.request.method).toBe('GET');
    req.flush({ doctorId: null, bands: [], createdSlots: 0, removedSlots: 0 });
  });

  it('reads the hours of the doctor that the admin says', () => {
    service.get(7).subscribe();

    http.expectOne((r) => r.url === '/api/v1/schedule/working-hours' && r.params.get('doctorId') === '7')
      .flush({ doctorId: 7, bands: [], createdSlots: 0, removedSlots: 0 });
  });

  it('replaces the hours sending only the bands for a doctor', () => {
    const bands = [{ dayOfWeek: 'MONDAY' as const, startTime: '09:00', endTime: '13:00' }];
    service.replace(bands).subscribe();

    const req = http.expectOne('/api/v1/schedule/working-hours');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ bands });
    req.flush({ doctorId: 1, bands, createdSlots: 4, removedSlots: 0 });
  });

  it('sends the doctor too when the admin replaces the hours, and an empty list is a request like the others', () => {
    service.replace([], 7).subscribe();

    const req = http.expectOne('/api/v1/schedule/working-hours');
    expect(req.request.body).toEqual({ doctorId: 7, bands: [] });
    req.flush({ doctorId: 7, bands: [], createdSlots: 0, removedSlots: 12 });
  });
});