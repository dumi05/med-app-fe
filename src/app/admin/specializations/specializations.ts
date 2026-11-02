import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { SubmitButton } from "../../shared/ui/submit-button/submit-button";
import { FormField } from "../../shared/ui/form-field/form-field";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { SpecializationService } from "../../shared/specialization/specialization.service";
import { Specialization } from "../../shared/specialization/specialization.model";
import { userMessage } from "../../shared/http/error-messages";
import { formatEuro } from "../../shared/format/format";
import { ApiError } from "../../shared/http/api-error";

const PRICE_PATTERN = /^\d{1,4}([.,]\d{1,2})?$/;

function nameLength(control: AbstractControl<string>): ValidationErrors | null {
    const name = control.value.trim();
    return name.length >= 2 && name.length <= 80 ? null : { nameLength: true };
}

function positivePrice(control: AbstractControl<string>): ValidationErrors | null {
    const price = control.value.replace(',', '.');
    return Number(price) > 0 ? null : { positivePrice: true };
}

@Component({
    selector: 'app-specializations',
    templateUrl: './specializations.html',
    imports: [ReactiveFormsModule, AlertMessage, FormField, SubmitButton],
})
export class Specializations implements OnInit {

    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly specializationService = inject(SpecializationService);
    
    protected readonly specializations = signal<Specialization[]>([]);
    protected readonly loading = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);

    protected readonly form = this.formBuilder.group({
        name: ['', [Validators.required, nameLength]],
        price: ['', [Validators.required, positivePrice, Validators.pattern(PRICE_PATTERN)]],
    });

    ngOnInit(): void {
        this.specializationService.getAllSpecializations().subscribe({
            next: (specializations) => this.specializations.set(this.sorted(specializations)),
            error: (err) => this.error.set(userMessage(err)),
        });
    }

    protected submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);

        const name = this.form.controls.name.value.trim();
        const price = Number(this.form.controls.price.value.replace(',', '.'));

        this.specializationService.create({ name, price }).subscribe({
            next: (created) => {
                this.specializations.update((specializations) => this.sorted([...specializations, created]));
                this.success.set(`Specializzazione «${created.name}» creata, con il prezzo di ${formatEuro(price)}.`);
                this.form.reset();
                this.loading.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.loading.set(false);
            }
        });
    }

    private sorted(list: Specialization[]): Specialization[] {
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
}