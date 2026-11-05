import { addDays } from "../calendar/calendar-grid";
import { ApiError } from "../http/api-error";
import { userMessage } from "../http/error-messages";
import { DoctorLeave, MAX_LEAVE_DAYS } from "./leave.model";

export function leaveProblem(startDate: string, endDate: string, today: string): string | null {
    if(startDate === '' || endDate === ''){
        return 'Scegli il primo e l\'ultimo giorno di assenza.';
    }
    if(endDate < startDate){
        return 'L\'ultimo giorno non può precedere il primo.';
    }
    if(endDate < today){
        return 'L\'assenza non può essere già finita.';
    }
    if(endDate > addDays(startDate, MAX_LEAVE_DAYS - 1)){
        return `Un'assenza può durare al massimo ${MAX_LEAVE_DAYS} giorni.`;
    }
    return null;
}

export function isAway(leaves: DoctorLeave[], day: string): boolean {
    return leaves.some((leave) => leave.startDate <= day && day <= leave.endDate);
}

export function leaveMessage(error: ApiError): string {
    return error.code === 'INVALID_ARGUMENT' && error.message ? error.message : userMessage(error);
}