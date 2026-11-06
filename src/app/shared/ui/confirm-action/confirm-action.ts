import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-confirm-action',
  templateUrl: './confirm-action.html'
})
export class ConfirmAction {
  readonly label = input.required<string>();
  readonly confirmLabel = input('Conferma');
  readonly buttonStyle = input('btn-outline-primary');
  readonly busy = input(false);
  readonly confirmed = output<void>();

  protected readonly asking = signal(false);

  protected confirm(): void {
    this.asking.set(false);
    this.confirmed.emit();
  }
}
