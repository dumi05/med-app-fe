import { Role } from "../auth/auth.model";

export interface NavItem {
    label: string;
    path: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
    PATIENT: [{ label: 'Home', path: '/patient'}],
    DOCTOR: [{ label: 'Home', path: '/doctor'}],
    ADMIN: [{ label: 'Home', path: '/admin'}, { label: 'Medici', path: '/admin/doctors' }]
};

export function navItemsFor(role: Role | null): NavItem[] {
    return role == null ? [] : NAV_ITEMS[role];
}