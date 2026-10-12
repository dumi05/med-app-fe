import { Component, input } from "@angular/core";

@Component({
    selector: 'app-alert-message',
    template: `
        @if (message(); as text) {
        <div class="alert" [class]="'alert alert-' + type()" role="alert">{{ text }}</div>
        }
    `,
})
export class AlertMessage {
    readonly message = input<string | null>(null);
    readonly type = input<'danger' | 'success' | 'warning' | 'info'>('danger');
}