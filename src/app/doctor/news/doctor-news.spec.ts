import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays } from '../../shared/calendar/calendar-grid';
import { todayIso } from '../../shared/format/format';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { DoctorNews } from './doctor-news';

const TODAY = todayIso();

const item = (id: number, title: string, expiresAt: string, automatic = false) => ({
  id, title, body: `Testo di ${title}`, authorFirstName: 'Mario', authorLastName: 'Rossi',
  createdAt: '2026-11-02T09:00:00', expiresAt, automatic,
});

describe('DoctorNews', () => {
  let fixture: ComponentFixture<DoctorNews>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const field = (id: string) => element().querySelector(`#${id}`) as HTMLInputElement;

  const fill = (id: string, value: string) => {
    const input = field(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const fillValid = () => {
    fill('title', '  Studio chiuso  ');
    fill('body', '  Il 24 dicembre lo studio resta chiuso.  ');
  };

  const click = (selector: string) => {
    (element().querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  const open = (mine: unknown[] = []) => {
    http.expectOne('/api/v1/news/me').flush(mine);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorNews],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DoctorNews);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  // ---- the list -------------------------------------------------------------------------------

  it('reads the notices of the doctor when the page opens, and shows them', () => {
    open([item(1, 'Chiusura', addDays(TODAY, 5))]);

    expect(element().querySelectorAll('.news-item').length).toBe(1);
    expect(element().textContent).toContain('Chiusura');
  });

  it('says that there are no notices yet', () => {
    open([]);

    expect(element().querySelector('.no-news')?.textContent).toContain('Non hai ancora scritto avvisi');
  });

  it('marks an expired notice, and not one that expires today', () => {
    open([item(1, 'Vecchio', addDays(TODAY, -1)), item(2, 'Di oggi', TODAY)]);

    const items = element().querySelectorAll('.news-item');
    expect(items[0].querySelector('.expired-badge')).not.toBeNull();
    expect(items[1].querySelector('.expired-badge')).toBeNull();
  });

  it('marks the automatic notices and does not let the doctor take them away', () => {
    open([item(1, 'Assenza', addDays(TODAY, 5), true), item(2, 'A mano', addDays(TODAY, 5))]);

    const items = element().querySelectorAll('.news-item');
    expect(items[0].querySelector('.automatic-badge')).not.toBeNull();
    expect(items[0].querySelector('.remove-button')).toBeNull();
    expect(items[0].textContent).toContain('annullando l\'assenza');
    expect(items[1].querySelector('.automatic-badge')).toBeNull();
    expect(items[1].querySelector('.remove-button')).not.toBeNull();
  });

  it('shows the message when the notices cannot be read', () => {
    http.expectOne('/api/v1/news/me').flush({ code: 'INTERNAL_ERROR' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
  });

  // ---- the new notice -------------------------------------------------------------------------

  it('proposes to keep the notice for two weeks', () => {
    open();

    expect(field('expiresAt').value).toBe(addDays(TODAY, 14));
  });

  it('publishes the notice without the spaces around title and text, and puts it first in the list', () => {
    open([item(1, 'Vecchio', addDays(TODAY, 3))]);
    fillValid();

    submit();
    const request = http.expectOne('/api/v1/news');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Studio chiuso',
      body: 'Il 24 dicembre lo studio resta chiuso.',
      expiresAt: addDays(TODAY, 14),
    });
    request.flush(item(2, 'Studio chiuso', addDays(TODAY, 14)));
    fixture.detectChanges();

    const titles = Array.from(element().querySelectorAll('.news-item .fw-semibold')).map((e) => e.textContent?.trim());
    expect(titles).toEqual(['Studio chiuso', 'Vecchio']);
    expect(element().querySelector('.alert-success')?.textContent).toContain('Avviso pubblicato');
  });

  it('empties the form after publishing, and goes back to two weeks', () => {
    open();
    fillValid();
    fill('expiresAt', addDays(TODAY, 30));

    submit();
    http.expectOne('/api/v1/news').flush(item(2, 'Studio chiuso', addDays(TODAY, 30)));
    fixture.detectChanges();

    expect(field('title').value).toBe('');
    expect(field('body').value).toBe('');
    expect(field('expiresAt').value).toBe(addDays(TODAY, 14));
    expect(element().querySelector('.body-counter')?.textContent).toContain('0 /');
  });

  it('sends nothing when the title is only spaces', () => {
    open();
    fill('title', '   ');
    fill('body', 'Testo');

    submit();

    http.expectNone('/api/v1/news');
    expect(field('title').classList).toContain('is-invalid');
  });

  it('sends nothing when the text is empty', () => {
    open();
    fill('title', 'Titolo');

    submit();

    http.expectNone('/api/v1/news');
    expect(field('body').classList).toContain('is-invalid');
  });

  it('accepts a title of 120 characters and refuses one of 121', () => {
    open();
    fill('body', 'Testo');

    fill('title', 'a'.repeat(121));
    submit();
    http.expectNone('/api/v1/news');

    fill('title', 'a'.repeat(120));
    submit();
    http.expectOne('/api/v1/news').flush(item(2, 'a', addDays(TODAY, 14)));
  });

  it('accepts a text of 2000 characters and refuses one of 2001', () => {
    open();
    fill('title', 'Titolo');

    fill('body', 'a'.repeat(2001));
    submit();
    http.expectNone('/api/v1/news');

    fill('body', 'a'.repeat(2000));
    submit();
    http.expectOne('/api/v1/news').flush(item(2, 'Titolo', addDays(TODAY, 14)));
  });

  it('counts the characters of the text while the doctor writes', () => {
    open();

    fill('body', 'Ciao a tutti');

    expect(element().querySelector('.body-counter')?.textContent).toContain('12 / 2000');
  });

  it('refuses an expiry in the past, accepts today and the last day of the year, and refuses the day after', () => {
    open();
    fillValid();

    fill('expiresAt', addDays(TODAY, -1));
    submit();
    http.expectNone('/api/v1/news');

    fill('expiresAt', addDays(TODAY, 366));
    submit();
    http.expectNone('/api/v1/news');

    fill('expiresAt', addDays(TODAY, 365));
    submit();
    http.expectOne('/api/v1/news').flush(item(2, 'Studio chiuso', addDays(TODAY, 365)));
    fixture.detectChanges();

    fillValid();
    fill('expiresAt', TODAY);
    submit();
    expect(http.expectOne('/api/v1/news').request.body.expiresAt).toBe(TODAY);
  });

  it('refuses a form without the expiry', () => {
    open();
    fillValid();

    fill('expiresAt', '');
    submit();

    http.expectNone('/api/v1/news');
    expect(field('expiresAt').classList).toContain('is-invalid');
  });

  it('shows the message of the server and keeps what was typed when the publishing is refused', () => {
    open();
    fillValid();

    submit();
    http.expectOne('/api/v1/news').flush({ code: 'INTERNAL_ERROR' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelector('.alert-danger')).not.toBeNull();
    expect(field('title').value).toBe('  Studio chiuso  ');
    expect(element().querySelectorAll('.news-item').length).toBe(0);
  });

  // ---- taking a notice away -------------------------------------------------------------------

  it('asks for a confirmation, and then takes the notice away', () => {
    open([item(1, 'Primo', addDays(TODAY, 3)), item(2, 'Secondo', addDays(TODAY, 3))]);

    click('.remove-button');
    http.expectNone('/api/v1/news/1');

    click('.confirm-remove-button');
    const request = http.expectOne('/api/v1/news/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    fixture.detectChanges();

    const titles = Array.from(element().querySelectorAll('.news-item .fw-semibold')).map((e) => e.textContent?.trim());
    expect(titles).toEqual(['Secondo']);
    expect(element().querySelector('.alert-success')?.textContent).toContain('Avviso tolto');
  });

  it('keeps the notice if the doctor changes their mind', () => {
    open([item(1, 'Primo', addDays(TODAY, 3))]);

    click('.remove-button');
    click('.cancel-remove-button');

    http.expectNone('/api/v1/news/1');
    expect(element().querySelectorAll('.news-item').length).toBe(1);
    expect(element().querySelector('.confirm-remove-button')).toBeNull();
  });

  it('keeps the notice and shows the message when the server refuses to take it away', () => {
    open([item(1, 'Primo', addDays(TODAY, 3))]);

    click('.remove-button');
    click('.confirm-remove-button');
    http.expectOne('/api/v1/news/1').flush({ code: 'INTERNAL_ERROR' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(element().querySelectorAll('.news-item').length).toBe(1);
    expect(element().querySelector('.alert-danger')).not.toBeNull();
  });
});