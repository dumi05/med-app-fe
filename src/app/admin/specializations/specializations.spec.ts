import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { Specializations } from './specializations';

describe('Specializations', () => {
  let fixture: ComponentFixture<Specializations>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => (element().textContent ?? '').replace(/\u00A0/g, ' ');
  const names = () => Array.from(element().querySelectorAll('.specialization-list li')).map((li) => li.textContent!.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Specializations],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Specializations);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/specializations').flush([{ id: 2, name: 'Dermatologia' }, { id: 1, name: 'Cardiologia' }]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const setValue = (id: string, value: string) => {
    const input = element().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = () => {
    fixture.detectChanges();
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  it('lists the specializations in alphabetical order', () => {
    expect(names()).toEqual(['Cardiologia', 'Dermatologia']);
  });

  it('sends the name and the price as a number, puts the new one in its alphabetical place and says it', () => {
    setValue('name', 'Allergologia');
    setValue('price', '120,50');
    submit();

    const req = http.expectOne('/api/v1/specializations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Allergologia', price: 120.5 });
    req.flush({ id: 3, name: 'Allergologia' });
    fixture.detectChanges();

    expect(names()).toEqual(['Allergologia', 'Cardiologia', 'Dermatologia']);
    expect(text()).toContain('Specializzazione «Allergologia» creata, con il prezzo di 120,50 €.');
    expect((element().querySelector('#name') as HTMLInputElement).value).toBe('');
  });

  it('removes the spaces around the name', () => {
    setValue('name', '  Oculistica  ');
    setValue('price', '90');
    submit();

    const req = http.expectOne('/api/v1/specializations');
    expect(req.request.body.name).toBe('Oculistica');
    req.flush({ id: 4, name: 'Oculistica' });
  });

  it('does not send a name that is empty, made of spaces, of one letter or of more than 80 letters', () => {
    for (const name of ['', '   ', ' x ', 'x'.repeat(81)]) {
      setValue('name', name);
      setValue('price', '90');
      submit();
      http.expectNone('/api/v1/specializations');
      expect(element().querySelector('#name')!.classList.contains('is-invalid')).withContext(`"${name}"`).toBeTrue();
    }
  });

  it('does not send a price that is missing, zero, negative, with three decimals, too big or not a number', () => {
    for (const price of ['', '0', '0,00', '-5', '10,123', '10000', 'abc']) {
      setValue('name', 'Urologia');
      setValue('price', price);
      submit();
      http.expectNone('/api/v1/specializations');
      expect(element().querySelector('#price')!.classList.contains('is-invalid')).withContext(`"${price}"`).toBeTrue();
    }
  });

  it('accepts the limits of the price: 0,01 and 9999,99', () => {
    for (const [index, price] of ['0,01', '9999.99'].entries()) {
      setValue('name', 'Urologia');
      setValue('price', price);
      submit();
      http.expectOne('/api/v1/specializations').flush({ id: 5 + index, name: 'Urologia' });
      fixture.detectChanges();
    }
  });

  it('says that the name exists already, and keeps what was typed', () => {
    setValue('name', 'CARDIOLOGIA');
    setValue('price', '90');
    submit();

    http.expectOne('/api/v1/specializations').flush(
      { code: 'SPECIALIZATION_ALREADY_EXISTS', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')?.textContent).toContain('Esiste già una specializzazione con questo nome.');
    expect((element().querySelector('#name') as HTMLInputElement).value).toBe('CARDIOLOGIA');
    expect(names().length).toBe(2);
  });

  it('says so when there is no specialization yet', () => {
    const empty = TestBed.createComponent(Specializations);
    empty.detectChanges();
    http.expectOne('/api/v1/specializations').flush([]);
    empty.detectChanges();

    expect((empty.nativeElement as HTMLElement).querySelector('.no-specializations')).not.toBeNull();
  });
});