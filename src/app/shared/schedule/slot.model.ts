export interface Slot {
    id: number;
    doctorId: number;
    doctorFirstName: string;
    doctorLastName: string;
    startTime: string;
    durationMinutes: number;
    booked: boolean
}

export interface CreateSlotRequest {
    doctorId?: number;
    startTime: string;
    durationMinutes: number;
}

export interface BulkSlotRequest {
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