import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-stat-card',
    imports: [RouterLink],
    template: `
        <div class="card h-100">
            <div class="card-body">
                <div class="text-muted small">{{ label() }}</div>
                <div class="h3 mb-0 stat-value">{{ value() }}</div>
                @if (hint(); as text) {
                <div class="small text-muted stat-hint">{{ text }}</div>
                }
                @if (link(); as target) {
                <a class="small stretched-link stat-link" [routerLink]="target">{{ linkLabel() }}</a>
                }
            </div>
        </div>
    `,
})
export class StatCard {
    readonly label = input.required<string>();
    readonly value = input.required<string | number>();
    readonly hint = input<string | null>();
    readonly link = input<string | null>();
    readonly linkLabel = input('Apri');
}