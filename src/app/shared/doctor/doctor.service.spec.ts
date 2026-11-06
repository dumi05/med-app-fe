import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateDoctorRequest, UpdateDoctorRequest } from './doctor.model';
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

    it('loads every doctor with the administrative details', () => {
    let result: unknown;
    service.getAllDoctorsForAdmin().subscribe((value) => (result = value));

    const req = http.expectOne('/api/v1/doctors/admin');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, firstName: 'Luca', lastName: 'Verdi', email: 'luca@studio-medico.it',
                 specialization: 'Cardiologia', delegationConsent: true, active: false }]);

    expect((result as { active: boolean }[])[0].active).toBeFalse();
  });

  it('updates a doctor sending the new data', () => {
    const request: UpdateDoctorRequest = { firstName: 'Luigi', lastName: 'Verdi', specializationId: 2, delegationConsent: true };
    service.updateDoctor(7, request).subscribe();

    const req = http.expectOne('/api/v1/doctors/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('deactivates and reactivates a doctor with a POST on the action', () => {
    service.deactivateDoctor(7).subscribe();
    const deactivate = http.expectOne('/api/v1/doctors/7/deactivate');
    expect(deactivate.request.method).toBe('POST');
    deactivate.flush({});

    service.activateDoctor(7).subscribe();
    const activate = http.expectOne('/api/v1/doctors/7/activate');
    expect(activate.request.method).toBe('POST');
    activate.flush({});
  });
  it('loads the profile of the loaded doctor', () => {
    let result: unknown;
    service.getMe().subscribe((v) => (result = v));

    const req = http.expectOne('/api/v1/doctors/me');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, firstName: 'MArio', lastName: 'Rossi', specialization: 'Cardiologia'});

    expect((result as { id: number }).id).toBe(1);
  });

  it('asks a doctor to choose a new password, with no body', () => {
    let result: unknown;
    service.forcePasswordChange(4).subscribe((v) => (result = v));

    const req = http.expectOne('/api/v1/doctors/4/force-password-change');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ id: 4, mustChangePassword: true });

    expect((result as { mustChangePassword: boolean }).mustChangePassword).toBeTrue();
  });
});