import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DaySummary, MonthCalendar } from './month-calendar';

@Component({
  imports: [MonthCalendar],
  template: `
    <app-month-calendar [month]="month()" [summaries]="summaries()" [selectedDay]="selectedDay()"
                        [minDay]="minDay()" [onlyDaysWithSlots]="onlyDaysWithSlots()"
                        (monthChange)="months.push($event)" (daySelect)="days.push($event)" />
  `,
})
class HostComponent {
  month = signal('2026-11');
  summaries = signal<Record<string, DaySummary>>({});
  selectedDay = signal<string | null>(null);
  minDay = signal<string | null>(null);
  onlyDaysWithSlots = signal(false);
  months: number[] = [];
  days: string[] = [];
}

describe('MonthCalendar', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = () => fixture.nativeElement as HTMLElement;
  const day = (iso: string) => element().querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement;
  const refresh = () => fixture.detectChanges();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    refresh();
  });

  it('shows the name of the month and the days, Monday first', () => {
    expect(element().querySelector('.month-title')?.textContent).toContain('novembre 2026');
    expect(Array.from(element().querySelectorAll('th')).map((th) => th.textContent!.trim()))
      .toEqual(['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom']);
    expect(element().querySelectorAll('.day-button').length).toBe(30);
  });

  it('writes the free and the booked slots of a day, and nothing on the days without slots', () => {
    host.summaries.set({ '2026-11-03': { free: 4, booked: 2 }, '2026-11-04': { free: 1, booked: 0 } });
    refresh();

    expect(day('2026-11-03').querySelector('.free-badge')?.textContent).toBe('4');
    expect(day('2026-11-03').querySelector('.booked-badge')?.textContent).toBe('2');
    expect(day('2026-11-04').querySelector('.free-badge')?.textContent).toBe('1');
    expect(day('2026-11-04').querySelector('.booked-badge')).toBeNull();
    expect(day('2026-11-05').querySelector('.badge')).toBeNull();
  });

  it('says in words, for the screen readers, what a day holds', () => {
    host.summaries.set({ '2026-11-03': { free: 4, booked: 1 } });
    refresh();

    expect(day('2026-11-03').getAttribute('aria-label')).toBe('martedì 3 novembre, 4 posti liberi, 1 prenotato');
  });

  it('says which day it was pressed on', () => {
    day('2026-11-10').click();

    expect(host.days).toEqual(['2026-11-10']);
  });

  it('marks the selected day', () => {
    host.selectedDay.set('2026-11-10');
    refresh();

    expect(day('2026-11-10').getAttribute('aria-pressed')).toBe('true');
    expect(day('2026-11-11').getAttribute('aria-pressed')).toBe('false');
  });

  it('asks to move to the previous and to the next month, and moves nowhere on its own', () => {
    (element().querySelector('.next-month') as HTMLButtonElement).click();
    (element().querySelector('.prev-month') as HTMLButtonElement).click();

    expect(host.months).toEqual([1, -1]);
    expect(element().querySelector('.month-title')?.textContent).toContain('novembre 2026');
  });

  describe('with a first selectable day', () => {
    beforeEach(() => {
      host.minDay.set('2026-11-10');
      refresh();
    });

    it('switches off the days before it', () => {
      expect(day('2026-11-09').disabled).toBeTrue();
      expect(day('2026-11-10').disabled).toBeFalse();
    });

    it('does not let the user go back before the month of that day', () => {
      expect((element().querySelector('.prev-month') as HTMLButtonElement).disabled).toBeTrue();

      host.month.set('2026-12');
      refresh();

      expect((element().querySelector('.prev-month') as HTMLButtonElement).disabled).toBeFalse();
    });
  });

  describe('when only the days with slots can be pressed', () => {
    beforeEach(() => {
      host.onlyDaysWithSlots.set(true);
      host.summaries.set({ '2026-11-03': { free: 2, booked: 0 } });
      refresh();
    });

    it('switches off the days without slots', () => {
      expect(day('2026-11-03').disabled).toBeFalse();
      expect(day('2026-11-04').disabled).toBeTrue();
    });
  });

  it('lets the user press any day when nothing is restricted (a doctor opening a new day)', () => {
    expect(day('2026-11-04').disabled).toBeFalse();
  });
});