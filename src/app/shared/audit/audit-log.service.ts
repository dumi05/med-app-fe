import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuditLogEntry } from "./audit-log.model";
import { API_BASE } from "../api";

@Injectable({
     providedIn: 'root'
})
export class AuditLogService {
    private readonly http = inject(HttpClient);

    getLatest(limit: number): Observable<AuditLogEntry[]> {
        const params = new HttpParams().set('limit', limit);
        return this.http.get<AuditLogEntry[]>(`${API_BASE}/audit-logs`, { params });
    }
}