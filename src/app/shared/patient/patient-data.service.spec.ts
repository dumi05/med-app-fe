import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { PatientDataService } from './patient-data.service';

describe('PatientDataService', () => {
    let service: PatientDataService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()]});
        service = TestBed.inject(PatientDataService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('loads all the data of the patient with a GET', () => {
        let result: unknown;
        service.exportMyData().subscribe((v) => (result = v));

        const req = http.expectOne('/api/v1/patients/me/export');
        expect(req.request.method).toBe('GET');
        req.flush({ profile: { id: 1 }, appointmentes: [], reports: [] });

        expect(result).toEqual({ profile: { id: 1 }, appointmentes: [], reports: [] });
    });

    it('anonymizes with a POST on the action, without a body, and completes on the empty answer', () => {
        let completed = false;
        service.anonymizeMe().subscribe({ complete: () => (completed = true)});

        const req = http.expectOne('/api/v1/patients/me/anonymize');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeNull();
        req.flush(null, { status: 204, statusText: 'No Content'});

        expect(completed).toBeTrue();
    });
});