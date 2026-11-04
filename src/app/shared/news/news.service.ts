import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateNewsRequest, News } from "./news.model";
import { API_BASE } from "../api";

@Injectable({ providedIn: 'root' })
export class NewsService {
    private readonly http = inject(HttpClient);

    getActive(): Observable<News[]> {
        return this.http.get<News[]>(`${API_BASE}/news`);
    }

    getMine(): Observable<News[]> {
        return this.http.get<News[]>(`${API_BASE}/news/me`);
    }

    create(request: CreateNewsRequest): Observable<News> {
        return this.http.post<News>(`${API_BASE}/news`, request);
    }

    delete(id: number): Observable<void>{
        return this.http.delete<void>(`${API_BASE}/news/${id}`);
    }

}