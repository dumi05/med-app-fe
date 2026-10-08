import { Routes } from "@angular/router";

export const DOCTOR_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./doctor-home/doctor-home')
                                .then((m => m.DoctorHome)),
    }
];