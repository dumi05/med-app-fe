import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LeaveService } from './leave.service';

describe('LeaveService', () => {
  let service: LeaveService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LeaveService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks the preview with the dates, the doctor and the colleague as a query', () => {
    service.preview({ doctorId: 3, startDate: '2026-11-10', endDate: '2026-11-14', replacementDoctorId: 5 }).subscribe();

    const request = http.expectOne((r) => r.url === '/api/v1/doctor-leaves/preview');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('doctorId')).toBe('3');
    expect(request.request.params.get('startDate')).toBe('2026-11-10');
    expect(request.request.params.get('endDate')).toBe('2026-11-14');
    expect(request.request.params.get('replacementDoctorId')).toBe('5');
    request.flush({});
  });

  it('leaves out the doctor and the colleague when there are none', () => {
    service.preview({ startDate: '2026-11-10', endDate: '2026-11-14' }).subscribe();

    const request = http.expectOne((r) => r.url === '/api/v1/doctor-leaves/preview');
    expect(request.request.params.has('doctorId')).toBeFalse();
    expect(request.request.params.has('replacementDoctorId')).toBeFalse();
    request.flush({});
  });

  it('registers the leave with a POST that carries the request', () => {
    const body = { startDate: '2026-11-10', endDate: '2026-11-14', replacementDoctorId: 5 };
    service.create(body).subscribe();

    const request = http.expectOne('/api/v1/doctor-leaves');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 1, reassigned: 2, cancelled: 0 });
  });

  it('reads the upcoming leaves of the logged doctor without saying who', () => {
    service.getUpcoming().subscribe();

    const request = http.expectOne('/api/v1/doctor-leaves');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('reads the upcoming leaves of the doctor that the admin chose', () => {
    service.getUpcoming(4).subscribe();

    http.expectOne('/api/v1/doctor-leaves?doctorId=4').flush([]);
  });

  it('cancels a leave with a DELETE on its id', () => {
    service.cancel(9).subscribe();

    const request = http.expectOne('/api/v1/doctor-leaves/9');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});