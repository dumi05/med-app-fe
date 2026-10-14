import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentStatus } from '../appointment/appointment.model';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  let fixture: ComponentFixture<StatusBadge>;

  const badge = () => (fixture.nativeElement as HTMLElement).querySelector('.badge') as HTMLElement;
  const show = (status: AppointmentStatus) => {
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadge] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadge);
  });

  it('shows the Italian label of the status', () => {
    show('BOOKED');
    expect(badge().textContent).toContain('Prenotata');
    show('CANCELLED');
    expect(badge().textContent).toContain('Cancellata');
  });

  it('uses a different style per status', () => {
    show('BOOKED');
    expect(badge().classList.contains('text-bg-primary')).toBeTrue();
    show('CANCELLED');
    expect(badge().classList.contains('text-bg-secondary')).toBeTrue();
  });
});