import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmAction } from './confirm-action';

describe('ConfirmAction', () => {
  let fixture: ComponentFixture<ConfirmAction>;
  let confirmations: number;

  const element = () => fixture.nativeElement as HTMLElement;
  const button = (selector: string) => element().querySelector(selector) as HTMLButtonElement;
  const click = (selector: string) => {
    button(selector).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmAction] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmAction);
    fixture.componentRef.setInput('label', 'Elimina');
    confirmations = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmations++);
    fixture.detectChanges();
  });

  it('shows only the button with its label at first', () => {
    expect(button('.confirm-action-ask').textContent).toContain('Elimina');
    expect(element().querySelector('.confirm-action-yes')).toBeNull();
    expect(element().querySelector('.confirm-action-no')).toBeNull();
  });

  it('asks for the confirmation when the button is pressed, and still does nothing', () => {
    click('.confirm-action-ask');

    expect(element().querySelector('.confirm-action-ask')).toBeNull();
    expect(button('.confirm-action-yes').textContent).toContain('Conferma');
    expect(button('.confirm-action-no').textContent).toContain('Annulla');
    expect(confirmations).toBe(0);
  });

  it('goes back to the button, without emitting, when the user cancels', () => {
    click('.confirm-action-ask');
    click('.confirm-action-no');

    expect(element().querySelector('.confirm-action-yes')).toBeNull();
    expect(element().querySelector('.confirm-action-ask')).not.toBeNull();
    expect(confirmations).toBe(0);
  });

  it('emits once when the user confirms, and goes back to the button', () => {
    click('.confirm-action-ask');
    click('.confirm-action-yes');

    expect(confirmations).toBe(1);
    expect(element().querySelector('.confirm-action-yes')).toBeNull();
    expect(element().querySelector('.confirm-action-ask')).not.toBeNull();
  });

  it('uses the given texts and style, and is disabled while busy', () => {
    fixture.componentRef.setInput('buttonStyle', 'btn-outline-danger');
    fixture.componentRef.setInput('confirmLabel', 'Sì, elimina');
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();

    expect(button('.confirm-action-ask').classList).toContain('btn-outline-danger');
    expect(button('.confirm-action-ask').disabled).toBeTrue();

    fixture.componentRef.setInput('busy', false);
    fixture.detectChanges();
    click('.confirm-action-ask');

    expect(button('.confirm-action-yes').textContent).toContain('Sì, elimina');
  });
}); 