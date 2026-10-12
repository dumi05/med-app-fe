import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE } from "../api";
import { CreateDoctorRequest, Doctor, DoctorAdmin } from "./doctor.model";

@Injectable({ providedIn: 'root' })
export class DoctorService {
    private readonly http = inject(HttpClient);
    
    getAllDoctors(): Observable<Doctor[]>{
        return this.http.get<Doctor[]>(`${API_BASE}/doctors`);
    }

    createDoctor(request: CreateDoctorRequest): Observable<DoctorAdmin> {
        return this.http.post<DoctorAdmin>(`${API_BASE}/doctors`, request);
    }
}