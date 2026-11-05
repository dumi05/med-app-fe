export type LeaveOutcome = 'REASSIGN' | 'CANCEL';

export interface AffectedAppointment {
    id: number;
    startTime: string;
    patientFirstName: string;
    patientLastName: string;
    outcome: LeaveOutcome;
}

export interface LeavePreview {
    daysOfNotice: number;
    shortNotice: boolean;
    appointments: AffectedAppointment[];
    reassign: number;
    cancel: number;
    newsTitle: string;
    newsBody: string;
}

export interface DoctorLeave {
    id: number;
    doctorId: number;
    startDate: string;
    endDate: string;
    replacementDoctorId: number | null;
    replacementDoctorName: string | null;
}

export interface LeaveResult {
    id: number;
    cancelled: number;
    reassigned: number;
}

export interface LeaveRequest {
    doctorId?: number;
    startDate: string;
    endDate: string;
    replacementDoctorId?: number;
}

export const MAX_LEAVE_DAYS = 90;