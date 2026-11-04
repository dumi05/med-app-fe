import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NewsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the news that have not expired', () => {
    let result: unknown[] = [];
    service.getActive().subscribe((list) => (result = list));

    const request = http.expectOne('/api/v1/news');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1 }]);
    expect(result.length).toBe(1);
  });

  it('reads the news of the logged doctor from its own address', () => {
    service.getMine().subscribe();

    const request = http.expectOne('/api/v1/news/me');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates a notice sending title, text and the last day', () => {
    const body = { title: 'Chiuso', body: 'Lo studio resta chiuso.', expiresAt: '2026-12-24' };
    service.create(body).subscribe();

    const request = http.expectOne('/api/v1/news');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 5, ...body });
  });

  it('deletes a notice by its id', () => {
    service.delete(7).subscribe();

    const request = http.expectOne('/api/v1/news/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});