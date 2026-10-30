export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export interface AuditLogEntry {
    id: number;
    userEmail: string;
    action: string;
    entityName: string;
    entityId: number | null;
    occurredAt: string;
    outcome: AuditOutcome;
    failureReason: string | null;
}