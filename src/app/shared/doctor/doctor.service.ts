import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE } from "../api";
import { CreateDoctorRequest, Doctor, DoctorAdmin, UpdateDoctorRequest } from "./doctor.model";

@Injectable({ providedIn: 'root' })
export class DoctorService {
    private readonly http = inject(HttpClient);
    
    getAllDoctors(): Observable<DoctorAdmin[]>{
        return this.http.get<DoctorAdmin[]>(`${API_BASE}/doctors`);
    }

    createDoctor(request: CreateDoctorRequest): Observable<DoctorAdmin> {
        return this.http.post<DoctorAdmin>(`${API_BASE}/doctors`, request);
    }

    getAllDoctorsForAdmin(): Observable<DoctorAdmin[]>{
        return this.http.get<DoctorAdmin[]>(`${API_BASE}/doctors/admin`);
    }

    updateDoctor(id: number, request: UpdateDoctorRequest): Observable<DoctorAdmin> {
        return this.http.put<DoctorAdmin>(`${API_BASE}/doctors/${id}`, request);
    }

    deactivateDoctor(id: number): Observable<DoctorAdmin> {
        return this.http.post<DoctorAdmin>(`${API_BASE}/doctors/${id}/deactivate`, null);
    }

    activateDoctor(id: number): Observable<DoctorAdmin> {
        return this.http.post<DoctorAdmin>(`${API_BASE}/doctors/${id}/activate`, null);
    }
}