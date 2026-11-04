import { AbstractControl, FormBuilder, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { formatDate, todayIso } from "../../shared/format/format";
import { addDays } from "../../shared/calendar/calendar-grid";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { NewsService } from "../../shared/news/news.service";
import { DatePipe } from "@angular/common";
import { AlertMessage } from "../../shared/ui/alert-message/alert-message";
import { FormField } from "../../shared/ui/form-field/form-field";
import { SubmitButton } from "../../shared/ui/submit-button/submit-button";
import { MAX_NEWS_BODY, MAX_NEWS_DAYS, MAX_NEWS_TITLE, News } from "../../shared/news/news.model";
import { ApiError } from "../../shared/http/api-error";
import { userMessage } from "../../shared/http/error-messages";

const DEFAULT_DAYS = 14;

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
    return control.value.trim() === '' ? { blank: true }: null;
}

function expiryInRange(control: AbstractControl<string>): ValidationErrors | null {
    const day = control.value;
    return day >= todayIso() && day <= addDays(todayIso(), MAX_NEWS_DAYS) ? null : { range: true }; 
}

@Component({
    selector: 'app-doctor-news',
    imports: [DatePipe, ReactiveFormsModule, AlertMessage, FormField, SubmitButton],
    templateUrl: './doctor-news.html'
})
export class DoctorNews implements OnInit {
    
    private readonly newsService = inject(NewsService);
    private readonly formBuilder = inject(NonNullableFormBuilder);

    protected readonly news = signal<News[] | null>(null);
    protected readonly loading = signal(false);
    protected readonly error = signal<string | null>(null);
    protected readonly success = signal<string | null>(null);
    protected readonly confirmingId = signal<number | null>(null);
    protected readonly busyId = signal<number | null>(null);
    protected readonly today = todayIso();
    protected readonly formatDate = formatDate;
    protected readonly maxTitleLength = MAX_NEWS_TITLE;
    protected readonly maxBodyLength = MAX_NEWS_BODY;

    protected readonly form = this.formBuilder.group({
        title: ['', [notBlank, Validators.maxLength(MAX_NEWS_TITLE)]],
        body: ['', [notBlank, Validators.maxLength(MAX_NEWS_BODY)]],
        expiresAt: [addDays(todayIso(), DEFAULT_DAYS), [Validators.required, expiryInRange]]
    });

    protected readonly bodyLength = computed(() => this.bodyValue().length);
    private readonly bodyValue = signal('');    


    ngOnInit(): void {
        this.form.controls.body.valueChanges.subscribe((val) => this.bodyValue.set(val));
        this.newsService.getMine().subscribe({
            next: (mines) => this.news.set(mines),
            error: (err: ApiError) => this.error.set(userMessage(err))
        });
    }

    protected isExpired(item: News): boolean {
        return item.expiresAt < this.today;
    }

    protected submit(): void {
        if(this.form.invalid){
            this.form.markAllAsTouched();
            return;
        }

        const { title, body, expiresAt } = this.form.getRawValue();
        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);
        this.newsService.create({ title: title.trim(), body: body.trim(), expiresAt}).subscribe({
            next: (created) => {
                this.news.update((list) => [created, ...list ?? []]);
                this.success.set('Avviso pubblicato: lo leggono tutti i pazienti.');
                this.form.reset({ title: '', body: '', expiresAt: addDays(todayIso(), DEFAULT_DAYS)});
                this.bodyValue.set('');
                this.loading.set(false);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.loading.set(false);
            }
        });
    }

    protected askRemove(item: News): void {
        this.confirmingId.set(item.id);
    }

    protected cancelRemove(): void {
        this.confirmingId.set(null);
    }

    protected remove(item: News): void {
        this.busyId.set(item.id);
        this.error.set(null);
        this.newsService.delete(item.id).subscribe({
            next: () => {
                this.busyId.set(null);
                this.confirmingId.set(null);
                this.success.set('Avviso tolto.');
                this.news.update((list => (list ?? []).filter((x) => x.id !== item.id)));
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.busyId.set(null);
                this.confirmingId.set(null);
            }
        });
    }
    
}