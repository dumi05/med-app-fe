export interface Specialization {
    id: number;
    name: string;
}

export interface CreateSpecializationRequest {
    name: string;
    price: number;
}