export interface ReportDelegation {
    id: number;
    delegateName: string;
    delegateEmail: string;
    token: string;
    expiresAt: string | null;
    revoked: boolean;
    active: boolean;
    createdAt: string;
}

export interface CreateReportDelegationRequest {
    delegateName: string;
    delegateEmail: string;
    expiresAt: string | null;
}

export interface SharedMedicalReport {
    visitDate: string;
    doctorFirstName: string;
    doctorLastName: string;
    specialization: string;
    diagnosisText: string;
    attachmentUrl: string | null;
    completedAt: string;
}