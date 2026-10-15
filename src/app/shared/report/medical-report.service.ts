import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateMedicalReportRequest, MedicalReport } from "./medical-report.model";
import { API_BASE } from "../api";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class MedicalReportService {
    private readonly http = inject(HttpClient);

    createReport(request: CreateMedicalReportRequest): Observable<MedicalReport> {
        return this.http.post<MedicalReport>(`${API_BASE}/medical-reports`, request);
    }

    getReportByAppointment(appointmentId: number): Observable<MedicalReport> {
        const params = new HttpParams().set('appointmentId', appointmentId);
        return this.http.get<MedicalReport>(`${API_BASE}/medical-reports`, { params });
    }
}