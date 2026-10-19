import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
    let service: DashboardService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()]});
        service = TestBed.inject(DashboardService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('gets the KPI from the dashboard endpoint', () => {
        let result: unknown;
        service.getKpi().subscribe((value) => (result = value));

        const req = http.expectOne('/api/v1/dashboard/kpi');
        expect(req.request.method).toBe('GET');
        req.flush({ totalAppointments: 3 });

        expect((result as { totalAppointments: number }).totalAppointments).toBe(3);
    })
})