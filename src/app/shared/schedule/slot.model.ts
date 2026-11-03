export interface Slot {
    id: number;
    doctorId: number;
    doctorFirstName: string;
    doctorLastName: string;
    startTime: string;
    durationMinutes: number;
    booked: boolean;
    price: number;
}

export interface CreateSlotRequest {
    doctorId?: number;
    startTime: string;
    durationMinutes: number;
}

export interface BulkSlotRequest {
    doctorId?: number;
    date: string;
    startTime: string;
    endTime: string;
    slotMinutes: number;
}

export interface AvailabilityQuery {
    specializationId: number;
    doctorId?: number;
    from: string;
    to: string;
}