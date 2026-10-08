import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { GDPR_CONSENT_VERSION } from '../gdpr-consent';
import { homeForRole } from '../role-home';
import { userMessage } from '../../http/error-messages';
import { ApiError } from '../../http/api-error';
import { AuthLayout } from '../auth-layout/auth-layout';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly consentVersion = GDPR_CONSENT_VERSION;
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
    gdprConsent: [false, [Validators.requiredTrue]]
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  
  protected submit(): void {
    if(this.form.invalid){
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
