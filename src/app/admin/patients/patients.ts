import { Component, inject, OnInit, signal } from '@angular/core';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { ConfirmAction } from '../../shared/ui/confirm-action/confirm-action';
import { DataTable, DataTableColumn, DataTableRow } from '../../shared/ui/data-table/data-table';
import { PatientAdmin } from '../../shared/patient/patient-admin.model';
import { PatientAdminService } from '../../shared/patient/patient-admin.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { formatDate } from '../../shared/format/format';

@Component({
  selector: 'app-patients',
  imports: [AlertMessage, ConfirmAction, DataTable, DataTableRow],
  templateUrl: './patients.html'
})
export class Patients implements OnInit {

  private readonly patientService = inject(PatientAdminService);

  protected readonly patients = signal<PatientAdmin[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  protected readonly formatDate = formatDate;

  protected readonly columns: DataTableColumn<PatientAdmin>[] = [
    { header: 'Cognome', value: (patient) => patient.lastName },
    { header: 'Nome', value: (patient) => patient.firstName },
    { header: 'Email', value: (patient) => patient.email },
    { header: 'Registrato il', value: (patient) => patient.registeredAt, text: (patient) => formatDate(patient.registeredAt) },
    { header: 'Password', value: (patient) => (patient.mustChangePassword ? 'Cambio richiesto' : '') },
    { header: '' },
  ];

  protected readonly rowKey = (patient: PatientAdmin) => patient.id;

  ngOnInit(): void {
    this.patientService.getAll().subscribe({
      next: (patients) => this.patients.set(patients),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  protected forcePasswordChange(patient: PatientAdmin): void {
    this.busyId.set(patient.id);
    this.error.set(null);
    this.success.set(null);
    this.patientService.forcePasswordChange(patient.id).subscribe({
      next: (updated) => {
        this.patients.update((list) => list.map((item) => item.id === updated.id ? updated : item));
        this.success.set(`${updated.firstName} ${updated.lastName} dovrà scegliere una nuova password al prossimo accesso.`);
        this.busyId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.busyId.set(null);
      }
    });
  }
}