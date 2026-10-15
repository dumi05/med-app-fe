import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { AlertMessage } from '../../../shared/ui/alert-message/alert-message';
import { AppointmentService } from '../../../shared/appointment/appointment.service';
import { Appointment, hasReport } from '../../../shared/appointment/appointment.model';
import { ApiError } from '../../../shared/http/api-error';
import { userMessage } from '../../../shared/http/error-messages';

@Component({
  selector: 'app-doctor-visits',
  imports: [DatePipe,RouterLink, StatusBadge, AlertMessage],
  templateUrl: './doctor-visits.html',
})
export class DoctorVisits implements OnInit{

  private readonly appointmentService = inject(AppointmentService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly completingId = signal<number | null>(null);
  protected readonly hasReport = hasReport;

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (app) => this.appointments.set(app),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  protected complete(app: Appointment): void {
    this.completingId.set(app.id);
    this.error.set(null);

    this.appointmentService.completeVisit(app.id).subscribe({
      next: (updated) => {
        this.appointments.update((appList) => appList?.map((a) => (a.id === updated.id ? updated : a)) ?? null);
        this.completingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.completingId.set(null);
      }
    })

  }

}
