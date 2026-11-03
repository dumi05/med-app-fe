import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Band, UpdateWorkingHoursRequest, WorkingHoursResponse } from "./working-hours.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class WorkingHoursService {
    private readonly http = inject(HttpClient);

    get(doctorId?: number): Observable<WorkingHoursResponse> {
        const params = doctorId == undefined ? new HttpParams() : new HttpParams().set('doctorId', doctorId);
        return this.http.get<WorkingHoursResponse>(`${API_BASE}/schedule/working-hours`, { params });
    }

    replace(bands: Band[], doctorId?: number): Observable<WorkingHoursResponse>{
        const request: UpdateWorkingHoursRequest = doctorId === undefined ? { bands } : { bands, doctorId };
        return this.http.put<WorkingHoursResponse>(`${API_BASE}/schedule/working-hours`, request);
    }
}