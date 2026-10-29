import { Time } from "@angular/common";

export interface TimedSlot {
    startTime: string;
    durationMinutes: number; 
}

const pad = (n: number) => String(n).padStart(2, '0');

export function dayOf(startTime: string): string {
    return startTime.slice(0,10);
}

export function timeOf(startTime: string): string {
    return startTime.slice(11,16);
}

const start = (slot: TimedSlot) => Date.parse(slot.startTime);
const end = (slot: TimedSlot) => start(slot) + slot.durationMinutes * 60_000;

export function endTimeOf(slot: TimedSlot): string {
    const date = new Date(end(slot));
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function timeRange(slot: TimedSlot): string {
    return `${timeOf(slot.startTime)}–${endTimeOf(slot)}`;
}

export function slotsOverlap(a: TimedSlot, b: TimedSlot): boolean {
    return start(a) < end(b) && end(a) > start(b); 
}