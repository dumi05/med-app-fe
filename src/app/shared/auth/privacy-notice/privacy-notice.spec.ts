import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GDPR_CONSENT_VERSION } from '../gdpr-consent';
import { PRIVACY_CONTROLLER, PrivacyNotice } from './privacy-notice';

describe('PrivacyNotice', () => {
  let fixture: ComponentFixture<PrivacyNotice>;

  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrivacyNotice] }).compileComponents();
    fixture = TestBed.createComponent(PrivacyNotice);
    fixture.detectChanges();
  });

  it('has the title of the notice', () => {
    expect(element().querySelector('h1')?.textContent).toContain('Informativa sul trattamento dei dati personali');
  });

  it('shows the version that the registration form asks the consent for', () => {
    expect(element().textContent).toContain(`Versione ${GDPR_CONSENT_VERSION}`);
  });

  it('has the eight sections, in order', () => {
    const headings = Array.from(element().querySelectorAll('h2')).map((h) => h.textContent!.trim());

    expect(headings.length).toBe(8);
    expect(headings[0]).toMatch(/^1\. Chi tratta i tuoi dati/);
    expect(headings[2]).toMatch(/^3\. Perché li trattiamo/);
    expect(headings[5]).toMatch(/^6\. I tuoi diritti/);
    expect(headings[7]).toMatch(/^8\. Il consenso/);
  });

  it('names the studio with its official name, and shows its logo', () => {
    expect(PRIVACY_CONTROLLER.name).toContain('Studio medico La Mole');
    expect((element().querySelector('img.page-logo') as HTMLImageElement).getAttribute('alt')).toContain('La Mole');
  });

  it('says who the controller is and how to reach them', () => {
    expect(element().textContent).toContain(PRIVACY_CONTROLLER.name);
    expect(element().textContent).toContain(PRIVACY_CONTROLLER.address);
    const mail = element().querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
    expect(mail.getAttribute('href')).toBe(`mailto:${PRIVACY_CONTROLLER.email}`);
  });

  it('explains what the erasure removes and what the law makes the clinic keep', () => {
    const text = element().textContent;

    expect(text).toContain('rimossi in modo irreversibile');
    expect(text).toContain('restano, senza più il collegamento ai tuoi dati identificativi');
  });

  it('is honest about the log of the accesses and about the risk indicator', () => {
    const text = element().textContent;

    expect(text).toContain('Registro degli accessi');
    expect(text).toContain('Nessuna decisione che ti riguarda è presa in modo automatico');
  });

  it('opens the external link without handing over the page', () => {
    const external = element().querySelector('a[href^="https://"]') as HTMLAnchorElement;

    expect(external.rel).toContain('noopener');
    expect(external.rel).toContain('noreferrer');
  });
});