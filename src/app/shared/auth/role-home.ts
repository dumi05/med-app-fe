import { Role } from "./auth.model";

export function homeForRole(role: Role | null): string {
  switch (role) {
    case 'PATIENT':
      return '/patient';
    case 'DOCTOR':
      return '/doctor';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}