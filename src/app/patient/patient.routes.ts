import { Routes } from "@angular/router";

export const PATIENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./patient-home/patient-home')
                                .then((m => m.PatientHome)),
    },
    {
        path: 'availability',
        loadComponent: () => import('./availability/availability')
                                .then((m) => m.Availability),
    }
];