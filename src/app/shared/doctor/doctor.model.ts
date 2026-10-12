export interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string;
}

export interface DoctorAdmin extends Doctor {
    email: string;
    delegationConsent: boolean;
}

export interface CreateDoctorRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    specializationId: number;
    delegationConsent: boolean;
}