import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { Role } from "./auth.model";
import { homeForRole } from "./role-home";

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const roleGuard = (...allowedRoles: Role[]): CanActivateFn => () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if(!authService.isLoggedIn()){
        return router.createUrlTree(['/login']);
    }
    const role = authService.role();
    return role !== null && allowedRoles.includes(role) ? true : router.createUrlTree([homeForRole(role)]);
} 