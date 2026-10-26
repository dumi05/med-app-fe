import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/auth/auth.service';
import { errorInterceptor } from '../../shared/http/error.interceptor';
import { MyData } from './my-data';

const EXPORT = {
  profile: { id: 1, email: 'anna@example.com', firstName: 'Anna', lastName: 'Neri', birthDate: '1990-05-02',
             gdprConsent: true, gdprConsentVersion: 'v1.0', gdprConsentTimestamp: '2026-10-01T10:00:00Z' },
  appointments: [{ id: 1 }, { id: 2 }],
  reports: [{ id: 1 }],
};

describe('MyData', () => {
  let fixture: ComponentFixture<MyData>;
  let http: HttpTestingController;
  let router: Router;
  let auth: AuthService;

  const element = () => fixture.nativeElement as HTMLElement;
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const click = (selector: string) => {
    button(selector).click();
    fixture.detectChanges();
  };
  const tick = () => {
    const checkbox = element().querySelector('#understood') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MyData],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    spyOn(router, 'navigate');
    spyOn(auth, 'logout');
    fixture = TestBed.createComponent(MyData);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  // ---- export ---------------------------------------------------------------------------------

  describe('download', () => {
    let blobs: Blob[];
    let clicked: HTMLAnchorElement[];

    beforeEach(() => {
      blobs = [];
      clicked = [];
      spyOn(URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
        blobs.push(blob as Blob);
        return 'blob:test';
      });
      spyOn(URL, 'revokeObjectURL');
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        clicked.push(this);
      });
    });

    it('downloads the data of the patient as a JSON file and says what it contains', async () => {
      click('.export-button');
      http.expectOne('/api/v1/patients/me/export').flush(EXPORT);
      fixture.detectChanges();

      expect(clicked.length).toBe(1);
      expect(clicked[0].download).toMatch(/^dati-studio-medico-\d{4}-\d{2}-\d{2}\.json$/);
      expect(JSON.parse(await blobs[0].text())).toEqual(EXPORT);
      expect(element().querySelector('.alert-success')?.textContent).toContain('il tuo profilo, 2 visite e 1 referto.');
    });

    it('uses the singular for one visit', () => {
      click('.export-button');
      http.expectOne('/api/v1/patients/me/export').flush({ ...EXPORT, appointments: [{ id: 1 }], reports: [] });
      fixture.detectChanges();

      expect(element().querySelector('.alert-success')?.textContent).toContain('1 visita e 0 referti');
    });

    it('disables the button while the data is prepared', () => {
      click('.export-button');

      expect(button('.export-button').disabled).toBeTrue();

      http.expectOne('/api/v1/patients/me/export').flush(EXPORT);
      fixture.detectChanges();

      expect(button('.export-button').disabled).toBeFalse();
    });

    it('shows the Italian message and downloads nothing when the request fails', () => {
      click('.export-button');
      http.expectOne('/api/v1/patients/me/export').flush(
        { code: 'SERVER_ERROR', message: 'x', timestamp: 'x' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(element().querySelector('.alert-danger')?.textContent).toContain('errore imprevisto');
      expect(clicked.length).toBe(0);
    });
  });

  // ---- erasure --------------------------------------------------------------------------------

  it('explains what happens and what stays before asking anything', () => {
    const text = element().textContent;

    expect(text).toContain('vengono rimossi');
    expect(text).toContain('Cosa resta');
    expect(element().querySelector('.confirm-delete-button')).toBeNull();
  });

  it('asks for a confirmation, and the final button waits for the tick', () => {
    click('.delete-button');

    expect(button('.confirm-delete-button').disabled).toBeTrue();

    tick();

    expect(button('.confirm-delete-button').disabled).toBeFalse();
  });

  it('can be cancelled, and starts again without the tick', () => {
    click('.delete-button');
    tick();
    click('.cancel-delete-button');

    expect(element().querySelector('.confirm-delete-button')).toBeNull();

    click('.delete-button');

    expect(button('.confirm-delete-button').disabled).toBeTrue();
    http.expectNone('/api/v1/patients/me/anonymize');
  });

  it('deletes the account, ends the session and goes to the login with a message', () => {
    click('.delete-button');
    tick();
    click('.confirm-delete-button');

    const req = http.expectOne('/api/v1/patients/me/anonymize');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { deleted: '1' } });
  });

  it('keeps the session and shows the message when the deletion is refused', () => {
    click('.delete-button');
    tick();
    click('.confirm-delete-button');

    http.expectOne('/api/v1/patients/me/anonymize').flush(
      { code: 'INVALID_STATE_TRANSITION', message: 'x', timestamp: 'x' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(element().querySelector('.alert-danger')?.textContent).toContain('Operazione non consentita');
    expect(element().querySelector('.confirm-delete-button')).toBeNull();
  });

  it('links to the privacy notice, in a new tab', () => {
    const link = element().querySelector('a[href="/privacy-notice"]') as HTMLAnchorElement;

    expect(link).not.toBeNull();
    expect(link.target).toBe('_blank');
  });
});