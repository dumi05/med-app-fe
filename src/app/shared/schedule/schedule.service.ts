import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateSlotRequest, Slot } from "./slot.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class ScheduleService {
    private readonly http = inject(HttpClient);

    searchAvailability(specializationId: number, date: string): Observable<Slot[]> {
        const params = new HttpParams()
                        .set('specializationId', specializationId)
                        .set('date', date);
        return this.http.get<Slot[]>(`${API_BASE}/schedule/availability`, { params });
    }

    createSlot(request: CreateSlotRequest): Observable<Slot> {
        return this.http.post<Slot>(`${API_BASE}/schedule/slot`, request);
    }
}