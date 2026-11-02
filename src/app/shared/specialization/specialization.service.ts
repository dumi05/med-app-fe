import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateSpecializationRequest, Specialization } from "./specialization.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class SpecializationService {
    private readonly http = inject(HttpClient);
    getAllSpecializations(): Observable<Specialization[]> {
        return this.http.get<Specialization[]>(`${API_BASE}/specializations`);
    }

    create(request: CreateSpecializationRequest): Observable<Specialization> {
        return this.http.post<Specialization>(`${API_BASE}/specializations`, request);  
    }
}