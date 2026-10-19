import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PriceListEntry } from "./price-list.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class PriceListService {
    private readonly http = inject(HttpClient);

    getAll(): Observable<PriceListEntry[]> {
        return this.http.get<PriceListEntry[]>(`${API_BASE}/price-list`);
    }

    updatePrice(id: number, price: number): Observable<PriceListEntry> {
        return this.http.put<PriceListEntry>(`${API_BASE}/price-list/${id}`, {price});
    }
}