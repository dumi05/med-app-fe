import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertMessage } from '../../ui/alert-message/alert-message';
import { FormField } from '../../ui/form-field/form-field';
import { SelectField, SelectOption } from '../../ui/select-field/select-field';
import { LeaveService } from '../leave.service';
import { DoctorService } from '../../doctor/doctor.service';
import { AuthService } from '../../auth/auth.service';
import { DoctorLeave, LeavePreview, LeaveRequest, MAX_LEAVE_DAYS } from '../leave.model';
import { formatDate, todayIso } from '../../format/format';
import { toSignal } from '@angular/core/rxjs-interop';
import { Doctor } from '../../doctor/doctor.model';
import { ApiError } from '../../http/api-error';
import { leaveMessage, leaveProblem } from '../leave-rules';

const NO_REPLACEMENT = 'none';

@Component({
  selector: 'app-leaves-page',
  imports: [DatePipe, ReactiveFormsModule, AlertMessage, FormField, SelectField],
  templateUrl: './leaves-page.html'
})
export class LeavesPage implements OnInit{
  
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly leaveService = inject(LeaveService);
  private readonly doctorService = inject(DoctorService);

  protected readonly isAdmin = inject(AuthService).role() === 'ADMIN';
  protected readonly maxDays = MAX_LEAVE_DAYS;
  protected readonly formatDate = formatDate;

  protected readonly doctorControl = new FormControl('', { nonNullable: true });
  private readonly doctorValue = toSignal(this.doctorControl.valueChanges, { initialValue: ''});
  private readonly doctors  = signal<Doctor[]>([]);
  private readonly me = signal<Doctor | null>(null);

  protected readonly subject = computed<Doctor | null>(() => 
    this.isAdmin ? this.doctors().find((doc) => String(doc.id) === this.doctorValue()) ?? null : this.me());

  protected readonly doctorOptions = computed<SelectOption[]>(() => 
    this.doctors().map((doc) => ({ value: String(doc.id), label: `${doc.lastName} ${doc.firstName} (${doc.specialization})`})));

  protected readonly replacementOptions = computed<SelectOption[]>(() => {
    const subject = this.subject();
    const colleagues = subject === null ? [] : this.doctors().filter((doc) => doc.id !== subject.id && doc.specializationId === subject.specializationId);
    return [
      { value: NO_REPLACEMENT, label: 'Nessuno: le visite prenotate si annullano'},
      ...colleagues.map((doc) => ({ value: String(doc.id), label: `${doc.lastName} ${doc.firstName}`}))
    ];
  });

  protected readonly form = this.formBuilder.group({
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    replacement: [NO_REPLACEMENT],
  });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly problem = computed(() => {
    const { startDate, endDate } = this.formValue();
    return leaveProblem(startDate ?? '', endDate ?? '', todayIso());
  });

  protected readonly leaves = signal<DoctorLeave[] | null>(null);
  protected readonly preview = signal<LeavePreview | null>(null);
  protected readonly tried = signal(false);
  protected readonly checking = signal(false);
  protected readonly saving = signal(false);
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  ngOnInit(): void {
    // what the user has seen in the preview is only true for those dates and that colleague: a change throws it away
    this.form.valueChanges.subscribe(() => this.preview.set(null));
    if (this.isAdmin) {
      this.doctorService.getAllDoctorsForAdmin().subscribe({
        next: (list) => this.doctors.set(list.filter((doctor) => doctor.active)),
        error: (err: ApiError) => this.error.set(leaveMessage(err)),
      });
      this.doctorControl.valueChanges.subscribe(() => this.changeDoctor());
    } else {
      this.doctorService.getMe().subscribe({
        next: (doctor) => this.me.set(doctor),
        error: (err: ApiError) => this.error.set(leaveMessage(err)),
      });
      this.doctorService.getAllDoctors().subscribe({
        next: (list) => this.doctors.set(list),
        error: (err: ApiError) => this.error.set(leaveMessage(err)),
      });
      this.loadLeaves();
    }
  }

  /** "Controlla cosa succede": nothing is changed, the server answers what would happen. */
  protected check(): void {
    this.tried.set(true);
    this.success.set(null);
    if (this.problem() !== null || this.subject() === null) {
      return;
    }
    this.checking.set(true);
    this.error.set(null);
    this.leaveService.preview(this.request()).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.checking.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(leaveMessage(err));
        this.checking.set(false);
      },
    });
  }

  /** The leave is registered with the same dates and colleague that the preview was made with (a change discards the preview). */
  protected confirm(): void {
    if (this.preview() === null) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.leaveService.create(this.request()).subscribe({
      next: (result) => {
        this.success.set(`Assenza registrata. Visite spostate: ${result.reassigned}. Visite annullate: ${result.cancelled}. I pazienti leggono l'avviso nella loro Home.`);
        this.form.reset({ startDate: '', endDate: '', replacement: NO_REPLACEMENT });
        this.tried.set(false);
        this.saving.set(false);
        this.loadLeaves();
      },
      error: (err: ApiError) => {
        this.error.set(leaveMessage(err));
        this.saving.set(false);
      },
    });
  }

  protected discardPreview(): void {
    this.preview.set(null);
  }

  protected askCancel(leave: DoctorLeave): void {
    this.confirmingId.set(leave.id);
  }

  protected keepLeave(): void {
    this.confirmingId.set(null);
  }

  protected cancelLeave(leave: DoctorLeave): void {
    this.busyId.set(leave.id);
    this.error.set(null);
    this.success.set(null);
    this.leaveService.cancel(leave.id).subscribe({
      next: () => {
        this.leaves.update((list) => (list ?? []).filter((other) => other.id !== leave.id));
        this.success.set('Assenza annullata. Le visite già spostate o annullate restano come sono.');
        this.confirmingId.set(null);
        this.busyId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(leaveMessage(err));
        this.confirmingId.set(null);
        this.busyId.set(null);
      },
    });
  }

  private changeDoctor(): void {
    this.success.set(null);
    this.error.set(null);
    this.confirmingId.set(null);
    this.form.reset({ startDate: '', endDate: '', replacement: NO_REPLACEMENT });
    this.tried.set(false);
    this.leaves.set(null);
    if (this.doctorValue() !== '') {
      this.loadLeaves();
    }
  }

  private request(): LeaveRequest {
    const { startDate, endDate, replacement } = this.form.getRawValue();
    const request: LeaveRequest = { startDate, endDate };
    if (this.isAdmin) {
      request.doctorId = Number(this.doctorValue());
    }
    if (replacement !== NO_REPLACEMENT) {
      request.replacementDoctorId = Number(replacement);
    }
    return request;
  }

  private loadLeaves(): void {
    this.leaveService.getUpcoming(this.isAdmin ? Number(this.doctorValue()) : undefined).subscribe({
      next: (list) => this.leaves.set(list),
      error: (err: ApiError) => this.error.set(leaveMessage(err)),
    });
  }
}
