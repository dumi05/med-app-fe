import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertMessage } from './alert-message';

describe('AlertMessage', () => {
  let fixture: ComponentFixture<AlertMessage>;
  const element = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AlertMessage] }).compileComponents();
    fixture = TestBed.createComponent(AlertMessage);
  });

  it('shows nothing without a message', () => {
    fixture.detectChanges();
    expect(element().querySelector('.alert')).toBeNull();
  });

  it('shows the message as an error by default', () => {
    fixture.componentRef.setInput('message', 'Qualcosa è andato storto.');
    fixture.detectChanges();
    const alert = element().querySelector('.alert') as HTMLElement;
    expect(alert.textContent).toContain('Qualcosa è andato storto.');
    expect(alert.classList.contains('alert-danger')).toBeTrue();
  });

  it('uses the requested type', () => {
    fixture.componentRef.setInput('message', 'Salvato.');
    fixture.componentRef.setInput('type', 'success');
    fixture.detectChanges();
    expect(element().querySelector('.alert-success')).not.toBeNull();
  });
});