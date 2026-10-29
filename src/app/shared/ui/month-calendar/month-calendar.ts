import { Component, computed, input, output } from "@angular/core";
import { buildMonthGrid, dayLabel, monthLabel, monthOf, WEEKDAY_LABELS } from "../../calendar/calendar-grid";

export interface DaySummary {
    free: number;
    booked: number;
}

@Component({
    selector: 'app-month-calendar',
    templateUrl: './month-calendar.html'
})
export class MonthCalendar {
    readonly month = input.required<string>();
    readonly summaries = input<Record<string, DaySummary>>({});
    readonly selectedDay = input<string | null>(null);
    readonly minDay = input<string | null>(null);
    readonly onlyDaysWithSlots = input(false);
    
    readonly monthChange = output<number>();
    readonly daySelect = output<string>();

    protected readonly weekDays = WEEKDAY_LABELS;
    protected readonly weeks = computed(() => buildMonthGrid(this.month()));
    protected readonly title = computed(() => monthLabel(this.month()));

    protected readonly canGoBack = computed(() => {
        const min = this.minDay();
        return min === null || this.month() > monthOf(min);
    });

    protected summary(day: string): DaySummary {
        return this.summaries()[day] ?? { free: 0, booked: 0};
    }

    protected isDisabled(day: string): boolean {
        const min = this.minDay();
        if(min !== null && day < min) {
            return true;
        }
        const summary = this.summary(day);
        return this.onlyDaysWithSlots() && summary.free + summary.booked === 0;
    }

    protected dayNumber(day: string): number {
        return Number(day.slice(8,10));
    }

    protected ariaLabel (day: string): string {
        const { free, booked } = this.summary(day);
        const parts = [dayLabel(day)];
        if(free > 0) {
            parts.push(free === 1 ? '1 posto libero' : `${free} posti liberi`);
        }
        if(booked > 0) {
            parts.push(booked === 1 ? '1 prenotato' : `${booked} prenotati`);
        }
        return parts.join(', ');
    }
}