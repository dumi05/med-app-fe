import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Shortcuts } from '../../shared/ui/shortcuts/shortcuts';
import { StatCard } from '../../shared/ui/stat-card/stat-card';
import { AppointmentService } from '../../shared/appointment/appointment.service';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { DoctorDelegationService } from '../../shared/delegation/doctor-delegations.service';
import { Appointment } from '../../shared/appointment/appointment.model';
import { Slot } from '../../shared/schedule/slot.model';
import { nowIso, todayIso } from '../../shared/format/format';
import { dayOf, timeOf } from '../../shared/schedule/slot-time';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { addDays } from '../../shared/calendar/calendar-grid';
import { forkJoin } from 'rxjs';
import { NewsCard } from '../../shared/news/news-card/news-card';

const AGENDA_DAYS = 7;

@Component({
  selector: 'app-doctor-home',
  imports: [RouterLink, Shortcuts, StatCard, NewsCard],
  templateUrl: './doctor-home.html',
  styleUrl: './doctor-home.scss',
})
export class DoctorHome implements OnInit{

  private readonly appointmentService = inject(AppointmentService);
  private readonly doctorService = inject(DoctorService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly delegationService = inject(DoctorDelegationService);

  protected readonly appointments = signal<Appointment[] | null>(null);
  protected readonly slots = signal<Slot[] | null>(null);
  protected readonly pendingDelegations = signal<number | null>(null);
  protected readonly errors = signal<string[]>([]);
  protected readonly toInvoice = computed(()=> (this.appointments() ?? []).filter((app) => app.status === 'COMPLETED').length);

  protected readonly todayVisits = computed(() => {
    const today = todayIso();
    return (this.appointments() ?? [])
      .filter((app) => app.status === 'BOOKED' && dayOf(app.slot.startTime) === today)
      .sort((a,b) => a.slot.startTime.localeCompare(b.slot.startTime));
  });

  protected readonly toComplete = computed(() => {
    const now = nowIso();
    return (this.appointments() ?? []).filter((app) => app.status === 'BOOKED' && app.slot.startTime <= now).length; 
  });

  protected readonly toReport = computed(() => (this.appointments() ?? []).filter((app) => app.status === 'INVOICED').length);

  protected readonly freeSlots = computed(() => {
    const now = nowIso();
    return (this.slots() ?? []).filter((slot) => !slot.booked && slot.startTime > now).length; 
  });

  protected readonly timeOf = timeOf;

  ngOnInit(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments) => this.appointments.set(appointments),
      error: (err: ApiError) => this.fail(err)
    });
    this.scheduleService.getMySlots(todayIso(), addDays(todayIso(), AGENDA_DAYS - 1)).subscribe({
      next: (slots) => this.slots.set(slots),
      error: (err: ApiError) => this.fail(err)
    });
    this.loadingPendingDelegations();
  }

  private loadingPendingDelegations(): void {
    forkJoin({ 
      me: this.doctorService.getMe(), 
      delegations: this.delegationService.getMine()}).subscribe({
        next: ({me, delegations}) => 
          this.pendingDelegations.set(delegations.filter((del) => del.status === 'PROPOSED' && del.delegateDoctorId === me.id).length),
        error: (err: ApiError) => this.fail(err)
      });
  }

  private fail(err: ApiError): void {
    const message = userMessage(err);
    this.errors.update((messages) => (messages.includes(message) ? messages : [...messages, message]));
  }
}
