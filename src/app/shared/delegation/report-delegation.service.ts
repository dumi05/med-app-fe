import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { AccessGrant, CreateReportDelegationRequest, ReportDelegation, SharedMedicalReport } from "./report-delegation.model";
import { Observable } from "rxjs";
import { API_BASE } from "../api";

export const DELEGATION_ACCESS_HEADER = 'X-Delegation-Access'; 

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

    unlock(token: string, code: string): Observable<AccessGrant> {
        return this.http.post<AccessGrant>(
            `${API_BASE}/report-delegations/${encodeURIComponent(token)}/access`,
            { code }
        );
    }

    getSharedReports(token: string, accessToken: string): Observable<SharedMedicalReport[]> {
        return this.http.get<SharedMedicalReport[]>
                (`${API_BASE}/report-delegations/${encodeURIComponent(token)}/medical-reports`, 
                    { headers: this.accessHeaders(accessToken) });
    }

    downloadSharedAttachment(token: string, reportId: number, accessToken: string): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_BASE}/report-delegations/${encodeURIComponent(token)}/medical-reports/${reportId}/attachment`,
                    { responseType: 'blob', observe: 'response', headers: this.accessHeaders(accessToken) });
    }

    private accessHeaders(accessToken: string): HttpHeaders {
        return new HttpHeaders({ [DELEGATION_ACCESS_HEADER]: accessToken });
    }
}