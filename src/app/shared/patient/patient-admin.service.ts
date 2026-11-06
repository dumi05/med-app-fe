import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PatientAdmin } from "./patient-admin.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class PatientAdminService {
    private readonly http = inject(HttpClient);

    getAll(): Observable<PatientAdmin[]>{
        return this.http.get<PatientAdmin[]>(`${API_BASE}/patients`);
    }

    forcePasswordChange(id: number): Observable<PatientAdmin> {
        return this.http.post<PatientAdmin>(`${API_BASE}/patients/${id}/force-password-change`, null);
    }
}