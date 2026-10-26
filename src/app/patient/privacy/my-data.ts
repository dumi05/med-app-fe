import { Component, inject, signal } from "@angular/core";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { Router, RouterLink } from "@angular/router";
import { PatientDataService } from "../../shared/patient/patient-data.service";
import { AuthService } from "../../shared/auth/auth.service";
import { downloadJson } from "../../shared/download/download-json";
import { todayIso } from "../../shared/format/format";
import { ApiError } from "../../shared/http/api-error";
import { userMessage } from "../../shared/http/error-messages";

@Component({
    selector: 'app-my-data',
    imports: [RouterLink, AlertMessage],
    templateUrl: './my-data.html',
})
export class MyData {
    private readonly dataService = inject(PatientDataService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);
    protected readonly exporting = signal(false);
    protected readonly confirmingDelete = signal(false);
    protected readonly understood = signal(false);
    protected readonly deleting = signal(false);

    protected exportData(): void {
        this.exporting.set(true);
        this.clearMessages();
        this.dataService.exportMyData().subscribe({
            next: (data) => {
                downloadJson(`dati-studio-medico-${todayIso()}.json`, data);
                const visits = data.appointments.length;
                const reports = data.reports.length;
                this.success.set(`Dati scaricati: il tuo profilo, ${visits} ${visits === 1 ? 'visita' : 'visite'} e ${reports} ${reports === 1 ? 'referto' : 'referti'}.`);
                this.exporting.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.exporting.set(false);
            }
        });
    }

    protected askDelete(): void {
        this.clearMessages();
        this.understood.set(false);
        this.confirmingDelete.set(true);
    }

    protected cancelDelete(): void {
        this.confirmingDelete.set(false);
    }

    protected setUnderstood(event: Event): void {
        this.understood.set((event.target as HTMLInputElement).checked);
    }

    protected deleteAccount(): void {
        if(!this.understood()){
            return;
        }
        this.deleting.set(true);
        this.clearMessages();
        this.dataService.anonymizeMe().subscribe({
            next: () => {
                this.authService.logout();
                this.router.navigate(['/login'], { queryParams: {deleted: '1'} });
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.confirmingDelete.set(false);
                this.deleting.set(false);
            }
        });
    }

    private clearMessages(): void {
        this.error.set(null);
        this.success.set(null);
    }
}