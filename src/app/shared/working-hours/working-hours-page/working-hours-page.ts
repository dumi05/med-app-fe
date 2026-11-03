import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { DoctorAdmin } from '../../doctor/doctor.model';
import { DoctorService } from '../../doctor/doctor.service';
import { ApiError } from '../../http/api-error';
import { userMessage } from '../../http/error-messages';
import { AlertMessage } from '../../ui/alert-message/alert-message';
import { SelectField, SelectOption } from '../../ui/select-field/select-field';
import { DayKey, WORKING_DAYS } from '../working-hours.model';
import { WorkingHoursService } from '../working-hours.service';
import { MAX_BANDS_PER_DAY, Week, bandsFrom, emptyWeek, problemOf, weekFrom } from '../week-plan';

type TimeField = 'start' | 'end';

/**
 * The working hours of a doctor, day by day (Monday to Saturday, a morning and an afternoon for example). The free places
 * of the next eight weeks follow them. A doctor edits their own; the admin chooses the doctor.
 */
@Component({
  selector: 'app-working-hours-page',
  imports: [SelectField, AlertMessage],
  templateUrl: './working-hours-page.html',
})
export class WorkingHoursPage implements OnInit {
  private readonly workingHoursService = inject(WorkingHoursService);
  private readonly doctorService = inject(DoctorService);

  protected readonly isAdmin = inject(AuthService).role() === 'ADMIN';
  protected readonly days = WORKING_DAYS;
  protected readonly maxBands = MAX_BANDS_PER_DAY;

  protected readonly doctorControl = new FormControl('', { nonNullable: true });
  private readonly doctorValue = toSignal(this.doctorControl.valueChanges, { initialValue: '' });
  private readonly doctors = signal<DoctorAdmin[]>([]);
  protected readonly doctorOptions = computed<SelectOption[]>(() =>
    this.doctors().filter((doctor) => doctor.active).map((doctor) => ({ value: String(doctor.id), label: `${doctor.lastName} ${doctor.firstName} (${doctor.specialization})` })));

  protected readonly week = signal<Week>(emptyWeek());
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly tried = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly problems = computed(() => {
    const week = this.week();
    return Object.fromEntries(WORKING_DAYS.map((day) => [day.key, problemOf(week[day.key])])) as Record<DayKey, string | null>;
  });
  protected readonly hasProblems = computed(() => Object.values(this.problems()).some((problem) => problem !== null));

  ngOnInit(): void {
    if (this.isAdmin) {
      this.doctorService.getAllDoctorsForAdmin().subscribe({
        next: (list) => this.doctors.set(list),
        error: (err: ApiError) => this.error.set(userMessage(err)),
      });
      this.doctorControl.valueChanges.subscribe(() => this.load());
    } else {
      this.load();
    }
  }

  protected addBand(day: DayKey): void {
    const bands = this.week()[day];
    // the first band of a day is the morning; the next one starts after the last
    const next = bands.length === 0 ? { start: '09:00', end: '13:00' } : { start: '15:00', end: '19:00' };
    this.update(day, [...bands, next]);
  }

  protected removeBand(day: DayKey, index: number): void {
    this.update(day, this.week()[day].filter((_, i) => i !== index));
  }

  protected setTime(day: DayKey, index: number, field: TimeField, value: string): void {
    this.update(day, this.week()[day].map((band, i) => (i === index ? { ...band, [field]: value } : band)));
  }

  protected save(): void {
    this.tried.set(true);
    if (this.hasProblems()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);
    this.workingHoursService.replace(bandsFrom(this.week()), this.doctorId()).subscribe({
      next: (response) => {
        this.week.set(weekFrom(response.bands));
        this.tried.set(false);
        this.success.set(`Orario salvato: ${response.createdSlots} posti creati, ${response.removedSlots} tolti. Le prenotazioni già fatte non cambiano.`);
        this.saving.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.saving.set(false);
      },
    });
  }

  private doctorId(): number | undefined {
    return this.isAdmin ? Number(this.doctorValue()) : undefined;
  }

  private update(day: DayKey, bands: Week[DayKey]): void {
    this.success.set(null);
    this.week.update((week) => ({ ...week, [day]: bands }));
  }

  private load(): void {
    this.loaded.set(false);
    this.success.set(null);
    this.error.set(null);
    this.tried.set(false);
    if (this.isAdmin && this.doctorValue() === '') {
      return;
    }
    this.workingHoursService.get(this.doctorId()).subscribe({
      next: (response) => {
        this.week.set(weekFrom(response.bands));
        this.loaded.set(true);
      },
      error: (err: ApiError) => this.error.set(userMessage(err)),
    });
  }
}