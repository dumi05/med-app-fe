import { Component, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { PriceListService } from "../../shared/price-list/price-list.service";
import { formatEuro } from "../../shared/format/format";
import { ApiError } from "../../shared/http/api-error";
import { userMessage } from "../../shared/http/error-messages";
import { PriceListEntry } from "../../shared/price-list/price-list.model";

// up to 8 integer digits and 2 decimals, with a dot or a comma: the same limits as the backend (precision: 10, scale: 2).
const PRICE_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;


@Component({
    selector: 'app-price-list',
    imports: [ReactiveFormsModule, AlertMessage],
    templateUrl: './price-list.html'
})
export class PriceList implements OnInit {

    private readonly priceListService = inject(PriceListService);

    protected readonly entries = signal<PriceListEntry[]>([]);
    protected readonly editingId = signal<number | null>(null);
    protected readonly saving = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);

    protected readonly priceControl = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(PRICE_PATTERN), this.positive],
    });

    protected readonly euro = formatEuro;

    ngOnInit(): void {
        this.priceListService.getAll().subscribe({
            next: (entries) => this.entries.set(entries),
            error: (err: ApiError) => this.error.set(userMessage(err)),
        });
    }

    protected edit(entry: PriceListEntry): void {
        this.error.set(null);
        this.success.set(null);
        this.priceControl.reset(String(entry.price));
        this.editingId.set(entry.id);
    }

    protected cancel(): void {
        this.editingId.set(null);
    }

    protected save(entry: PriceListEntry): void {
        if(this.priceControl.invalid){
            this.priceControl.markAsTouched();
            return;
        }

        this.saving.set(true);
        this.error.set(null);
        const price = Number(this.priceControl.value.replace(',','.'));
        this.priceListService.updatePrice(entry.id, price).subscribe({
            next: (updated) => {
                this.entries.update((list) => list.map((item) => item.id === updated.id ? updated: item));
                this.editingId.set(null);
                this.success.set('Prezzo aggiornato');
                this.saving.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.saving.set(false);
            },
        });
    }

    private positive(control: AbstractControl): ValidationErrors | null {
        const value = Number(String(control.value ?? '').replace(',','.'));
        return value > 0 ? null : { positive: true };
    }
    
}
