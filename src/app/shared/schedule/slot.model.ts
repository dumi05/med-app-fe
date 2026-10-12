export interface Slot {
    id: number;
    doctorId: number;
    doctorFirstName: string;
    doctorLastName: string;
    startTime: string;
    durationMinutes: number;
    booked: boolean
}