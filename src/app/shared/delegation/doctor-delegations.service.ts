import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CreateDoctorDelegationRequest, DoctorDelegation } from "./doctor-delegations.model";
import { Observable } from "rxjs";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class DoctorDelegationService {
    private readonly http = inject(HttpClient);

    propose(request: CreateDoctorDelegationRequest): Observable<DoctorDelegation>{
        return this.http.post<DoctorDelegation>(`${API_BASE}/doctor-delegations`, request);
    }

    accept(id: number): Observable<DoctorDelegation> {
        return this.http.post<DoctorDelegation>(`${API_BASE}/doctor-delegations/${id}/accept`, null);
    }
    
    reject(id: number): Observable<DoctorDelegation> {
        return this.http.post<DoctorDelegation>(`${API_BASE}/doctor-delegations/${id}/reject`, null);
    }

    getMine(): Observable<DoctorDelegation[]> {
        return this.http.get<DoctorDelegation[]>(`${API_BASE}/doctor-delegations/me`);
    }
}