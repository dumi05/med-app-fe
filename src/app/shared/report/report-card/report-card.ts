import { DatePipe } from "@angular/common";
import { Component, input } from "@angular/core";
import { MedicalReport } from "../medical-report.model";

@Component({
    selector: 'app-report-card',
    imports: [DatePipe],
    template: `
        <div class="card">
            <div class="card-body">
                <h2 class="h5 card-title">Referto</h2>
                <p class="text-muted small mb-3">Redatto il {{ report().completedAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                <p class="pre-wrap mb-0">{{ report().diagnosisText }}</p>
                @if (report().attachmentUrl; as url) {
                    <a class="d-inline-block mt-3" [href]="url" target="_blank" rel="noopener noreferrer">Apri allegato</a>
                }
            </div>
        </div>
    `,
})
export class ReportCard {
    readonly report = input.required<MedicalReport>();
}