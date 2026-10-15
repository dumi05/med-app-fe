import { Component, computed, input } from "@angular/core"
import { AppointmentStatus } from "../appointment/appointment.model";

const STATUS_VIEW: Record<AppointmentStatus, {label: string; style: string}> = {
    BOOKED: {label: 'Prenotata', style: 'text-bg-primary'},
    CANCELLED: {label: 'Cancellata', style: 'text-bg-secondary'},
    COMPLETED: {label: 'Visita effettuata', style: 'text-bg-info'},
    INVOICED: {label: 'Referto disponibile', style: 'text-bg-success'},
    REPORTED: {label: 'Referto disponibile', style: 'text-bg-success'}
};

@Component({
    selector: 'app-status-badge',
    template:  `<span class="badge" [class]="view().style">{{ view().label }}</span>`, 
})
export class StatusBadge {
    readonly status = input.required<AppointmentStatus>();
    protected readonly view = computed(() => STATUS_VIEW[this.status()]);
}