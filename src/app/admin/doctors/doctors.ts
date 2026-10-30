import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { SpecializationService } from '../../shared/specialization/specialization.service';
import { DoctorAdmin } from '../../shared/doctor/doctor.model';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { toSelectOptions } from '../../shared/specialization/specialization-options';
import { DataTable, DataTableColumn, DataTableRow } from '../../shared/ui/data-table/data-table';

@Component({
  selector: 'app-doctors',
  imports: [ReactiveFormsModule, FormField, SelectField, AlertMessage, SubmitButton, DataTable, DataTableRow],
  templateUrl: './doctors.html'
})
export class Doctors implements OnInit {

  private readonly formBuilder = inject(NonNullableFormBuilder);
  
  // inject services
  private readonly doctorService = inject(DoctorService);
  private readonly specializationService = inject(SpecializationService);

  protected readonly doctors = signal<DoctorAdmin[]>([]);
  protected readonly specializationOptions = signal<SelectOption[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly showCreateForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly busyId = signal<number | null>(null);

  protected readonly columns: DataTableColumn<DoctorAdmin>[] = [
    { header: 'Cognome', value: (doctor) => doctor.lastName },
    { header: 'Nome', value: (doctor) => doctor.firstName },
    { header: 'Email', value: (doctor) => doctor.email },
    { header: 'Specializzazione', value: (doctor) => doctor.specialization },
    { header: 'Delega', value: (doctor) => (doctor.delegationConsent ? 'Si' : 'No') },
    { header: 'Stato', value: (doctor) => (doctor.active ? 'Attivo' : 'Disattivato') },
    { header: '' },
  ];

  protected readonly rowKey = (doctor: DoctorAdmin) => doctor.id;

  protected readonly createForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    specializationId: ['', [Validators.required]],
    delegationConsent: [false]
  });

  protected readonly editForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    specializationId: ['', [Validators.required]],
    delegationConsent: [false]
  });

  ngOnInit(): void {
    this.doctorService.getAllDoctorsForAdmin().subscribe((doctors) => this.doctors.set(doctors));
    this.specializationService.getAllSpecializations().subscribe((specializations) => 
      this.specializationOptions.set(toSelectOptions(specializations)),
    );
  }

  protected toggleCreateForm(): void {
    this.clearMessages();
    this.editingId.set(null);
    this.showCreateForm.update((open) => !open);
  }

  protected create(): void {
    if(this.createForm.invalid){
      this.createForm.markAllAsTouched();
      return;
    }

    const { specializationId, ...rest } = this.createForm.getRawValue();

    this.loading.set(true);
    this.clearMessages();
    this.doctorService.createDoctor({ ...rest, specializationId: Number(specializationId)}).subscribe({
      next: (created) => {
        this.doctors.update((lst) => [ ...lst, created]);
        this.createForm.reset();
        this.showCreateForm.set(false);
        this.success.set('Medico creato.');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.loading.set(false);
      }
    });
  }

  protected edit(doctor: DoctorAdmin): void {
    this.clearMessages();
    this.showCreateForm.set(false);
    this.confirmingId.set(null);
    
    const option = this.specializationOptions().find((item) => item.label === doctor.specialization);
    this.editForm.reset({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specializationId: option?.value ?? '',
      delegationConsent: doctor.delegationConsent
    });

    this.editingId.set(doctor.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected saveEdit(): void {
    const id = this.editingId();
    if(id === null) {
      return;
    }
    if(this.editForm.invalid){
      this.editForm.markAllAsTouched();
      return;
    }

    const { specializationId, ...rest} = this.editForm.getRawValue();

    this.loading.set(true);
    this.clearMessages();
    this.doctorService.updateDoctor(id, { ...rest, specializationId: Number(specializationId) }).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.editingId.set(null);
        this.success.set('Medico aggiornato.');
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.loading.set(false);
      }
    });
  }

  protected askDeactivate(doctor: DoctorAdmin): void {
    this.clearMessages();
    this.confirmingId.set(doctor.id);
  }

  protected cancelDeactivate(): void {
    this.confirmingId.set(null);
  }

  protected deactivate(doctor: DoctorAdmin): void {
    this.busyId.set(doctor.id);
    this.clearMessages();
    this.doctorService.deactivateDoctor(doctor.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.confirmingId.set(null);
        this.success.set('Medico disattivato.');
        this.busyId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(err.code === 'INVALID_STATE_TRANSITION'
          ? 'Il medico ha visite prenotate future: vanno gestite prima di disattivarlo.'
          : userMessage(err)
        );
        this.confirmingId.set(null);
        this.busyId.set(null);
      }
    });
  }

  protected activate(doctor: DoctorAdmin): void {
    this.busyId.set(doctor.id);
    this.clearMessages();
    this.doctorService.activateDoctor(doctor.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.success.set('Medico riattivato.');
        this.busyId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.busyId.set(null);
      }
    });
  }

  private replace(updated: DoctorAdmin): void {
    this.doctors.update((lst) => lst.map((doc) => doc.id === updated.id ? updated : doc));
  }

  private clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }

}
