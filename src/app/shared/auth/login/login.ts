import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { homeForRole } from '../role-home';
import { ApiError } from '../../http/api-error';
import { userMessage } from '../../http/error-messages';
import { AuthLayout } from '../auth-layout/auth-layout';
import { AlertMessage } from '../../ui/alert-message/alert-message';
import { FormField } from '../../ui/form-field/form-field';
import { SubmitButton } from '../../ui/submit-button/submit-button';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, AlertMessage, FormField, SubmitButton],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null> (
    this.route.snapshot.queryParamMap.has('deleted') ? 'Il tuo account è stato eliminato.' : null
  );
  protected readonly loading = signal(false);

  protected submit(): void {
    if (this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (resp) => this.router.navigateByUrl(homeForRole(resp.role)),
      error: (e: ApiError) => {
        this.error.set(userMessage(e));
        this.loading.set(false);
      }

    })
  }
}
