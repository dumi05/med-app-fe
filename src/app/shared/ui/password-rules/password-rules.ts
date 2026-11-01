import { Component, input } from "@angular/core";
import { PasswordCheck } from "../../validation/password-checks";

@Component({
    selector: 'app-password-rules',
    template: `
        <ul class="list-unstyled small mb-3 password-rules" aria-live="polite">
            @for (check of checks(); track check.id) {
                <li [class]="stateClass(check)">
                    <span aria-hidden="true">{{ icon(check) }}</span> {{ check.label }}
                    @if (started()) {
                        <span class="visually-hidden">{{ check.ok ? ' (rispettata)' : ' (non rispettata)' }}</span>
                    }
                </li>
            }
        </ul>
    `,
})
export class PasswordRules {
    readonly checks = input.required<PasswordCheck[]>();
    readonly started = input(false);

    protected stateClass(check: PasswordCheck): string {
        if(!this.started()) {
            return 'text-muted';
        }
        return check.ok ? 'text-success' : 'text-danger';
    }

    protected icon(check: PasswordCheck): string {
        if(!this.started()){
            return '○';
        }
        return check.ok ? '✓': '✗';    
    }
}