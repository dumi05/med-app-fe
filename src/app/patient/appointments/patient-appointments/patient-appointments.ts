import { Component, inject, OnInit, signal } from '@angular/core';
import { StatusBadge, statusLabel } from '../../../shared/status-badge/status-badge';
import { AlertMessage } from '../../../shared/ui/alert-message/alert-message';
import { DatePipe } from '@angular/common';
import { AppointmentService } from '../../../shared/appointment/appointment.service';
import { Appointment, hasReport } from '../../../shared/appointment/appointment.model';
import { ApiError } from '../../../shared/http/api-error';
import { userMessage } from '../../../shared/http/error-messages';
import { RouterLink } from '@angular/router';
import { DataTable, DataTableColumn, DataTableRow } from '../../../shared/ui/data-table/data-table';
import { formatDateTime } from '../../../shared/format/format';

@Component({
  selector: 'app-patient-appointments',
  imports: [DatePipe, StatusBadge, AlertMessage, RouterLink, DataTable, DataTableRow],
  templateUrl: './patient-appointments.html'
})
export class PatientAppointments implements OnInit {
  
  private readonly appointmentService = inject(AppointmentService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cancellingId = signal<number | null>(null);
  protected readonly hasReport = hasReport;

  protected readonly columns: DataTableColumn<Appointment>[] = [
    { header: 'Data e ora', value: (app) => app.slot.startTime, text: (app) => formatDateTime(app.slot.startTime) },
    { header: 'Medico', value: (app) => `${app.slot.doctorLastName} ${app.slot.doctorFirstName}`, text: (app) => `${app.slot.doctorFirstName} ${app.slot.doctorLastName}` },
    { header: 'Durata', value: (app) => app.slot.durationMinutes },
    { header: 'Stato', value: (app) => statusLabel(app.status) },
    { header: '' },
  ];
  protected readonly rowKey = (app: Appointment) => app.id;

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (lst) => this.appointments.set(lst),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  protected cancel(appointment: Appointment): void {
    this.cancellingId.set(appointment.id);
    this.error.set(null);

    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: (updated) => {
        this.appointments.update((list) => list?.map((app) => (app.id === updated.id ? updated : app)) ?? null);
        this.cancellingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.cancellingId.set(null);
      }
    });
  }

}
