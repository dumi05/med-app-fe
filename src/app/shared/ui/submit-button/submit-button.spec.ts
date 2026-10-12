import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubmitButton } from './submit-button';

describe('SubmitButton', () => {
  let fixture: ComponentFixture<SubmitButton>;
  const button = () => (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SubmitButton] }).compileComponents();
    fixture = TestBed.createComponent(SubmitButton);
    fixture.componentRef.setInput('label', 'Accedi');
    fixture.detectChanges();
  });

  it('is a submit button with the label', () => {
    expect(button().type).toBe('submit');
    expect(button().textContent).toContain('Accedi');
  });

  it('is enabled by default and disabled while loading', () => {
    expect(button().disabled).toBeFalse();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(button().disabled).toBeTrue();
  });
});