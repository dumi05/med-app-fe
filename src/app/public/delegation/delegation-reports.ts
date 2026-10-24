import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SharedMedicalReport } from '../../shared/delegation/report-delegation.model';
import { ReportDelegationService } from '../../shared/delegation/report-delegation.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';

/**
 * Public page of the caregiver: no login, no side bar. The token in the address is the only credential.
 */
@Component({
  selector: 'app-delegation-reports',
  imports: [DatePipe, AlertMessage],
  templateUrl: './delegation-reports.html',
})
export class DelegationReports implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly delegationService = inject(ReportDelegationService);
  private readonly meta = inject(Meta);

  protected readonly reports = signal<SharedMedicalReport[] | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.meta.addTag({ name: 'referrer', content: 'no-referrer' });
    this.meta.addTag({ name: 'robots', content: 'noindex' });

    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.delegationService.getSharedReports(token).subscribe({
      next: (reports) => this.reports.set(reports),
      error: (err: ApiError) =>
        this.error.set(err.status === 404
          ? 'Il link non è valido o non è più attivo. Chiedi a chi te lo ha dato di generarne uno nuovo.'
          : userMessage(err)),
    });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="referrer"');
    this.meta.removeTag('name="robots"');
  }
}