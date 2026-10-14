import { Slot } from "../schedule/slot.model";

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'REPORTED' | 'INVOICED';

export interface Appointment {
    id: number;
    status: AppointmentStatus;
    slot: Slot;
    patientId: number;
    patientFirstName: string;
    patientLastName: string;
    noShowRisk: boolean | null;
}

export interface CreateAppointmentRequest {
    slotId: number;
}