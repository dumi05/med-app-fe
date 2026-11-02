export interface ReportDelegation {
    id: number;
    delegateName: string;
    delegateEmail: string;
    token: string;
    includeAttachments: boolean;
    expiresAt: string | null;
    revoked: boolean;
    active: boolean;
    hasAccessCode: boolean;
    accessCode: string | null;
    createdAt: string;
}

export interface CreateReportDelegationRequest {
    delegateName: string;
    delegateEmail: string;
    expiresAt: string | null;
    includeAttachments: boolean;
}

export interface AccessGrant {
    accessToken: string;
    expiresInSeconds: number;
}

export interface SharedMedicalReport {
    id: number;
    visitDate: string;
    doctorFirstName: string;
    doctorLastName: string;
    specialization: string;
    diagnosisText: string;
    attachmentAvailable: string | null;
    completedAt: string;
}