import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SharedMedicalReport } from '../../shared/delegation/report-delegation.model';
import { ReportDelegationService } from '../../shared/delegation/report-delegation.service';
import { ApiError } from '../../shared/http/api-error';
import { userMessage } from '../../shared/http/error-messages';
import { AlertMessage } from '../../shared/ui/alert-message/alert-message';
import { FormField } from '../../shared/ui/form-field/form-field';
import { SubmitButton } from '../../shared/ui/submit-button/submit-button';
import { downloadBlob, filenameFrom } from '../../shared/download/download-blob';
import { attachmentErrorMessage } from '../../shared/report/attachment';

const LINK_NOT_VALID = 'Il link non è valido o non è più attivo. Chiedi a chi te lo ha dato di generarne uno nuovo.';

/**
 * Public page of the caregiver: no login, no side bar. The address is not enough to read: the page asks for the access
 * code that the patient gave by another way, and then keeps the token it gets in memory only (a reload asks again).
 */
@Component({
  selector: 'app-delegation-reports',
  imports: [DatePipe, ReactiveFormsModule, AlertMessage, FormField, SubmitButton],
  templateUrl: './delegation-reports.html',
})
export class DelegationReports implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly delegationService = inject(ReportDelegationService);
  private readonly meta = inject(Meta);

  private token = '';
  /** Not saved anywhere: it lives as long as the page is open. */
  private accessToken: string | null = null;

  protected readonly codeControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly form = new FormGroup({ code: this.codeControl });
  protected readonly reports = signal<SharedMedicalReport[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly downloadError = signal<string | null>(null);
  protected readonly downloadingId = signal<number | null>(null);
  protected readonly unlocking = signal(false);

  ngOnInit(): void {
    this.meta.addTag({ name: 'referrer', content: 'no-referrer' });
    this.meta.addTag({ name: 'robots', content: 'noindex' });
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="referrer"');
    this.meta.removeTag('name="robots"');
  }

  protected unlock(): void {
    if (this.codeControl.invalid || this.codeControl.value.trim() === '') {
      this.codeControl.markAsTouched();
      return;
    }
    this.unlocking.set(true);
    this.error.set(null);
    this.delegationService.unlock(this.token, this.codeControl.value.trim()).subscribe({
      next: (grant) => {
        this.accessToken = grant.accessToken;
        this.codeControl.reset();
        this.loadReports();
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 404 ? LINK_NOT_VALID : userMessage(err));
        this.unlocking.set(false);
      },
    });
  }

  protected download(report: SharedMedicalReport): void {
    this.downloadingId.set(report.id);
    this.downloadError.set(null);
    this.delegationService.downloadSharedAttachment(this.token, report.id, this.accessToken ?? '').subscribe({
      next: (response) => {
        if(response.body !== null){
          downloadBlob(filenameFrom(response.headers.get('Content-Disposition'), `referto-${report.id}`), response.body);
        }
        this.downloadingId.set(null);
      },
      error: (err: ApiError) => {
        // the error of a download comes as a file (blob), so the code is not readable: a 403 here can only be the token
        if (err.status === 403 || err.code === 'ACCESS_CODE_REQUIRED') {
          this.askForTheCodeAgain();
        } else {
          this.downloadError.set(attachmentErrorMessage(err));
        }
        this.downloadingId.set(null);
      }
    });
  }

  private loadReports(): void {
    this.delegationService.getSharedReports(this.token, this.accessToken ?? '').subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.unlocking.set(false);
      },
      error: (err: ApiError) => {
        this.unlocking.set(false);
        if (err.code === 'ACCESS_CODE_REQUIRED') {
          this.askForTheCodeAgain();
        } else {
          this.error.set(err.status === 404 ? LINK_NOT_VALID : userMessage(err));
        }
      },
    });
  }

  /** The few minutes of the token are over: the reports leave the screen and the code is asked again. */
  private askForTheCodeAgain(): void {
    this.accessToken = null;
    this.reports.set(null);
    this.error.set('Il tempo a disposizione è scaduto: inserisci di nuovo il codice.');
  }
}