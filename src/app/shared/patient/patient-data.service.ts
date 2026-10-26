import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PatientDataExport } from "./patient-data.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class PatientDataService {
    private readonly http = inject(HttpClient);

    exportMyData(): Observable<PatientDataExport> {
        return this.http.get<PatientDataExport>(`${API_BASE}/patients/me/export`);
    }

    anonymizeMe(): Observable<void> {
        return this.http.post<void>(`${API_BASE}/patients/me/anonymize`, null);
    }
}