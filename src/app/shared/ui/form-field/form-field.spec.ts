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

  it('uses the requested input types', () => {
    fixture.componentRef.setInput('type', 'datetime-local');
    fixture.detectChanges();
    expect(input().type).toBe('datetime-local');
  });

  it('has no autocomplete attribute unless one is given', () => {
    expect(input().hasAttribute('autocomplete')).toBeFalse();
  });

  it('passes the autocomplete hint to the input', () => {
    fixture.componentRef.setInput('autocomplete', 'new-password');
    fixture.detectChanges();

    expect(input().getAttribute('autocomplete')).toBe('new-password');
  });

  describe('the eye of the password fields', () => {
    const eye = () => element().querySelector('button.show-password') as HTMLButtonElement | null;

    beforeEach(() => {
        fixture.componentRef.setInput('type', 'password');
        fixture.detectChanges();
    });

    it('hides the text at first, and the button offers to show it', () => {
        expect(input().type).toBe('password');
        expect(eye()!.getAttribute('aria-label')).toBe('Mostra password');
        expect(eye()!.getAttribute('aria-pressed')).toBe('false');
    });

    it('shows the text when the button is pressed, and hides it again at the second press', () => {
        eye()!.click();
        fixture.detectChanges();

        expect(input().type).toBe('text');
        expect(eye()!.getAttribute('aria-label')).toBe('Nascondi password');
        expect(eye()!.getAttribute('aria-pressed')).toBe('true');

        eye()!.click();
        fixture.detectChanges();

        expect(input().type).toBe('password');
        expect(eye()!.getAttribute('aria-pressed')).toBe('false');
    });

    it('keeps what was typed when the text is shown or hidden', () => {
        input().value = 'Tavolo-Viola-Nuvola-42';
        input().dispatchEvent(new Event('input'));

        eye()!.click();
        fixture.detectChanges();

        expect(control.value).toBe('Tavolo-Viola-Nuvola-42');
        expect(input().value).toBe('Tavolo-Viola-Nuvola-42');
    });

    it('is a button that does not send the form', () => {
        expect(eye()!.getAttribute('type')).toBe('button');
    });

    it('still shows the error of the field under the input', () => {
        control.markAsTouched();
        fixture.detectChanges();

        expect(input().classList.contains('is-invalid')).toBeTrue();
        expect(element().querySelector('.invalid-feedback')?.textContent).toContain('Campo obbligatorio.');
    });

    it('is only for the password fields', () => {
        for (const type of ['text', 'email', 'textarea'] as const) {
          fixture.componentRef.setInput('type', type);
          fixture.detectChanges();

          expect(eye()).withContext(type).toBeNull();
        }
      });
    });

  it('shows a textarea then type is textarea', () => {
    fixture.componentRef.setInput('type', 'textarea');
    fixture.detectChanges();

    const textarea = element().querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(element().querySelector('input')).toBeNull();

    textarea.value = 'Testo lungo';
    textarea.dispatchEvent(new Event('input'));
    expect(control.value).toBe('Testo lungo');
  })
});