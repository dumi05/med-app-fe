import { DatePipe } from "@angular/common";
import { Component, inject, input, signal } from "@angular/core";
import { MedicalReport } from "../medical-report.model";
import { AlertMessage } from "../../ui/alert-message/alert-message";
import { MedicalReportService } from "../medical-report.service";
import { attachmentErrorMessage, attachmentLabel } from "../attachment";
import { downloadBlob, filenameFrom } from "../../download/download-blob";
import { ApiError } from "../../http/api-error";
import { userMessage } from "../../http/error-messages";

@Component({
    selector: 'app-report-card',
    imports: [DatePipe, AlertMessage],
    template: `
        <div class="card">
            <div class="card-body">
                <h2 class="h5 card-title">Referto</h2>
                <p class="text-muted small mb-3">Redatto il {{ report().completedAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                <p class="pre-wrap mb-0">{{ report().diagnosisText }}</p>
                @if (report().attachment; as attachment) {
                    <div class="mt-3">
                        <button type="button" class="btn btn-outline-primary btn-sm download-button"
                                [disabled]="downloading()" (click)="download()">Scarica allegato</button>
                        <span class="text-muted small ms-2">{{ label(attachment) }}</span>
                    </div>
                    <app-alert-message class="d-block mt-3" [message]="error()" />
                }
            </div>
        </div>
    `,
})
export class ReportCard {
    private readonly reportService = inject(MedicalReportService);

    readonly report = input.required<MedicalReport>();

    protected readonly downloading = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly label = attachmentLabel;

    protected download(): void {
        const id = this.report().id;
        this.downloading.set(true);
        this.error.set(null);
        this.reportService.downloadAttachment(id).subscribe({
            next: (response) => {
                if(response.body !== null){
                    downloadBlob(filenameFrom(response.headers.get('Content-Disposition'), `referto-${id}`), response.body);
                }
                this.downloading.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(attachmentErrorMessage(err));
                this.downloading.set(false);
            }
        });
    }
}