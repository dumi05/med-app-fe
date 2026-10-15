import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicalReport } from '../medical-report.model';
import { ReportCard } from './report-card';

const REPORT: MedicalReport = {
  id: 3, appointmentId: 5, diagnosisText: 'Nessun rilievo.\nControllo tra 6 mesi.',
  attachmentUrl: null, completedAt: '2026-10-20T09:45:00',
};

describe('ReportCard', () => {
  let fixture: ComponentFixture<ReportCard>;
  const element = () => fixture.nativeElement as HTMLElement;

  const show = (report: MedicalReport) => {
    fixture.componentRef.setInput('report', report);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReportCard] }).compileComponents();
    fixture = TestBed.createComponent(ReportCard);
  });

  it('shows the diagnosis and the date', () => {
    show(REPORT);
    expect(element().textContent).toContain('Nessun rilievo.');
    expect(element().textContent).toContain('20/10/2026');
  });

  it('shows the attachment link only when there is one', () => {
    show(REPORT);
    expect(element().querySelector('a')).toBeNull();

    show({ ...REPORT, attachmentUrl: 'https://example.org/referto.pdf' });
    expect(element().querySelector('a')!.getAttribute('href')).toBe('https://example.org/referto.pdf');
  });
});