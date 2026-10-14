import { Component, inject, OnInit, signal } from '@angular/core';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { AlertMessage } from '../../../shared/ui/alert-message/alert-message';
import { DatePipe } from '@angular/common';
import { AppointmentService } from '../../../shared/appointment/appointment.service';
import { Appointment } from '../../../shared/appointment/appointment.model';
import { ApiError } from '../../../shared/http/api-error';
import { userMessage } from '../../../shared/http/error-messages';

@Component({
  selector: 'app-patient-appointments',
  imports: [DatePipe, StatusBadge, AlertMessage],
  templateUrl: './patient-appointments.html'
})
export class PatientAppointments implements OnInit {
  
  private readonly appointmentService = inject(AppointmentService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cancellingId = signal<number | null>(null);

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
