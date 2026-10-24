import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateReportDelegationRequest, ReportDelegation, SharedMedicalReport } from "./report-delegation.model";
import { Observable } from "rxjs";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class ReportDelegationService {
    private readonly http = inject(HttpClient);

    create(request: CreateReportDelegationRequest): Observable<ReportDelegation> {
        return this.http.post<ReportDelegation>(`${API_BASE}/report-delegations`, request);
    }

    getMine(): Observable<ReportDelegation[]> {
        return this.http.get<ReportDelegation[]>(`${API_BASE}/report-delegations/me`);
    }

    revoke(id: number): Observable<ReportDelegation> {
        return this.http.post<ReportDelegation>(`${API_BASE}/report-delegations/${id}/revoke`, null);
    }

    getSharedReports(token: string): Observable<SharedMedicalReport[]> {
        return this.http.get<SharedMedicalReport[]>(`${API_BASE}/report-delegations/${encodeURIComponent(token)}/medical-reports`);
    }
}