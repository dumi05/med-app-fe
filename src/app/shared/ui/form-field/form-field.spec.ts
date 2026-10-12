import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FormField } from './form-field';

describe('FormField', () => {
  let fixture: ComponentFixture<FormField>;
  let control: FormControl<string>;

  const element = () => fixture.nativeElement as HTMLElement;
  const input = () => element().querySelector('input') as HTMLInputElement;

  beforeEach(async () => {
    control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    await TestBed.configureTestingModule({ imports: [FormField] }).compileComponents();
    fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('inputId', 'email');
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('errorText', 'Campo obbligatorio.');
    fixture.detectChanges();
  });

  it('shows the label linked to the input', () => {
    const label = element().querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Email');
    expect(label.htmlFor).toBe('email');
    expect(input().id).toBe('email');
  });

  it('writes what the user types into the form control', () => {
    input().value = 'anna@test.it';
    input().dispatchEvent(new Event('input'));
    expect(control.value).toBe('anna@test.it');
  });

  it('does not show the error before the field is touched', () => {
    expect(input().classList.contains('is-invalid')).toBeFalse();
  });

  it('shows the error when the field is touched and invalid', () => {
    control.markAsTouched();
    fixture.detectChanges();
    expect(input().classList.contains('is-invalid')).toBeTrue();
    expect(element().querySelector('.invalid-feedback')?.textContent).toContain('Campo obbligatorio.');
  });
});