import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateDoctorRequest } from './doctor.model';
import { DoctorService } from './doctor.service';

describe('DoctorService', () => {
  let http: HttpTestingController;
  let service: DoctorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DoctorService);
  });

  afterEach(() => http.verify());

  it('loads all doctors', () => {
    let result: unknown;
    service.getAllDoctors().subscribe((value) => (result = value));

    const request = http.expectOne('/api/v1/doctors');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, firstName: 'Luca', lastName: 'Verdi', specialization: 'Cardiologia' }]);

    expect(result).toEqual([{ id: 1, firstName: 'Luca', lastName: 'Verdi', specialization: 'Cardiologia' }]);
  });

  it('creates a doctor sending the request as body', () => {
    const request: CreateDoctorRequest = {
      email: 'luca@studio-medico.it', password: 'password123', firstName: 'Luca', lastName: 'Verdi',
      specializationId: 1, delegationConsent: true,
    };
    let result: unknown;
    service.createDoctor(request).subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/doctors');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 7, firstName: 'Luca', lastName: 'Verdi', email: 'luca@studio-medico.it',
                specialization: 'Cardiologia', delegationConsent: true });

    expect((result as { id: number }).id).toBe(7);
  });
});