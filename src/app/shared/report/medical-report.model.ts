export interface MedicalReport {
    id: number;
    appointmentId: number;
    diagnosisText: string;
    attachmentUrl: string | null;
    completedAt: string;
}

export interface CreateMedicalReportRequest {
    appointmentId: number;
    diagnosisText: string;
    attachmentUrl?: string;
}