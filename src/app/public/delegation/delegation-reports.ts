import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SharedMedicalReport } from '../../shared/delegation/report-delegation.model';
import { ReportDelegationService } from '../../shared/delegation/report-delegation.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { downloadBlob, filenameFrom } from '../../shared/download/download-blob';
import { attachmentErrorMessage } from '../../shared/report/attachment';

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

  private token = '';

  protected readonly reports = signal<SharedMedicalReport[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);
  protected readonly downloadingId = signal<number | null>(null);

  ngOnInit(): void {

    this.meta.addTag({ name: 'referrer', content: 'no-referrer' });
    this.meta.addTag({ name: 'robots', content: 'noindex' });

    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.delegationService.getSharedReports(this.token).subscribe({
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

  protected download(report: SharedMedicalReport): void {
    this.downloadingId.set(report.id);
    this.downloadError.set(null);
    this.delegationService.downloadSharedAttachment(this.token, report.id).subscribe({
      next: (response) => {
        if(response.body !== null){
          downloadBlob(filenameFrom(response.headers.get('Content-Disposition'), `referto-${report.id}`), response.body);
        }
        this.downloadingId.set(null);
      },
      error: (err:ApiError) => {
        this.downloadError.set(attachmentErrorMessage(err));
        this.downloadingId.set(null);
      }
    })
  }
}