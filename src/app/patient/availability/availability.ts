import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { SpecializationService } from '../../shared/specialization/specialization.service';
import { Slot } from '../../shared/schedule/slot.model';
import { toSelectOptions } from '../../shared/specialization/specialization-options';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';

@Component({
  selector: 'app-availability',
  imports: [ReactiveFormsModule, DatePipe, FormField, SelectField, AlertMessage, SubmitButton],
  templateUrl: './availability.html',
})
export class Availability implements OnInit {
  
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);
  private readonly specializationService = inject(SpecializationService);

  protected readonly specializationOptions = signal<SelectOption[]>([]);
  protected readonly slots = signal<Slot[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly form = this.formBuilder.group({
    specializationId: ['', [Validators.required]],
    date: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.specializationService.getAllSpecializations()
    .subscribe((spec) => 
      this.specializationOptions.set(toSelectOptions(spec))
    );
  }
  
  protected search(): void {
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    const { specializationId, date } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.scheduleService.searchAvailability(Number(specializationId), date).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.slots.set(null);
        this.loading.set(false);
        this.error.set(userMessage(err));
      }
    })
  }
}
