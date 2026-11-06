export interface Invoice {
    appointmentId: number;
    number: string;
    amount: number;
    issuedAt: string;
    paidAt: string;
}