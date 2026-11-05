import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DoctorLeave, LeavePreview, LeaveRequest, LeaveResult } from "./leave.model";
import { Observable } from "rxjs";
import { API_BASE } from "../api";

@Injectable({providedIn:'root'})
export class LeaveService {
    private readonly http = inject(HttpClient);

    preview(request: LeaveRequest): Observable<LeavePreview>{
        let params = new HttpParams().set('startDate', request.startDate).set('endDate', request.endDate);
        if(request.doctorId !== undefined){
            params = params.set("doctorId", request.doctorId);
        }
        if(request.replacementDoctorId !== undefined){
            params = params.set('replacementDoctorId', request.replacementDoctorId);
        }
        return this.http.get<LeavePreview>(`${API_BASE}/doctor-leaves/preview`, {params});
    }

    create(request: LeaveRequest): Observable<LeaveResult> {
        return this.http.post<LeaveResult>(`${API_BASE}/doctor-leaves`, request);
    }

    getUpcoming(doctorId?: number): Observable<DoctorLeave[]>{
        const params = doctorId === undefined ? new HttpParams() : new HttpParams().set('doctorId',doctorId);
        return this.http.get<DoctorLeave[]>(`${API_BASE}/doctor-leaves`, { params });
    }

    cancel(id: number): Observable<void> {
        return this.http.delete<void>(`${API_BASE}/doctor-leaves/${id}`);
    }

}