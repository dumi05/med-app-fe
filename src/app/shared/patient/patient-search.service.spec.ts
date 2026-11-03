import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PatientSearchService, searchIsLongEnough } from './patient-search.service';

describe('PatientSearchService', () => {
  let http: HttpTestingController;
  let service: PatientSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PatientSearchService);
  });

  afterEach(() => http.verify());

  it('sends the text as the query of the search, without the spaces around it', () => {
    let result: unknown;
    service.search('  rossi mario ').subscribe((value) => (result = value));

    const req = http.expectOne((r) => r.url === '/api/v1/patients/search' && r.params.get('query') === 'rossi mario');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, firstName: 'Mario', lastName: 'Rossi', email: 'm@r.it' }]);

    expect((result as { id: number }[])[0].id).toBe(1);
  });

  it('encodes what is typed, so that it cannot change the address', () => {
    service.search('a&b=c').subscribe();

    http.expectOne((r) => r.url === '/api/v1/patients/search' && r.params.get('query') === 'a&b=c').flush([]);
  });

  it('needs three letters, and the spaces do not count', () => {
    expect(searchIsLongEnough('ro')).toBeFalse();
    expect(searchIsLongEnough('  ro  ')).toBeFalse();
    expect(searchIsLongEnough('a b')).toBeFalse();
    expect(searchIsLongEnough('')).toBeFalse();
    expect(searchIsLongEnough('abc')).toBeTrue();
    expect(searchIsLongEnough('ab c')).toBeTrue();
  });
});