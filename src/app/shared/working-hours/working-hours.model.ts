export type DayKey = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export const WORKING_DAYS: { key: DayKey;  label: string} [] = [
    { key: 'MONDAY', label: 'Lunedì'},
    { key: 'TUESDAY', label: 'Martedì'},
    { key: 'WEDNESDAY', label: 'Mercoledì'},
    { key: 'THURSDAY', label: 'Giovedì'},
    { key: 'FRIDAY', label: 'Venerdì'},
    { key: 'SATURDAY', label: 'Sabato'},
];

export interface Band {
    dayOfWeek: DayKey;
    startTime: string;
    endTime: string;
}

export interface WorkingHoursResponse {
    doctorId: number | null;
    bands: Band[];
    createdSlots: number;
    removedSlots: number;
}

export interface UpdateWorkingHoursRequest {
    doctorId?: number;
    bands: Band[];
}