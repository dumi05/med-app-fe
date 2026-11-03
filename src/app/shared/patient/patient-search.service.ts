import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE } from "../api";

export interface PatientSummary {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export const MIN_SEARCH_LETTERS = 3;

export function searchIsLongEnough(query: string): boolean {
    return query.replace(/\s+/g, '').length >= MIN_SEARCH_LETTERS;
}

@Injectable({
    providedIn: 'root'
})
export class PatientSearchService {
    private readonly http = inject(HttpClient);

    search(query: string): Observable<PatientSummary[]> {
        return this.http.get<PatientSummary[]>(`${API_BASE}/patients/search`, {params: new HttpParams().set('query', query.trim())});
    }
}