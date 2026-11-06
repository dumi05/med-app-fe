import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MedicalReportService } from '../medical-report.service';
import { AlertMessage } from '../../ui/alert-message/alert-message';
import { FormField } from '../../ui/form-field/form-field';
import { SubmitButton } from '../../ui/submit-button/submit-button';
import { ReportCard } from '../report-card/report-card';
import { MedicalReport } from '../medical-report.model';
import { ApiError } from '../../http/api-error';
import { userMessage } from '../../http/error-messages';
import { ATTACHMENT_ACCEPT, attachmentProblem } from '../attachment';

type PageState = 'loading' | 'view' | 'write' | 'missing' | 'error';

@Component({
  selector: 'app-appointment-report',
  imports: [ReactiveFormsModule,RouterLink,AlertMessage,FormField,SubmitButton,ReportCard ],
  templateUrl: './appointment-report.html',
})
export class AppointmentReport implements OnInit{

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly reportService = inject(MedicalReportService);

  private readonly appointmentId = Number(this.route.snapshot.paramMap.get('appointmentId'));
  private readonly isDoctor = this.auth.role() === 'DOCTOR';

  protected readonly state = signal<PageState>('loading');
  protected readonly report = signal<MedicalReport | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly loading = signal(false);

  // The file is not in the form group: a file chooser has no string value to validate.
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly accept = ATTACHMENT_ACCEPT;

  protected readonly backLink = this.isDoctor ? '/doctor/visits' : '/patient/appointments';
  protected readonly backLabel = this.isDoctor ? 'Torna alle visite' : 'Torna alle prenotazioni';

  protected readonly form = this.formBuilder.group({
    diagnosisText: ['', [Validators.required, Validators.maxLength(5000)]]
  });

  ngOnInit(): void {
    this.reportService.getReportByAppointment(this.appointmentId).subscribe({
      next: (report) => {
        this.report.set(report);
        this.state.set('view');
      },
      error: (err: ApiError) => {
        if(err.code === 'RESOURCE_NOT_FOUND'){
          this.state.set(this.isDoctor ? 'write' : 'missing');
        } else {
          this.error.set(userMessage(err));
          this.state.set('error');
        }
      }
    });
  }

  /** A file that cannot be attached is refused at once, with the reason, and the chooser is emptied. */
  protected chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const chosen = input.files?.item(0) ?? null;
    const problem = chosen === null ? null : attachmentProblem(chosen);

    this.fileError.set(problem);
    if (problem !== null) {
      input.value = '';
    }
    this.file.set(problem === null ? chosen : null);
  }

  protected submit(): void {
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    const { diagnosisText } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.reportService.createReport({ appointmentId: this.appointmentId, diagnosisText }, this.file())
                      .subscribe({
                        next: (report) => {
                          this.report.set(report);
                          this.success.set('Referto salvato.');
                          this.state.set('view');
                          this.loading.set(false);
                        },
                        error: (err: ApiError) => {
                          this.error.set(err.code === 'INVALID_STATE_TRANSITION' 
                            ? 'Prima del referto devi registrare il pagamento ed emettere la fattura, dalla pagina delle visite.'
                            : userMessage(err));
                          this.loading.set(false);
                        }
                      });
  }

}