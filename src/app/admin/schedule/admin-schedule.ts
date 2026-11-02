import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { DaySummary, MonthCalendar } from '../../shared/ui/month-calendar/month-calendar';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { DoctorAdmin } from '../../shared/doctor/doctor.model';
import { Slot } from '../../shared/schedule/slot.model';
import { dayOf, timeRange } from '../../shared/schedule/slot-time';
import { planProblem, planSlots } from '../../shared/schedule/plan-slots';
import { dayLabel, monthOf, monthRange, shiftMonth } from '../../shared/calendar/calendar-grid';
import { todayIso } from '../../shared/format/format';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';

/**
 * The admin opens the agenda of a doctor: the free places of the month, and the form to create more (for example when
 * the doctor phones the studio). Only the free places are listed: the admin has no list of the booked ones.
 */
@Component({
  selector: 'app-admin-schedule',
  imports: [ReactiveFormsModule, MonthCalendar, SelectField, FormField, AlertMessage, SubmitButton],
  templateUrl: './admin-schedule.html',
})
export class AdminSchedule implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);
  private readonly doctorService = inject(DoctorService);

  protected readonly doctors = signal<DoctorAdmin[]>([]);
  protected readonly doctorControl = new FormControl('', { nonNullable: true });
  private readonly doctorValue = toSignal(this.doctorControl.valueChanges, { initialValue: '' });

  protected readonly month = signal(monthOf(todayIso()));
  protected readonly freeSlots = signal<Slot[]>([]);
  protected readonly selectedDay = signal<string | null>(null);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    slotMinutes: ['30', [Validators.required, Validators.min(1)]],
  });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** The active doctors only: a deactivated one has no agenda to fill. */
  protected readonly doctorOptions = computed<SelectOption[]>(() =>
    this.doctors().filter((doctor) => doctor.active).map((doctor) => ({
      value: String(doctor.id),
      label: `${doctor.lastName} ${doctor.firstName} (${doctor.specialization})`,
    })));
  protected readonly doctor = computed(() => this.doctors().find((candidate) => String(candidate.id) === this.doctorValue()) ?? null);

  protected readonly summaries = computed(() => {
    const result: Record<string, DaySummary> = {};
    for (const slot of this.freeSlots()) {
      (result[dayOf(slot.startTime)] ??= { free: 0, booked: 0 }).free++;
    }
    return result;
  });
  protected readonly daySlots = computed(() => this.freeSlots().filter((slot) => dayOf(slot.startTime) === this.selectedDay()));
  protected readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    return day === null ? '' : dayLabel(day);
  });

  protected readonly preview = computed(() => {
    const { startTime, endTime, slotMinutes } = this.formValue();
    return planSlots(startTime ?? '', endTime ?? '', Number(slotMinutes));
  });
  protected readonly previewText = computed(() => {
    const times = this.preview();
    const shown = times.slice(0, 6).join(', ');
    return times.length > 6 ? `${shown}…` : shown;
  });
  // the backend checks the same things
  protected readonly blocker = computed<string | null>(() => {
    const { date, startTime, endTime, slotMinutes } = this.formValue();
    if (date && date < todayIso()) {
      return 'La data non può essere nel passato.';
    }
    if (date === todayIso() && startTime && startTime <= this.nowTime()) {
      return "L'orario di inizio è già passato.";
    }
    return planProblem(startTime ?? '', endTime ?? '', Number(slotMinutes));
  });

  protected readonly timeRange = timeRange;

  ngOnInit(): void {
    this.doctorService.getAllDoctorsForAdmin().subscribe({
      next: (list) => this.doctors.set(list),
      error: (err: ApiError) => this.error.set(userMessage(err)),
    });
    this.doctorControl.valueChanges.subscribe(() => {
      this.selectedDay.set(null);
      this.success.set(null);
      this.error.set(null);
      this.load();
    });
  }

  protected changeMonth(delta: number): void {
    this.month.set(shiftMonth(this.month(), delta));
    this.selectedDay.set(null);
    this.load();
  }

  protected selectDay(day: string): void {
    this.selectedDay.set(day);
    if (day >= todayIso()) {
      this.form.controls.date.setValue(day);
    }
  }

  protected submit(): void {
    const doctor = this.doctor();
    if (doctor === null || this.form.invalid || this.blocker() !== null) {
      this.form.markAllAsTouched();
      return;
    }
    const { date, startTime, endTime, slotMinutes } = this.form.getRawValue();

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.scheduleService.createSlots({ doctorId: doctor.id, date, startTime, endTime, slotMinutes: Number(slotMinutes) }).subscribe({
      next: (created) => {
        this.success.set(created.length === 1 ? 'Creato 1 slot.' : `Creati ${created.length} slot.`);
        this.form.reset({ date, startTime: '', endTime: '', slotMinutes });
        this.month.set(monthOf(date));
        this.selectedDay.set(date);
        this.loading.set(false);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.loading.set(false);
      },
    });
  }

  private load(): void {
    const doctor = this.doctor();
    if (doctor === null) {
      this.freeSlots.set([]);
      return;
    }
    const { from, to } = monthRange(this.month());
    this.scheduleService.searchAvailability({ specializationId: doctor.specializationId, doctorId: doctor.id, from, to }).subscribe({
      next: (slots) => this.freeSlots.set(slots),
      error: (err: ApiError) => this.error.set(userMessage(err)),
    });
  }

  private nowTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}