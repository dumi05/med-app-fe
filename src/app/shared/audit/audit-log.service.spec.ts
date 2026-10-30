import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuditLogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for the latest lines with the limit as a query parameter', () => {
    let result: unknown;
    service.getLatest(10).subscribe((value) => (result = value));

    const req = http.expectOne((r) => r.url === '/api/v1/audit-logs' && r.params.get('limit') === '10');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
  });
});