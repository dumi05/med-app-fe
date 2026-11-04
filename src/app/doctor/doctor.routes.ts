import { Routes } from "@angular/router";

export const DOCTOR_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./doctor-home/doctor-home')
                                .then((m => m.DoctorHome)),
    },
    {
        path: 'schedule',
        loadComponent: () => import('./schedule/doctor-schedule')
                                .then((m) => m.DoctorSchedule),
    },
    {
        path: 'visits',
        loadComponent: () => import('./visits/doctor-visits/doctor-visits')
                                .then((m) => m.DoctorVisits),
    },
    {
        path: 'visits/:appointmentId/report',
        loadComponent: () => import('../shared/report/appointment-report/appointment-report')
                                .then((m) => m.AppointmentReport),
    },
    {
        path: 'news',
        loadComponent: () => import('./news/doctor-news').then((m) => m.DoctorNews)
    },
    {
        path: 'hours',
        loadComponent: () => import('../shared/working-hours/working-hours-page/working-hours-page')
                                .then((m) => m.WorkingHoursPage),
    },
    {
        path: 'book',
        loadComponent: () => import('../shared/booking/book-for-patient/book-for-patient')
                                .then((m) => m.BookForPatient),
    },
    {
        path: 'delegations',
        loadComponent: () => import('./delegations/doctor-delegations')
                                .then((m) => m.DoctorDelegations),
    }
];