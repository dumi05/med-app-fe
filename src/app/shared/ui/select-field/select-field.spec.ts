import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { SelectField } from './select-field';

describe('SelectField', () => {
  let fixture: ComponentFixture<SelectField>;
  let control: FormControl<string>;

  const element = () => fixture.nativeElement as HTMLElement;
  const select = () => element().querySelector('select') as HTMLSelectElement;

  beforeEach(async () => {
    control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    await TestBed.configureTestingModule({ imports: [SelectField] }).compileComponents();
    fixture = TestBed.createComponent(SelectField);
    fixture.componentRef.setInput('inputId', 'specialization');
    fixture.componentRef.setInput('label', 'Specializzazione');
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('options', [
      { value: '1', label: 'Cardiologia' },
      { value: '2', label: 'Dermatologia' },
    ]);
    fixture.componentRef.setInput('errorText', 'Seleziona una specializzazione.');
    fixture.detectChanges();
  });

  it('shows the label linked to the select', () => {
    const label = element().querySelector('label') as HTMLLabelElement;
    expect(label.textContent).toContain('Specializzazione');
    expect(label.htmlFor).toBe('specialization');
    expect(select().id).toBe('specialization');
  });

  it('shows the placeholder plus one option per element', () => {
    expect(select().options.length).toBe(3);
    expect(select().options[1].textContent).toContain('Cardiologia');
  });

  it('writes the chosen value into the form control', () => {
    select().value = '2';
    select().dispatchEvent(new Event('change'));
    expect(control.value).toBe('2');
  });

  it('shows the error only when touched and invalid', () => {
    expect(select().classList.contains('is-invalid')).toBeFalse();
    control.markAsTouched();
    fixture.detectChanges();
    expect(select().classList.contains('is-invalid')).toBeTrue();
  });
});