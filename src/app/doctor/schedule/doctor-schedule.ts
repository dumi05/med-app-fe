import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../shared/ui/form-field/form-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';

@Component({
  selector: 'app-doctor-schedule',
  imports: [ReactiveFormsModule, FormField, AlertMessage, SubmitButton ],
  templateUrl: './doctor-schedule.html',
})
export class DoctorSchedule {

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    startTime: ['', [Validators.required]],
    durationMinutes: ['30', [Validators.required, Validators.min(1)]]
  });

  protected submit(): void {
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    const { startTime, durationMinutes } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.scheduleService.createSlot({ startTime: `${startTime}:00`, durationMinutes: Number(durationMinutes) }).subscribe({
      next: () => {
        this.success.set('Slot creato. I pazienti possono già prenotarlo.');
        this.form.controls.startTime.reset();
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.loading.set(false);
      }
    })
  }
}
