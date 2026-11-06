export interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    specializationId: number;
    specialization: string;
}

export interface DoctorAdmin extends Doctor {
    email: string;
    delegationConsent: boolean;
    active: boolean;
    mustChangePassword: boolean;
}

export interface CreateDoctorRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    specializationId: number;
    delegationConsent: boolean;
}

export interface UpdateDoctorRequest {
    firstName: string;
    lastName: string;
    specializationId: number;
    delegationConsent: boolean;
}