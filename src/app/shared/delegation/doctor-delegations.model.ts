export type DelegationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

export interface DoctorDelegation {
    id: number;
    delegatingDoctorId: number;
    delegatingDoctorFirstName: string;
    delegatingDoctorLastName: string;
    delegateDoctorId: number;
    delegateDoctorFirstName: string;
    delegateDoctorLastName: string;
    startDate: string;
    endDate: string;
    status: DelegationStatus;
}

export interface CreateDoctorDelegationRequest {
    delegateDoctorId: number;
    startDate: string;
    endDate: string;
}