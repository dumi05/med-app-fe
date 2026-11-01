import { Component, computed, inject, signal } from "@angular/core";
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { AlertMessage } from "../../ui/alert-message/alert-message";
import { FormField } from "../../ui/form-field/form-field";
import { PasswordRules } from "../../ui/password-rules/password-rules";
import { SubmitButton } from "../../ui/submit-button/submit-button";
import { AuthService } from "../../auth/auth.service";
import { Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { passwordChecks } from "../../validation/password-checks";
import { homeForRole } from "../../auth/role-home";
import { ApiError } from "../../http/api-error";
import { userMessage } from "../../http/error-messages";

function confirmationMatches(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmation = group.get('confirmation')?.value;
    return newPassword !== '' && confirmation !== '' && newPassword !== confirmation ? { mismatch: true } : null;
}

@Component({
    selector: 'app-change-password',
    imports: [ReactiveFormsModule, AlertMessage, FormField, PasswordRules, SubmitButton],
    templateUrl: './change-password.html'
})
export class ChangePassword {
    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly mustChange = this.authService.mustChangePassword;

    protected readonly form = this.formBuilder.group({
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required]],
        confirmation: ['', [Validators.required]]
    }, { validators: confirmationMatches });

    private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue()});
    protected readonly passwordChecks = computed(() => passwordChecks(this.values().newPassword ?? '', { email: this.authService.session()?.email ?? ''}));
    protected readonly passwordStarted = computed(() => (this.values().newPassword ?? '') !== '');

    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);
    protected readonly loading = signal(false);

    protected submit(): void {
        if(this.form.invalid || !this.passwordChecks().every((check) => check.ok)){
            this.form.markAllAsTouched();
            return;
        }

        const { currentPassword, newPassword } = this.form.getRawValue();
        const wasForced = this.mustChange();
        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);
        this.authService.changePassword({ currentPassword, newPassword }).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.form.reset();
                if(wasForced){
                    this.router.navigateByUrl(homeForRole(response.role));
                } else {
                    this.success.set('Password aggiornata. Dagli altri dispositivi dovrai accedere di nuovo.');
                }
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.loading.set(false);
            }
        });
    }
}