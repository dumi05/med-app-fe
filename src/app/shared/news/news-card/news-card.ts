import { DatePipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { NewsService } from "../news.service";
import { AuthService } from "../../auth/auth.service";
import { News } from "../news.model";
import { formatDate } from "../../format/format";
import { ApiError } from "../../http/api-error";
import { userMessage } from "../../http/error-messages";

@Component({
    selector: 'app-news-card',
    imports: [DatePipe],
    templateUrl: './news-card.html'
})
export class NewsCard implements OnInit {
    
    private readonly service = inject(NewsService);

    protected readonly canRemove = inject(AuthService).role() === 'ADMIN';
    protected readonly news = signal<News[] | null>(null);
    protected readonly error = signal<string | null>(null);
    protected readonly confirmingId = signal<number | null>(null);
    protected readonly busyId = signal<number | null>(null);
    protected readonly formatDate = formatDate;

    ngOnInit(): void {
        this.service.getActive().subscribe({
            next: (created) => this.news.set(created),
            error: (err: ApiError) => this.error.set(userMessage(err))
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
        this.service.delete(item.id).subscribe({
            next: () => {
                this.news.update((list) => (list ?? []).filter((x) => x.id !== item.id));
                this.confirmingId.set(null);
                this.busyId.set(null);
            },
            error: (err: ApiError) => {
                this.error.set(userMessage(err));
                this.busyId.set(null);
                this.confirmingId.set(null);
            }
        });
    }
    
}