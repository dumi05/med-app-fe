import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PatientAdmin } from './patient-admin.model';
import { PatientAdminService } from './patient-admin.service';

describe('PatientAdminService', () => {
  let http: HttpTestingController;
  let service: PatientAdminService;

  const PATIENT: PatientAdmin = {
    id: 3, firstName: 'Carla', lastName: 'Neri', email: 'carla@example.com',
    registeredAt: '2026-10-20T08:30:00Z', mustChangePassword: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PatientAdminService);
  });

  afterEach(() => http.verify());

  it('loads the registered patients', () => {
    let result: unknown;
    service.getAll().subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/patients');
    expect(req.request.method).toBe('GET');
    req.flush([PATIENT]);

    expect(result).toEqual([PATIENT]);
  });

  it('asks a patient to choose a new password, with no body', () => {
    let result: unknown;
    service.forcePasswordChange(3).subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/patients/3/force-password-change');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ ...PATIENT, mustChangePassword: true });

    expect(result).toEqual({ ...PATIENT, mustChangePassword: true });
  });
});