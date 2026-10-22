import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing"
import { TestBed } from "@angular/core/testing";
import { DoctorDelegationService } from './doctor-delegations.service';

describe('DoctorDelegationService', () => {
    let http: HttpTestingController;
    let service: DoctorDelegationService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()]});
        http = TestBed.inject(HttpTestingController);
        service = TestBed.inject(DoctorDelegationService);
    });

    afterEach(() => http.verify());

    it('proposes a delegation sending the request as body', () => {
        const request = { delegateDoctorId: 2, startDate: '2026-11-02', endDate: '2026-11-09'};
        service.propose(request).subscribe();

        const req = http.expectOne('/api/v1/doctor-delegations');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(request);
        req.flush({ id: 1, status: 'PROPOSED' });
    });
    it('accepts a delegation', () => {
        service.accept(7).subscribe();

        const req = http.expectOne('/api/v1/doctor-delegations/7/accept');
        expect(req.request.method).toBe('POST');
        req.flush({ id:7, status: 'ACCEPTED'});
    });
    it('rejects a delegation', () => {
        service.reject(7).subscribe();

        const req = http.expectOne('/api/v1/doctor-delegations/7/reject');
        expect(req.request.method).toBe('POST');
        req.flush({ id:7, status: 'REJECTED'});
    });
    it('loads the delegations where the doctor is involved', () => {
        let result: unknown;
        service.getMine().subscribe((v) => (result = v));

        const req = http.expectOne('/api/v1/doctor-delegations/me');
        expect(req.request.method).toBe('GET');
        req.flush([{ id: 1 }]);

        expect((result as unknown[]).length).toBe(1);
    })
})