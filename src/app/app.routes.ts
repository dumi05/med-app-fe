import { Routes } from '@angular/router';
import { roleGuard } from './shared/auth/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./shared/auth/login/login').then((m) => m.Login),
    },
    {
        path: 'register',
        loadComponent: () => import('./shared/auth/register/register').then((m) => m.Register),
    },
    {
        path: 'privacy-notice',
        loadComponent: () => import('./shared/auth/privacy-notice/privacy-notice').then((m) => m.PrivacyNotice),
    },
    {
        path: 'patient',
        canActivate: [roleGuard('PATIENT')],
        loadChildren: () => import('./patient/patient.routes').then((m) => m.PATIENT_ROUTES),
    },
    {
        path: 'doctor',
        canActivate: [roleGuard('DOCTOR')],
        loadChildren: () => import('./doctor/doctor.routes').then((m) => m.DOCTOR_ROUTES),
    },
    {
        path: 'admin',
        canActivate: [roleGuard('ADMIN')],
        loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    },
    { path: '', pathMatch: 'full', redirectTo: 'login'},
    { path: '**', redirectTo: 'login'}
];
