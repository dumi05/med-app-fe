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
    },
    {
        path: 'appointments',
        loadComponent: () => import('./appointments/patient-appointments/patient-appointments')
                                .then((m) => m.PatientAppointments)
    },
    {
        path: 'appointments/:appointmentId/report',
        loadComponent: () => import('../shared/report/appointment-report/appointment-report')
                                .then((m) => m.AppointmentReport)
    },
    {
        path: 'report-delegations',
        loadComponent: () => import('./report-delegations/report-delegations').then((m) => m.ReportDelegations),
    },
    {
        path: 'privacy',
        loadComponent: () => import('./privacy/my-data').then((m) => m.MyData),
    }
];