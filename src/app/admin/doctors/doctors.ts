import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { SpecializationService } from '../../shared/specialization/specialization.service';
import { Doctor } from '../../shared/doctor/doctor.model';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { toSelectOptions } from '../../shared/specialization/specialization-options';

@Component({
  selector: 'app-doctors',
  imports: [ReactiveFormsModule, FormField, SelectField, AlertMessage, SubmitButton],
  templateUrl: './doctors.html'
})
export class Doctors implements OnInit {

  private readonly formBuilder = inject(NonNullableFormBuilder);
  
  // inject services
  private readonly doctorService = inject(DoctorService);
  private readonly specializationService = inject(SpecializationService);

  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly specializationOptions = signal<SelectOption[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    specializationId: ['', [Validators.required]],
    delegationConsent: [false]
  });

  ngOnInit(): void {
    this.doctorService.getAllDoctors().subscribe((doctors) => this.doctors.set(doctors));
    this.specializationService.getAllSpecializations().subscribe((specializations) => 
      this.specializationOptions.set(toSelectOptions(specializations)),
    );
  }

  protected submit(): void {
    if(this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { specializationId, ...rest } = this.form.getRawValue();

    this.loading.set(true);
    this.error.set(null);
    this.doctorService.createDoctor({ ...rest, specializationId: Number(specializationId)}).subscribe({
      next: (created) => {
        this.doctors.update((lst) => [ ...lst, created]);
        this.form.reset();
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.loading.set(false);
      }
    })
  }

}
