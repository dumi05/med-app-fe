import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Appointment, CreateAppointmentRequest } from "./appointment.model";
import { API_BASE } from "../api";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private readonly http = inject(HttpClient);

    createAppointment(slotId: number): Observable<Appointment> {
        const request: CreateAppointmentRequest = { slotId };
        return this.http.post<Appointment>(`${API_BASE}/appointments`, request);
    }

    cancelAppointment(id: number): Observable<Appointment> {
        return this.http.post<Appointment>(`${API_BASE}/appointments/${id}/cancel`, {});
    }

    getMyAppointments(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${API_BASE}/appointments/me`);
    }
}