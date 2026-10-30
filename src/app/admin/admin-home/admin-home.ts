import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Shortcuts } from '../../shared/ui/shortcuts/shortcuts';
import { StatCard } from '../../shared/ui/stat-card/stat-card';
import { DashboardService } from '../../shared/dashboard/dashboard.service';
import { DoctorService } from '../../shared/doctor/doctor.service';
import { AuditLogService } from '../../shared/audit/audit-log.service';
import { DashboardKpi } from '../../shared/dashboard/dashboard.model';
import { DoctorAdmin } from '../../shared/doctor/doctor.model';
import { AuditLogEntry } from '../../shared/audit/audit-log.model';
import { formatEuro, formatPercent } from '../../shared/format/format';
import { actionLabel } from '../../shared/audit/audit-labels';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';

const LATEST_ACTIVITY = 10;

@Component({
  selector: 'app-admin-home',
  imports: [DatePipe, Shortcuts, StatCard],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
})
export class AdminHome implements OnInit{

  private readonly dashboardService = inject(DashboardService);
  private readonly doctorService = inject(DoctorService);
  private readonly auditLogService = inject(AuditLogService);

  protected readonly kpi = signal<DashboardKpi | null>(null);
  protected readonly doctors = signal<DoctorAdmin[] | null>(null);
  protected readonly activity = signal<AuditLogEntry[] | null>(null);
  protected readonly kpiError = signal<string | null>(null);
  protected readonly doctorsError = signal<string | null>(null);
  protected readonly activityError = signal<string | null>(null);

  protected readonly activeDoctors = computed(() => (this.doctors() ?? []).filter((doc) => doc.active).length);
  protected readonly inactiveDoctors = computed(() => (this.doctors() ?? []).filter((doc) => !doc.active).length);
  
  protected readonly formatEuro = formatEuro;
  protected readonly formatPercent = formatPercent;
  protected readonly actionLabel = actionLabel;

  ngOnInit(): void {
    this.dashboardService.getKpi().subscribe({
      next: (kpi) => this.kpi.set(kpi),
      error: (err: ApiError) => this.kpiError.set(userMessage(err))
    });
    this.doctorService.getAllDoctorsForAdmin().subscribe({
      next: (doc) => this.doctors.set(doc),
      error: (err: ApiError) => this.doctorsError.set(userMessage(err))
    });
    this.auditLogService.getLatest(LATEST_ACTIVITY).subscribe({
      next: (log) => this.activity.set(log),
      error: (err: ApiError) => this.activityError.set(userMessage(err))
    });
  }

  protected record(entry: AuditLogEntry) {
    return entry.entityId === null ? entry.entityName : `${entry.entityName} #${entry.entityId}`;
  }

}
