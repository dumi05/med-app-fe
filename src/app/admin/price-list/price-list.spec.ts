import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { PriceList } from './price-list';

describe('PriceList', () => {
  let fixture: ComponentFixture<PriceList>;
  let http: HttpTestingController;

  const ENTRIES = [
    { id: 1, specializationId: 1, specializationName: 'Cardiologia', visitType: 'Visita specialistica', price: 100 },
    { id: 2, specializationId: 2, specializationName: 'Dermatologia', visitType: 'Visita specialistica', price: 80 },
  ];

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => (element().textContent ?? '').replace(/ /g, ' ');
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const priceInput = () => element().querySelector('input.price-input') as HTMLInputElement | null;

  const typePrice = (value: string) => {
    const input = priceInput()!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceList],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(PriceList);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/price-list').flush(ENTRIES);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('lists the entries with their price', () => {
    expect(element().querySelectorAll('tbody tr').length).toBe(2);
    expect(text()).toContain('Cardiologia');
    expect(text()).toContain('100,00 €');
    expect(text()).toContain('80,00 €');
  });

  it('opens one row for editing, showing the current price', () => {
    button('.edit-button').click();
    fixture.detectChanges();

    expect(priceInput()!.value).toBe('100');
    expect(element().querySelectorAll('input.price-input').length).toBe(1);
  });

  it('saves the new price and shows it in the row', () => {
    button('.edit-button').click();
    fixture.detectChanges();
    typePrice('120,5');
    button('.save-button').click();

    const req = http.expectOne('/api/v1/price-list/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ price: 120.5 });
    req.flush({ ...ENTRIES[0], price: 120.5 });
    fixture.detectChanges();

    expect(text()).toContain('120,50 €');
    expect(priceInput()).toBeNull();
    expect(element().querySelector('.alert-success')?.textContent).toContain('Prezzo aggiornato');
  });

  it('does not send a price that is not positive', () => {
    button('.edit-button').click();
    fixture.detectChanges();
    typePrice('0');
    button('.save-button').click();
    fixture.detectChanges();

    http.expectNone('/api/v1/price-list/1');
    expect(priceInput()!.classList.contains('is-invalid')).toBeTrue();
  });

  it('does not send a price with more than two decimals', () => {
    button('.edit-button').click();
    fixture.detectChanges();
    typePrice('10.123');
    button('.save-button').click();
    fixture.detectChanges();

    http.expectNone('/api/v1/price-list/1');
    expect(priceInput()!.classList.contains('is-invalid')).toBeTrue();
  });

  it('keeps the row in edit mode and shows the message when the backend refuses', () => {
    button('.edit-button').click();
    fixture.detectChanges();
    typePrice('50');
    button('.save-button').click();

    http.expectOne('/api/v1/price-list/1').flush(
      { code: 'VALIDATION_FAILED', message: 'price: invalid', timestamp: 'x' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(priceInput()).not.toBeNull();
    expect(element().querySelector('.alert-danger')?.textContent).toContain('Controlla i campi');
  });

  it('closes the edit mode without sending anything on cancel', () => {
    button('.edit-button').click();
    fixture.detectChanges();
    button('.cancel-button').click();
    fixture.detectChanges();

    expect(priceInput()).toBeNull();
  });
});