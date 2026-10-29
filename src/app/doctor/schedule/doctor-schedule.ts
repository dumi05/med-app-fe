import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField } from '../../shared/ui/form-field/form-field';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { RouterLink } from '@angular/router';
import { DaySummary, MonthCalendar } from '../../shared/ui/month-calendar/month-calendar';
import { todayIso } from '../../shared/format/format';
import { dayLabel, monthOf, monthRange, shiftMonth } from '../../shared/calendar/calendar-grid';
import { Slot } from '../../shared/schedule/slot.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { dayOf, timeRange } from '../../shared/schedule/slot-time';
import { planProblem, planSlots } from '../../shared/schedule/plan-slots';

@Component({
  selector: 'app-doctor-schedule',
  imports: [ReactiveFormsModule, RouterLink, MonthCalendar, FormField, AlertMessage, SubmitButton ],
  templateUrl: './doctor-schedule.html',
})
export class DoctorSchedule {

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);

  protected readonly month = signal(monthOf(todayIso()));
  protected readonly slots = signal<Slot[]>([]);
  protected readonly selectedDay = signal<string | null>(null);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly form = this.formBuilder.group({
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    slotMinutes: ['30', [Validators.required, Validators.min(1)]]
  });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue()});

  protected readonly summaries = computed(() => {
    const result: Record<string, DaySummary> = {};
    for(const slot of this.slots()) {
      const summary = (result[dayOf(slot.startTime)] ??= {free:0, booked:0});
      if(slot.booked) {
        summary.booked++;
      } else {
        summary.free++;
      }
    }
    return result;
  });

  protected readonly daySlots = computed(() => this.slots().filter((slot) => dayOf(slot.startTime) === this.selectedDay()));
  protected readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    return day === null ? '' : dayLabel(day);
  });

  protected readonly preview = computed(() => {
    const { startTime, endTime, slotMinutes } = this.formValue();
    return planSlots(startTime ?? '', endTime ?? '', Number(slotMinutes));
  });

  // be checks the same things
  protected readonly blocker = computed<string | null>(() => {
    const { date, startTime, endTime, slotMinutes } = this.formValue();
    if(date && date < todayIso()) {
      return 'La data non può essere nel passato.';
    }
    if(date === todayIso() && startTime && startTime <= this.nowTime()) {
      return "L'orario di inizio è già passato.";
    }
    return planProblem(startTime ?? '', endTime ?? '', Number(slotMinutes));
  });

  protected readonly previewText = computed (() => {
    const times = this.preview();
    const shown = times.slice(0,6).join(', ');
    return times.length > 6 ? `${shown}…` : shown;
  });

  protected readonly timeRange = timeRange;

  ngOnInit(): void {
    this.load();
  }

  protected changeMonth(delta: number): void {
    this.month.set(shiftMonth(this.month(), delta));
    this.selectedDay.set(null),
    this.load();
  }

  protected selectDay(day: string): void {
    this.selectedDay.set(day);
    if(day >= todayIso()) {
      this.form.controls.date.setValue(day);
    }
  }

  protected submit(): void {
    if(this.form.invalid || this.blocker() !== null) {
      this.form.markAllAsTouched();
      return;
    }

    const {date,startTime, endTime, slotMinutes} = this.form.getRawValue();
    
    this.loading.set(false);
    this.error.set(null);
    this.success.set(null);

    this.scheduleService.createSlots({date,startTime,endTime,slotMinutes: Number(slotMinutes)}).subscribe({
      next: (created) => {
        this.success.set(created.length === 1 ? 'Creato 1 slot.' : `Creati ${created.length} slot.`);
        this.form.reset({date, startTime: '', endTime: '', slotMinutes});
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
    const { from, to } = monthRange(this.month());
    this.scheduleService.getMySlots(from, to).subscribe({
      next: (slots) => this.slots.set(slots),
      error: (err: ApiError) => this.error.set(userMessage(err))
    });
  }

  private nowTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

}
