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
import { AppointmentService } from '../../shared/appointment/appointment.service';

@Component({
  selector: 'app-availability',
  imports: [ReactiveFormsModule, DatePipe, FormField, SelectField, AlertMessage, SubmitButton],
  templateUrl: './availability.html',
})
export class Availability implements OnInit {
  
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);
  private readonly specializationService = inject(SpecializationService);
  private readonly appointmentService = inject(AppointmentService);

  protected readonly specializationOptions = signal<SelectOption[]>([]);
  protected readonly slots = signal<Slot[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly bookingSlotId = signal<number | null>(null); 

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
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.loadSlots();
  }

  protected book(slot: Slot): void {
    this.bookingSlotId.set(slot.id);
    this.error.set(null);
    this.success.set(null);

    this.appointmentService.createAppointment(slot.id).subscribe({
      next: () => {
        this.success.set('Prenotazione confermata. La trovi in "Le mie prenotazioni"');
        this.bookingSlotId.set(null);
        this.loadSlots();
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.bookingSlotId.set(null);
        if(err.code === 'SLOT_NOT_AVAILABLE' || err.code === 'CONCURRENT_MODIFICATION'){
          this.loadSlots();
        }
      }
    })
  }

  private loadSlots(): void {
    const { specializationId, date } = this.form.getRawValue();
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
