import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { formatDate, todayIso } from "../../shared/format/format";
import { Component, inject, OnInit, signal } from "@angular/core";
import { DataTable, DataTableColumn, DataTableRow } from "../../shared/ui/data-table/data-table";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { FormField } from "../../shared/ui/form-field/form-field";
import { SubmitButton } from "../../shared/ui/submit-button/submit-button";
import { ReportDelegationService } from "../../shared/delegation/report-delegation.service";
import { ReportDelegation } from "../../shared/delegation/report-delegation.model";
import { userMessage } from "../../shared/http/error-messages";
import { ApiError } from "../../shared/http/api-error";
import { delegationLink } from "../../shared/delegation/delegation-link";

function notInThePast(control: AbstractControl<string>): ValidationErrors | null {
    return control.value !== '' && control.value < todayIso() ? { past: true } : null;
}

@Component({
    selector: 'app-report-delegations',
    imports: [ReactiveFormsModule, DataTable, DataTableRow, AlertMessage, FormField, SubmitButton],
    templateUrl: './report-delegations.html'
})
export class ReportDelegations implements OnInit {

    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly delegationService = inject(ReportDelegationService);

    protected readonly delegations = signal<ReportDelegation[] | null> (null);
    protected readonly error = signal<string | null> (null);
    protected readonly success = signal<string | null> (null);
    protected readonly loading = signal(false);

    protected readonly sharedLink = signal<string | null>(null);
    protected readonly confirmingId = signal<number | null>(null);
    protected readonly busyId = signal<number | null>(null);

    protected readonly form = this.formBuilder.group({
        delegateName: ['', Validators.required],
        delegateEmail: ['', [Validators.required, Validators.email]],
        expiresAt: ['', notInThePast]
    });

    protected readonly columns: DataTableColumn<ReportDelegation>[] = [
        { header: 'Persona', value:(d) => d.delegateName, text: (d) => `${d.delegateName} ${d.delegateEmail}`},
        { header: 'Scadenza', value:(d) => d.expiresAt ?? '9999-12-31', text: (d) => this.expiry(d) },
        { header: 'Stato', value:(d) => this.statusView(d).label },
        { header: ''}
    ];
    protected readonly rowKey = (d: ReportDelegation) => d.id;

    ngOnInit(): void {
        this.delegationService.getMine().subscribe({
            next: (list) => this.delegations.set(list),
            error: (err: ApiError) => this.error.set(userMessage(err))
        })
    }

    protected expiry(d: ReportDelegation): string {
        return d.expiresAt === null ? 'Nessuna' : formatDate(d.expiresAt);
    }

    protected statusView(d: ReportDelegation): { label: string, style: string } {
        if(d.revoked) {
            return { label: 'Revocata', style: 'text-bg-secondary'};
        }
        return d.active ? { label: 'Attiva', style: 'text-bg-success'} : {label: 'Scaduta', style: 'text-bg-warning'};
    }

    protected create(): void {
        if(this.form.invalid){
            this.form.markAllAsTouched();
            return;
        }

        const { delegateName, delegateEmail, expiresAt } = this.form.getRawValue();
        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);
        this.delegationService.create({ delegateName: delegateName.trim(), delegateEmail: delegateEmail.trim(), expiresAt: expiresAt === '' ? null : expiresAt})
        .subscribe({
            next: (created) => {
                this.delegations.update((l) => [created, ...(l ?? [])]);
                this.form.reset();
                this.sharedLink.set(delegationLink(created.token));
                this.success.set('Delega creata. Copia il link qui sotto e condividilo con la persona scelta.');
                this.loading.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.loading.set(false);
            }
        });
    }

    protected showLink(d: ReportDelegation): void {
        this.error.set(null);
        this.success.set(null);
        this.sharedLink.set(delegationLink(d.token));
    }

    protected async copyLink(): Promise<void> {
        const link = this.sharedLink();
        if(link === null) {
            return;
        }

        try{
            await navigator.clipboard.writeText(link);
            this.error.set(null);
            this.success.set('Link copiato negli appunti.');
        } catch {
            this.success.set(null);
            this.error.set('La copia automatica non è riuscita: ona il link e copialo a mano.');
        }
    }

    protected askRevoke(d: ReportDelegation): void {
        this.error.set(null);
        this.success.set(null);
        this.confirmingId.set(d.id);
    }

    protected cancelRevoke(): void {
        this.confirmingId.set(null);
    }

    protected revoke(d: ReportDelegation): void {
        this.busyId.set(d.id);
        this.error.set(null);
        this.success.set(null);
        this.delegationService.revoke(d.id).subscribe({
            next: (updated) => {
                this.delegations.update((l) => l?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
                this.confirmingId.set(null);
                this.sharedLink.set(null);
                this.success.set('Delega revocata con successo: il link non è più funzionante.');
                this.busyId.set(null);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.confirmingId.set(null);
                this.busyId.set(null);
            },
        });
    }
}