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
        const request = { delegateName: 'Luigi Neri', delegateEmail: 'luigi@example.com', expiresAt: null, includeAttachments: true };
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
    it('sends the code typed by the caregiver, with the token of the delegation in the path', () => {
        let result: unknown;
        service.unlock('abcd-123', 'K7MQ-4XPD').subscribe((value) => (result = value));

        const req = http.expectOne('/api/v1/report-delegations/abcd-123/access');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ code: 'K7MQ-4XPD' });
        req.flush({ accessToken: 'jwt', expiresInSeconds: 900 });

        expect(result).toEqual({ accessToken: 'jwt', expiresInSeconds: 900 });
    });
    it('encodes the token of the unlock, too', () => {
        service.unlock('a/b?c', 'K7MQ-4XPD').subscribe();
        http.expectOne('/api/v1/report-delegations/a%2Fb%3Fc/access').flush({});
    });
    it('reads the shared reports with the token in the path and the access token in the header', () => {
        service.getSharedReports('abcd-123', 'jwt').subscribe();

        const req = http.expectOne('/api/v1/report-delegations/abcd-123/medical-reports');
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('X-Delegation-Access')).toBe('jwt');
        req.flush([]);
    });
    it('encodes the token, so that it can never change the path', () => {
        service.getSharedReports('a/b?c', 'jwt').subscribe();
        http.expectOne('/api/v1/report-delegations/a%2Fb%3Fc/medical-reports').flush([]);
    });
    it('downloads a shared attachment with the token and the report in the path and the access token in the header', () => {
        let type = '';
        service.downloadSharedAttachment('abcd-123', 7, 'jwt').subscribe((response) => (type = response.body!.type));

        const req = http.expectOne('/api/v1/report-delegations/abcd-123/medical-reports/7/attachment');
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        expect(req.request.headers.get('X-Delegation-Access')).toBe('jwt');
        req.flush(new Blob(['%PDF-1.4'], { type: 'application/pdf' }));

        expect(type).toBe('application/pdf');
    });
    it('encodes the token of a download, too', () => {
        service.downloadSharedAttachment('a/b?c', 7, 'jwt').subscribe();
        http.expectOne('/api/v1/report-delegations/a%2Fb%3Fc/medical-reports/7/attachment').flush(new Blob(['x']));
    });
});