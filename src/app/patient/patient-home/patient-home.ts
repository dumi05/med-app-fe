import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { Shortcuts } from '../../shared/ui/shortcuts/shortcuts';
import { AppointmentService } from '../../shared/appointment/appointment.service';
import { Appointment, hasReport } from '../../shared/appointment/appointment.model';
import { formatDate, nowIso } from '../../shared/format/format';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { dayLabel } from '../../shared/calendar/calendar-grid';
import { dayOf, timeOf } from '../../shared/schedule/slot-time';
import { NewsCard } from '../../shared/news/news-card/news-card';

const LATEST_REPORTS = 3;

const byStart = (a: Appointment, b: Appointment) => a.slot.startTime.localeCompare(b.slot.startTime);

@Component({
  selector: 'app-patient-home',
  imports: [RouterLink,AlertMessage,Shortcuts,NewsCard],
  templateUrl: './patient-home.html',
  styleUrl: './patient-home.scss',
})
export class PatientHome implements OnInit{

  private readonly appointmentService = inject(AppointmentService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly nextVisit = computed(() => {
    const now = nowIso();
    return (this.appointments() ?? []) 
      .filter((app) => app.status === 'BOOKED' && app.slot.startTime > now)
      .sort(byStart)[0] ?? null;
  });

  protected readonly latestReports = computed(() => 
    (this.appointments() ?? [])
      .filter((app) => hasReport(app.status))
      .sort((a,b) => byStart(b,a))
      .slice(0, LATEST_REPORTS)
  );
  protected readonly formatDate = formatDate;

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (app) => this.appointments.set(app),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  protected when(appointment: Appointment): string {
    return `${dayLabel(dayOf(appointment.slot.startTime))} alle ${timeOf(appointment.slot.startTime)}`;
  }

}
