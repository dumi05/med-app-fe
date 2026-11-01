import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordCheck } from '../../validation/password-checks';
import { PasswordRules } from './password-rules';

const CHECKS: PasswordCheck[] = [
  { id: 'length', label: 'Almeno 12 caratteri', ok: true },
  { id: 'personal', label: 'Non contiene la tua email', ok: false },
];

describe('PasswordRules', () => {
  let fixture: ComponentFixture<PasswordRules>;

  const element = () => fixture.nativeElement as HTMLElement;
  const items = () => Array.from(element().querySelectorAll('li'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PasswordRules] }).compileComponents();
    fixture = TestBed.createComponent(PasswordRules);
    fixture.componentRef.setInput('checks', CHECKS);
  });

  it('lists every rule', () => {
    fixture.detectChanges();

    expect(items().length).toBe(2);
    expect(items()[0].textContent).toContain('Almeno 12 caratteri');
    expect(items()[1].textContent).toContain('Non contiene la tua email');
  });

  it('only lists the rules, in grey, before the user types', () => {
    fixture.detectChanges();

    expect(items().every((li) => li.classList.contains('text-muted'))).toBeTrue();
    expect(items()[0].textContent).toContain('○');
    expect(element().querySelector('.text-danger')).toBeNull();
  });

  it('shows a green tick for the rules that are respected and a red cross for the others', () => {
    fixture.componentRef.setInput('started', true);
    fixture.detectChanges();

    expect(items()[0].classList.contains('text-success')).toBeTrue();
    expect(items()[0].textContent).toContain('✓');
    expect(items()[1].classList.contains('text-danger')).toBeTrue();
    expect(items()[1].textContent).toContain('✗');
  });

  it('says it in words too, for the screen readers', () => {
    fixture.componentRef.setInput('started', true);
    fixture.detectChanges();

    expect(items()[0].querySelector('.visually-hidden')!.textContent).toContain('rispettata');
    expect(items()[1].querySelector('.visually-hidden')!.textContent).toContain('non rispettata');
  });

  it('is announced politely when it changes', () => {
    fixture.detectChanges();

    expect(element().querySelector('ul')!.getAttribute('aria-live')).toBe('polite');
  });
});