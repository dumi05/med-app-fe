import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateMedicalReportRequest, MedicalReport } from "./medical-report.model";
import { API_BASE } from "../api";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class MedicalReportService {
    private readonly http = inject(HttpClient);

    createReport(request: CreateMedicalReportRequest, file: File | null = null): Observable<MedicalReport> {
        const body = new FormData();
        body.append('report', new Blob([JSON.stringify(request)], { type: 'application/json'}));
        if(file !== null) {
            body.append('file', file, file.name);
        }
        return this.http.post<MedicalReport>(`${API_BASE}/medical-reports`, body);
    }

    getReportByAppointment(appointmentId: number): Observable<MedicalReport> {
        const params = new HttpParams().set('appointmentId', appointmentId);
        return this.http.get<MedicalReport>(`${API_BASE}/medical-reports`, { params });
    }

    downloadAttachment(reportId: number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_BASE}/medical-reports/${reportId}/attachment`, {responseType: 'blob', observe: 'response'});
    }
}