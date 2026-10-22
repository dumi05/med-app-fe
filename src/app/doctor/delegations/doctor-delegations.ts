import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { DoctorDelegation } from '../../shared/delegation/doctor-delegations.model';
import { DoctorDelegationService } from '../../shared/delegation/doctor-delegations.service';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { todayIso } from '../../shared/format/format';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { DataTable, DataTableColumn, DataTableRow } from '../../shared/ui/data-table/data-table';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SelectField, SelectOption } from '../../shared/ui/select-field/select-field';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';

@Component({
  selector: 'app-doctor-delegations',
  imports: [ReactiveFormsModule, DatePipe, DataTable, DataTableRow, AlertMessage, FormField, SelectField, SubmitButton],
  templateUrl: './doctor-delegations.html',
})
export class DoctorDelegations implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly delegationService = inject(DoctorDelegationService);
  private readonly doctorService = inject(DoctorService);

  private readonly myId = signal<number | null>(null);

  protected readonly delegations = signal<DoctorDelegation[] | null>(null);
  protected readonly colleagueOptions = signal<SelectOption[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly answeringId = signal<number | null>(null);

  protected readonly form = this.formBuilder.group({
    delegateDoctorId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  protected readonly columns: DataTableColumn<DoctorDelegation>[] = [
    { header: 'Tipo', value: (d) => this.direction(d) },
    { header: 'Collega', value: (d) => this.colleague(d) },
    { header: 'Dal', value: (d) => d.startDate, text: (d) => d.startDate },
    { header: 'Al', value: (d) => d.endDate, text: (d) => d.endDate },
    { header: 'Stato', value: (d) => this.statusView(d).label },
    { header: '' },
  ];
  protected readonly rowKey = (d: DoctorDelegation) => d.id;

  ngOnInit(): void {
    forkJoin({
      me: this.doctorService.getMe(),
      doctors: this.doctorService.getAllDoctors(),
      delegations: this.delegationService.getMine(),
    }).subscribe({
      next: ({ me, doctors, delegations }) => {
        this.myId.set(me.id);
        this.colleagueOptions.set(
          doctors
            .filter((d) => d.id !== me.id)
            .map((d) => ({ value: String(d.id), label: `${d.firstName} ${d.lastName} - ${d.specialization}` })),
        );
        this.delegations.set(delegations);
      },
      error: (err: ApiError) => this.error.set(userMessage(err)),
    });
  }

  protected direction(d: DoctorDelegation): string {
    return d.delegatingDoctorId === this.myId() ? 'Hai delegato' : 'Delegato a te';
  }

  protected colleague(d: DoctorDelegation): string {
    return d.delegatingDoctorId === this.myId()
      ? `${d.delegateDoctorFirstName} ${d.delegateDoctorLastName}`
      : `${d.delegatingDoctorFirstName} ${d.delegatingDoctorLastName}`;
  }

  protected canAnswer(d: DoctorDelegation): boolean {
    return d.status === 'PROPOSED' && d.delegateDoctorId === this.myId();
  }

  protected statusView(d: DoctorDelegation): { label: string; style: string } {
    if (d.status === 'PROPOSED') {
      return { label: 'In attesa', style: 'text-bg-warning' };
    }
    if (d.status === 'REJECTED') {
      return { label: 'Rifiutata', style: 'text-bg-secondary' };
    }
    const today = todayIso();
    if (d.endDate < today) {
      return { label: 'Terminata', style: 'text-bg-secondary' };
    }
    if (d.startDate > today) {
      return { label: 'Programmata', style: 'text-bg-info' };
    }
    return { label: 'Attiva', style: 'text-bg-success' };
  }

  protected propose(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { delegateDoctorId, startDate, endDate } = this.form.getRawValue();
    this.error.set(null);
    this.success.set(null);
    if (endDate < startDate) {
      this.error.set('La data di fine non può precedere quella di inizio.');
      return;
    }

    this.loading.set(true);
    this.delegationService
      .propose({ delegateDoctorId: Number(delegateDoctorId), startDate, endDate })
      .subscribe({
        next: (created) => {
          this.delegations.update((list) => [created, ...(list ?? [])]);
          this.form.reset();
          this.success.set('Proposta inviata al collega.');
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(userMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected accept(d: DoctorDelegation): void {
    this.answer(d, this.delegationService.accept(d.id));
  }

  protected reject(d: DoctorDelegation): void {
    this.answer(d, this.delegationService.reject(d.id));
  }

  private answer(d: DoctorDelegation, request: Observable<DoctorDelegation>): void {
    this.answeringId.set(d.id);
    this.error.set(null);
    this.success.set(null);

    request.subscribe({
      next: (updated) => {
        this.delegations.update((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
        this.answeringId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(userMessage(err));
        this.answeringId.set(null);
      },
    });
  }
}