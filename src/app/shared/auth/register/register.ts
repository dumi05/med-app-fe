import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { GDPR_CONSENT_VERSION } from '../gdpr-consent';
import { homeForRole } from '../role-home';
import { userMessage } from '../../http/error-messages';
import { ApiError } from '../../http/api-error';
import { AuthLayout } from '../auth-layout/auth-layout';
import { FormField } from '../../ui/form-field/form-field';
import { AlertMessage } from '../../ui/alert-message/alert-message';
import { SubmitButton } from '../../ui/submit-button/submit-button';
import { PasswordRules } from '../../ui/password-rules/password-rules';
import { emailFormat } from '../../validation/email-format';
import { toSignal } from '@angular/core/rxjs-interop';
import { passwordChecks } from '../../validation/password-checks';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, FormField, AlertMessage, SubmitButton, PasswordRules],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly consentVersion = GDPR_CONSENT_VERSION;
  protected readonly form = this.formBuilder.group({
    email: ['', [Validators.required, emailFormat]],
    password: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
    gdprConsent: [false, [Validators.requiredTrue]]
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly passwordChecks = computed(() => {
    const values = this.values();
    return passwordChecks(values.password ?? '', {
      email: values.email ?? '', firstName: values.firstName ?? '', lastName: values.lastName ?? '', 
    });
  });
  protected readonly passwordStarted = computed(() => (this.values().password ?? '') !== '');

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  
  protected submit(): void {
    if(this.form.invalid || !this.passwordChecks().every((check) => check.ok)){
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.authService.register({
      ...this.form.getRawValue(), gdprConsentVersion: GDPR_CONSENT_VERSION
    }).subscribe({
      next: (response) => this.router.navigateByUrl(homeForRole(response.role)),
      error: (e: ApiError) => {
        this.error.set(userMessage(e));
        this.loading.set(false);
      } 
    });
  }
}
