import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { addDays, dayLabel, monthOf, monthRange, shiftMonth, shortDayLabel } from '../../shared/calendar/calendar-grid';
import { AppointmentService } from '../../shared/appointment/appointment.service';
import { Appointment } from '../../shared/appointment/appointment.model';
import { Doctor } from '../../shared/doctor/doctor.model';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { todayIso } from '../../shared/format/format';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { ScheduleService } from '../../shared/schedule/schedule.service';
import { Slot } from '../../shared/schedule/slot.model';
import { dayOf, slotsOverlap, timeOf } from '../../shared/schedule/slot-time';
import { SpecializationService } from '../../shared/specialization/specialization.service';
import { toSelectOptions } from '../../shared/specialization/specialization-options';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { DaySummary, MonthCalendar } from '../../shared/ui/month-calendar/month-calendar';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';

type View = 'list' | 'calendar';

const ANY_DOCTOR = '0';
const LIST_DAYS = 30;
const PAGE_SIZE = 10;
const STALE_CODES = ['SLOT_NOT_AVAILABLE', 'CONCURRENT_MODIFICATION', 'APPOINTMENT_OVERLAP'];

@Component({
  selector: 'app-availability',
  imports: [ReactiveFormsModule, SelectField, MonthCalendar, AlertMessage],
  templateUrl: './availability.html',
})
export class Availability implements OnInit {

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly scheduleService = inject(ScheduleService);
  private readonly specializationService = inject(SpecializationService);
  private readonly doctorService = inject(DoctorService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly today = todayIso();
  protected readonly specializationOptions = signal<SelectOption[]>([]);
  private readonly doctors = signal<Doctor[]>([]);
  private readonly myAppointments = signal<Appointment[]>([]);

  protected readonly view = signal<View>('list');
  protected readonly month = signal(monthOf(todayIso()));
  protected readonly selectedDay = signal<string | null>(null);
  protected readonly visibleCount = signal(PAGE_SIZE);

  private readonly slots = signal<Slot[] | null>(null);
  protected readonly pendingSlot = signal<Slot | null>(null);
  protected readonly loading = signal(false);
  protected readonly booking = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  private searchId = 0;

  protected readonly form = this.formBuilder.group({
    specializationId: ['', [Validators.required]],
    doctorId: [ANY_DOCTOR],
  });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly doctorOptions = computed<SelectOption[]>(() => {
    const specializationId = this.formValue().specializationId ?? '';
    const ofSpecialization = this.doctors()
      .filter((doctor) => String(doctor.specializationId) === specializationId)
      .map((doctor) => ({ value: String(doctor.id), label: `${doctor.firstName} ${doctor.lastName}` }));
    return [{ value: ANY_DOCTOR, label: 'Qualsiasi medico' }, ...ofSpecialization];
  });

  protected readonly hasSpecialization = computed(() => (this.formValue().specializationId ?? '') !== '');

  protected readonly bookable = computed(() => {
    const mine = this.myAppointments().filter((appointment) => appointment.status === 'BOOKED').map((appointment) => appointment.slot);
    return (this.slots() ?? []).filter((slot) => !mine.some((booked) => slotsOverlap(booked, slot)));
  });
  protected readonly hiddenCount = computed(() => (this.slots()?.length ?? 0) - this.bookable().length);

  protected readonly listSlots = computed(() => this.bookable().slice(0, this.visibleCount()));
  protected readonly hasMore = computed(() => this.bookable().length > this.visibleCount());

  protected readonly summaries = computed(() => {
    const result: Record<string, DaySummary> = {};
    for (const slot of this.bookable()) {
      (result[dayOf(slot.startTime)] ??= { free: 0, booked: 0 }).free++;
    }
    return result;
  });

  protected readonly dayGroups = computed(() => {
    const groups = new Map<number, { name: string; slots: Slot[] }>();
    for (const slot of this.bookable().filter((s) => dayOf(s.startTime) === this.selectedDay())) {
      const group = groups.get(slot.doctorId) ?? { name: `${slot.doctorFirstName} ${slot.doctorLastName}`, slots: [] };
      group.slots.push(slot);
      groups.set(slot.doctorId, group);
    }
    return Array.from(groups.values());
  });

  protected readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();
    return day === null ? '' : dayLabel(day);
  });

  protected readonly shortDayLabel = shortDayLabel;
  protected readonly dayOf = dayOf;
  protected readonly timeOf = timeOf;

  constructor() {
    this.form.controls.specializationId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.controls.doctorId.setValue(ANY_DOCTOR, { emitEvent: false });
      this.restart();
    });
    this.form.controls.doctorId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.restart());
  }

  ngOnInit(): void {
    this.specializationService.getAllSpecializations().subscribe((specializations) =>
      this.specializationOptions.set(toSelectOptions(specializations)));
    this.doctorService.getAllDoctors().subscribe((doctors) => this.doctors.set(doctors));
    this.loadMyAppointments();
  }

  protected setView(view: View): void {
    this.view.set(view);
    this.month.set(monthOf(this.today));
    this.restart();
  }

  protected changeMonth(delta: number): void {
    this.month.set(shiftMonth(this.month(), delta));
    this.selectedDay.set(null);
    this.search();
  }

  protected selectDay(day: string): void {
    this.selectedDay.set(day);
    this.pendingSlot.set(null);
  }

  protected showMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  protected askBooking(slot: Slot): void {
    this.error.set(null);
    this.success.set(null);
    this.pendingSlot.set(slot);
  }

  protected cancelBooking(): void {
    this.pendingSlot.set(null);
  }

  protected when(slot: Slot): string {
    return `${dayLabel(dayOf(slot.startTime))} alle ${timeOf(slot.startTime)}`;
  }

  protected confirmBooking(): void {
    const slot = this.pendingSlot();
    if (slot === null) {
      return;
    }
    this.booking.set(true);
    this.error.set(null);
    this.success.set(null);

    this.appointmentService.createAppointment(slot.id).subscribe({
      next: () => {
        this.success.set('Prenotazione confermata. La trovi in "Le mie prenotazioni".');
        this.pendingSlot.set(null);
        this.booking.set(false);
        this.loadMyAppointments();
        this.search();
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.pendingSlot.set(null);
        this.booking.set(false);
        if (STALE_CODES.includes(err.code)) {
          this.loadMyAppointments();
          this.search();
        }
      },
    });
  }

  private restart(): void {
    this.selectedDay.set(null);
    this.pendingSlot.set(null);
    this.visibleCount.set(PAGE_SIZE);
    this.search();
  }

  private search(): void {
    const { specializationId, doctorId } = this.form.getRawValue();
    if (specializationId === '') {
      this.slots.set(null);
      return;
    }
    const range = this.view() === 'list'
      ? { from: this.today, to: addDays(this.today, LIST_DAYS - 1) }
      : monthRange(this.month());

    const id = ++this.searchId;
    this.loading.set(true);
    this.scheduleService.searchAvailability({
      specializationId: Number(specializationId),
      doctorId: doctorId === ANY_DOCTOR ? undefined : Number(doctorId),
      ...range,
    }).subscribe({
      next: (slots) => {
        if (id === this.searchId) {
          this.slots.set(slots);
          this.loading.set(false);
        }
      },
      error: (err: ApiError) => {
        if (id === this.searchId) {
          this.slots.set(null);
          this.loading.set(false);
          this.error.set(userMessage(err));
        }
      },
    });
  }

  private loadMyAppointments(): void {
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments) => this.myAppointments.set(appointments),
      error: () => this.myAppointments.set([]),
    });
  }
}