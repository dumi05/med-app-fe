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
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard)
    },
    {
        path: 'hours',
        loadComponent: () => import('../shared/working-hours/working-hours-page/working-hours-page')
                                .then((m) => m.WorkingHoursPage),
    },
    {
        path: 'leaves',
        loadComponent: () => import('../shared/leaves/leaves-page/leaves-page').then((m) => m.LeavesPage),
    },
    {
        path: 'book',
        loadComponent: () => import('../shared/booking/book-for-patient/book-for-patient').then((m) => m.BookForPatient)
    },
    {
        path: 'specializations',
        loadComponent: () => import('./specializations/specializations').then((m) => m.Specializations)
    },
    {
        path: 'schedule',
        loadComponent: () => import('./schedule/admin-schedule').then((m) => m.AdminSchedule)
    },
    {
        path: 'price-list',
        loadComponent: () => import('./price-list/price-list').then((m) => m.PriceList)
    }
];