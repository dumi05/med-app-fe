import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { AppointmentStatus } from "../../shared/appointment/appointment.model";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { ChartCanvas } from "../../shared/ui/chart-canvas/chart-canvas";
import { DashboardService } from "../../shared/dashboard/dashboard.service";
import { formatEuro, formatPercent } from "../../shared/format/format";
import { ApiError } from "../../shared/http/api-error";
import { userMessage } from "../../shared/http/error-messages";
import { DashboardKpi } from "../../shared/dashboard/dashboard.model";

const STATUS_ORDER: AppointmentStatus[] = ['BOOKED', 'COMPLETED', 'INVOICED', 'REPORTED', 'CANCELLED'];
const STATUS_LABELS: Record<AppointmentStatus, string> = {
    BOOKED: 'Prenotate',
    COMPLETED: 'Da fatturare',
    INVOICED: 'Pagate, da refertare',
    REPORTED: 'Refertate',
    CANCELLED: 'Cancellate'
};

@Component({
    selector: 'app-dashboard',
    imports: [AlertMessage, ChartCanvas],
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
    private readonly dashboardService = inject(DashboardService);

    protected readonly kpi = signal<DashboardKpi | null>(null);
    protected readonly error = signal<string | null>(null);

    protected readonly statusLabels = STATUS_ORDER.map((status) => STATUS_LABELS[status]);
    protected readonly statusValues = computed(() => 
        STATUS_ORDER.map((status) => this.kpi()?.appointmentsByStatus[status] ?? 0)
    );

    protected readonly revenueLabels = computed(() => 
        (this.kpi()?.revenueBySpecialization ?? []).map((item) => item.specialization)
    );
    protected readonly revenueValues = computed(() => 
        (this.kpi()?.revenueBySpecialization ?? []).map((item) => item.revenue)
    );

    protected readonly euro = formatEuro;
    protected readonly percent = formatPercent;

    ngOnInit(): void {
        this.dashboardService.getKpi().subscribe({
            next: (kpi) => this.kpi.set(kpi),
            error: (err: ApiError) => this.error.set(userMessage(err)),
        });
    }
}