import { Component, input } from "@angular/core";

@Component({
    selector: 'app-submit-button',
    template: `
        <button type="submit" 
                class="btn btn-primary w-100" 
                [disabled]="loading()">{{ label() }}</button>`,
})
export class SubmitButton {
    readonly label = input.required<string>();
    readonly loading = input(false);
}