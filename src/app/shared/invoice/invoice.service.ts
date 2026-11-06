import { HttpClient, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Invoice } from "./invoice.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private readonly http = inject(HttpClient);

    issue(appointmentId: number): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_BASE}/appointments/${appointmentId}/invoice`, {});
    }

    download(appointmentId: number): Observable<HttpResponse<Blob>> {
        return this.http.get(`${API_BASE}/appointments/${appointmentId}/invoice/pdf`, {responseType: 'blob', observe: 'response'});
    }
}