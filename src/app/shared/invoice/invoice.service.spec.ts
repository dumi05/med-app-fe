import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InvoiceService } from './invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(InvoiceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registers the payment with a POST on the invoice of the visit', () => {
    let number = '';
    service.issue(7).subscribe((invoice) => (number = invoice.number));

    const request = http.expectOne('/api/v1/appointments/7/invoice');
    expect(request.request.method).toBe('POST');
    request.flush({ appointmentId: 7, number: 'FT-2026-00007', amount: 100, issuedAt: 'x', paidAt: 'x' });
    expect(number).toBe('FT-2026-00007');
  });

  it('downloads the PDF as a file, keeping the headers (the name of the file is there)', () => {
    const names: (string | null)[] = [];
    service.download(7).subscribe((response) => names.push(response.headers.get('Content-Disposition')));

    const request = http.expectOne('/api/v1/appointments/7/invoice/pdf');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['%PDF']), { headers: { 'Content-Disposition': 'attachment; filename="x.pdf"' } });
    expect(names).toEqual(['attachment; filename="x.pdf"']);
  });
});