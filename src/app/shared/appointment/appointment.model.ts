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
    bookedByRole?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    cancellationReason?: 'PATIENT' | 'DOCTOR_ABSENCE' | null;
    reassignedFromName?: string | null;
    reassignedAt: string | null;
}

export interface CreateAppointmentRequest {
    slotId: number;
    patientId?: number;
}

export function changedByAbsence(appointment: Appointment): boolean {
    return (appointment.status === 'BOOKED' && !!appointment.reassignedFromName) 
            || (appointment.status === 'CANCELLED' && appointment.cancellationReason === 'DOCTOR_ABSENCE');
}

export function hasInvoice(status: AppointmentStatus): boolean {
    return status === 'REPORTED' || status === 'INVOICED';
}

export function hasReport(status: AppointmentStatus): boolean {
    return status === 'REPORTED';
}