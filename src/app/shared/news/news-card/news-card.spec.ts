import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { errorInterceptor } from '../../http/error.interceptor';
import { NewsCard } from './news-card';

const TOKEN = 'h.eyJleHAiOjk5OTk5OTk5OTl9.s';

const item = (id: number, title: string, automatic = false) => ({
  id, title, body: `Testo di ${title}`, authorFirstName: 'Mario', authorLastName: 'Rossi',
  createdAt: '2026-11-02T09:00:00', expiresAt: '2026-11-20', automatic,
});

describe('NewsCard', () => {
  let fixture: ComponentFixture<NewsCard>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const create = (role: 'PATIENT' | 'ADMIN') => {
    localStorage.setItem('medapp.session', JSON.stringify({ token: TOKEN, email: 'x@x.it', role, mustChangePassword: false }));
    TestBed.configureTestingModule({
      imports: [NewsCard],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NewsCard);
    fixture.detectChanges();
  };

  const open = (role: 'PATIENT' | 'ADMIN', list: unknown[]) => {
    create(role);
    http.expectOne('/api/v1/news').flush(list);
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('shows title, text, author and the last day of each notice', () => {
    open('PATIENT', [item(1, 'Chiusura natalizia')]);

    const text = element().textContent ?? '';
    expect(text).toContain('Avvisi dallo studio');
    expect(text).toContain('Chiusura natalizia');
    expect(text).toContain('Testo di Chiusura natalizia');
    expect(text).toContain('Dott. Mario Rossi');
    expect(text).toContain('fino al 20/11/2026');
  });

  it('says that there is nothing when there are no notices', () => {
    open('PATIENT', []);

    expect(element().querySelector('.no-news')?.textContent).toContain('Nessun avviso al momento');
    expect(element().querySelectorAll('.news-item').length).toBe(0);
  });

  it('shows nothing, not even "no notices", while the notices are on their way', () => {
    create('PATIENT');

    expect(element().querySelector('.no-news')).toBeNull();
    expect(element().querySelectorAll('.news-item').length).toBe(0);
    http.expectOne('/api/v1/news').flush([]);
  });

  it('shows the message when the notices cannot be read', () => {
    create('PATIENT');
    http.expectOne('/api/v1/news').flush({ code: 'INTERNAL_ERROR' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.news-error')).not.toBeNull();
  });

  it('does not offer to take a notice away to a patient', () => {
    open('PATIENT', [item(1, 'Chiusura')]);

    expect(element().querySelector('.remove-button')).toBeNull();
  });

  it('offers the admin to take a notice away, but not an automatic one', () => {
    open('ADMIN', [item(1, 'Scritto a mano'), item(2, 'Assenza', true)]);

    const items = element().querySelectorAll('.news-item');
    expect(items[0].querySelector('.remove-button')).not.toBeNull();
    expect(items[1].querySelector('.remove-button')).toBeNull();
  });

  it('asks the admin to confirm, and then takes the notice away', () => {
    open('ADMIN', [item(1, 'Primo'), item(2, 'Secondo')]);

    click('.remove-button');
    http.expectNone('/api/v1/news/1');
    expect(element().querySelector('.confirm-remove-button')).not.toBeNull();

    click('.confirm-remove-button');
    const request = http.expectOne('/api/v1/news/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    const titles = Array.from(element().querySelectorAll('.news-item .fw-semibold')).map((e) => e.textContent?.trim());
    expect(titles).toEqual(['Secondo']);
  });

  it('keeps the notice if the admin changes their mind', () => {
    open('ADMIN', [item(1, 'Primo')]);

    click('.remove-button');
    click('.cancel-remove-button');

    http.expectNone('/api/v1/news/1');
    expect(element().querySelector('.remove-button')).not.toBeNull();
    expect(element().querySelectorAll('.news-item').length).toBe(1);
  });

  it('keeps the notice and shows the message when the server refuses to take it away', () => {
    open('ADMIN', [item(1, 'Primo')]);

    click('.remove-button');
    click('.confirm-remove-button');
    http.expectOne('/api/v1/news/1').flush({ code: 'INTERNAL_ERROR' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelectorAll('.news-item').length).toBe(1);
    expect(element().querySelector('.news-error')).not.toBeNull();
  });
});