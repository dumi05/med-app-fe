import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StatCard } from './stat-card';

@Component({
  imports: [StatCard],
  template: `
    <app-stat-card label="Ricavi" value="1.200,00 €" hint="da inizio anno" link="/admin/dashboard" linkLabel="Dettagli" />
    <app-stat-card label="Visite" [value]="0" />
  `,
})
class HostComponent {}

describe('StatCard', () => {
  let fixture: ComponentFixture<HostComponent>;

  const cards = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('app-stat-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('shows the name, the value, the hint and the link', () => {
    const card = cards()[0];

    expect(card.textContent).toContain('Ricavi');
    expect(card.querySelector('.stat-value')?.textContent).toBe('1.200,00 €');
    expect(card.querySelector('.stat-hint')?.textContent).toContain('da inizio anno');
    const link = card.querySelector('a.stat-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/admin/dashboard');
    expect(link.textContent).toContain('Dettagli');
  });

  it('shows a zero, and has no hint and no link when they are not given', () => {
    const card = cards()[1];

    expect(card.querySelector('.stat-value')?.textContent).toBe('0');
    expect(card.querySelector('.stat-hint')).toBeNull();
    expect(card.querySelector('a')).toBeNull();
  });
});