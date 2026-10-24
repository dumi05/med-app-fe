import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ReportDelegationService } from './report-delegation.service';

describe('ReportDelegationService', () => {
    let service: ReportDelegationService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()]});
        service =TestBed.inject(ReportDelegationService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('creates a delegation with a POST that carries the body', () => {
        const request = { delegateName: 'Luigi Neri', delegateEmail: 'luigi@example.com', expiresAt: null };
        service.create(request).subscribe();

        const req = http.expectOne('/api/v1/report-delegations');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(request);

        req.flush({});
    });
    it('loads the delegations of the patient', () => {
        let result: unknown;
        service.getMine().subscribe((v) => (result = v));

        const req = http.expectOne('/api/v1/report-delegations/me');
        expect(req.request.method).toBe('GET');
        req.flush([{ id: 1 }]);

        expect(result).toEqual([{ id: 1 }]);
    });

    it('revokes with a POST on the action, without a body', () => {
        service.revoke(4).subscribe();

        const req = http.expectOne('/api/v1/report-delegations/4/revoke');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBeNull();
        req.flush({});
    });
    it('reads the shared reports with the token in the path', () => {
        service.getSharedReports('abcd-123').subscribe();

        const req = http.expectOne('/api/v1/report-delegations/abcd-123/medical-reports');
        expect(req.request.method).toBe('GET');
        req.flush([]);
    });
    it('encodes the token, so that it can never change the path', () => {
        service.getSharedReports('a/b?c').subscribe();
        http.expectOne('/api/v1/report-delegations/a%2Fb%3Fc/medical-reports').flush([]);
    });
});