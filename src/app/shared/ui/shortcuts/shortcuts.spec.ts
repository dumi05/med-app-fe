import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ACCOUNT_ITEM, navItemsFor } from '../../layout/navigation';
import { Shortcuts } from './shortcuts';

@Component({
  imports: [Shortcuts],
  template: `<app-shortcuts role="DOCTOR" />`,
})
class HostComponent {}

describe('Shortcuts', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows the links of the menu of the role, except the Home and the page of the account', () => {
    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.shortcut'));
    const expected = navItemsFor('DOCTOR').filter((item) => item.path !== '/doctor' && item !== ACCOUNT_ITEM);

    expect(links.map((link) => link.getAttribute('href'))).toEqual(expected.map((item) => item.path));
    expect(links.map((link) => link.textContent!.trim())).toEqual(expected.map((item) => item.label));
    expect(links.length).toBeGreaterThan(0);
  });

  it('does not offer the change of the password: it is in the menu, not among the shortcuts of the home', () => {
    const hrefs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.shortcut')).map((a) => a.getAttribute('href'));

    expect(hrefs).not.toContain('/account/password');
  });

  it('does not offer a link to the Home', () => {
    const hrefs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.shortcut')).map((a) => a.getAttribute('href'));

    expect(hrefs).not.toContain('/doctor');
  });
});