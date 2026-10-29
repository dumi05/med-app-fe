import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AvailabilityQuery, BulkSlotRequest, Slot } from "./slot.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class ScheduleService {
    private readonly http = inject(HttpClient);

    searchAvailability(query: AvailabilityQuery): Observable<Slot[]> {
        let params = new HttpParams()
                        .set('specializationId', query.specializationId)
                        .set('from', query.from)
                        .set('to', query.to);
        if(query.doctorId !== undefined){
            params = params.set('doctorId', query.doctorId);
        }
        return this.http.get<Slot[]>(`${API_BASE}/schedule/availability`, { params });
    }

        /** All the slots of the logged doctor, free and booked. */
    getMySlots(from: string, to: string): Observable<Slot[]> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<Slot[]>(`${API_BASE}/schedule/slots/me`, { params });
    }

    createSlots(request: BulkSlotRequest): Observable<Slot[]> {
        return this.http.post<Slot[]>(`${API_BASE}/schedule/slots/bulk`, request);
    }
}