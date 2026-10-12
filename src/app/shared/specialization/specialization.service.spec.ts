import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SpecializationService } from './specialization.service';

describe('SpecializationService', () => {
  let http: HttpTestingController;
  let service: SpecializationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SpecializationService);
  });

  afterEach(() => http.verify());

  it('loads all specializations', () => {
    let result: unknown;
    service.getAllSpecializations().subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/specializations');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Cardiologia' }]);

    expect(result).toEqual([{ id: 1, name: 'Cardiologia' }]);
  });
});