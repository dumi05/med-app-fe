import { Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.html',
})
export class FormField {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input<'text' | 'email' | 'password' | 'date' | 'time' | 'datetime-local' | 'number' | 'textarea'>('text');
  readonly errorText = input('Valore non valido.');
  readonly autocomplete = input<string | null>(null);

  protected readonly passwordShown = signal(false);

  protected togglePassword(): void {
    this.passwordShown.update((shown) => !shown);
  }
}
