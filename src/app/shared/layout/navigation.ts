import { Role } from "../auth/auth.model";

export interface NavItem {
    label: string;
    path: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
    PATIENT: [
        { label: 'Home', path: '/patient'}, 
        { label: 'Disponibilità', path: '/patient/availability'}, 
        { label: 'Le mie prenotazioni', path: '/patient/appointments'}
    ],
    DOCTOR: [
        { label: 'Home', path: '/doctor'}, 
        { label: 'Agenda', path: '/doctor/schedule'}, 
        {label: 'Le mie visite', path: '/doctor/visits'},
        { label: 'Deleghe', path: '/doctor/delegations'}
    ],
    ADMIN: [
        { label: 'Home', path: '/admin'}, 
        { label: 'Medici', path: '/admin/doctors' }, 
        { label: 'Dashboard', path: '/admin/dashboard'},
        { label: 'Listino', path: '/admin/price-list'}
    ]
};

export function navItemsFor(role: Role | null): NavItem[] {
    return role == null ? [] : NAV_ITEMS[role];
}