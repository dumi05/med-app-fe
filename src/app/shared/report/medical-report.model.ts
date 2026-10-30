export interface MedicalReport {
    id: number;
    appointmentId: number;
    diagnosisText: string;
    attachment: AttachmentInfo | null;
    completedAt: string;
}

export interface CreateMedicalReportRequest {
    appointmentId: number;
    diagnosisText: string;
    attachmentUrl?: string;
}

export interface AttachmentInfo {
    contentType: string;
    sizeBytes: number;
}