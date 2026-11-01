import { Role } from "../auth/auth.model";

export interface NavItem {
    label: string;
    path: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
    PATIENT: [
        { label: 'Home', path: '/patient'}, 
        { label: 'Disponibilità', path: '/patient/availability'}, 
        { label: 'Le mie prenotazioni', path: '/patient/appointments'},
        { label: 'Deleghe referti', path: '/patient/report-delegations'},
        { label: 'I miei dati', path: '/patient/privacy'}
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

export const ACCOUNT_ITEM: NavItem = { label: 'Cambia password', path: '/account/password'};

export function navItemsFor(role: Role | null, mustchangePassword = false): NavItem[] {
    if(role === null){
        return [];
    }
    return mustchangePassword ? [ACCOUNT_ITEM] : [...NAV_ITEMS[role], ACCOUNT_ITEM];
}