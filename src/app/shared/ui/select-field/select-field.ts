import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  imports: [ReactiveFormsModule],
  templateUrl: './select-field.html'
})
export class SelectField {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly options = input.required<SelectOption[]>();
  readonly errorText = input('Valore non valido.');
}
