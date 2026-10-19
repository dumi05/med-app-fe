import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { PriceListService } from './price-list.service';

describe('PriceListService', () => {
    let service: PriceListService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()]});
        service = TestBed.inject(PriceListService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('gets the price list', () => {
        let result: unknown[] = [];

        service.getAll().subscribe((value) => (result = value));
        const req = http.expectOne('/api/v1/price-list');

        expect(req.request.method).toBe('GET');
        req.flush([{ id: 1, specializationId: 1, specializationName: 'Cardiologia-test', visitType: 'Visita specialistica', price: 100}]);

        expect(result.length).toBe(1);
    });

    it('updates a price sending only the new value', () => {
        let result: unknown;
        service.updatePrice(1, 120.5).subscribe((value) => (result = value));

        const req = http.expectOne('/api/v1/price-list/1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ price: 120.5 });
        req.flush({ id: 1, specializationId: 1, specializationName: 'Cardiologia-test', visitType: 'Visita specialistica', price: 120.5 });

        expect((result as { price: number }).price).toBe(120.5);
    })
})