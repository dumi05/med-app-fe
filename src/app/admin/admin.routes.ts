import { Routes } from "@angular/router";

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./admin-home/admin-home')
                                .then((m => m.AdminHome)),
    },
    {
        path: 'doctors',
        loadComponent: () => import('./doctors/doctors').then((m) => m.Doctors)
    }
];