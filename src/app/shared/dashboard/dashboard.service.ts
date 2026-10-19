import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { DashboardKpi } from "./dashboard.model";
import { API_BASE } from "../api";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly http = inject(HttpClient);

    getKpi(): Observable<DashboardKpi> {
        return this.http.get<DashboardKpi>(`${API_BASE}/dashboard/kpi`);
    }
}