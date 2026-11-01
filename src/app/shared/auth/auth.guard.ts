import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthService } from "./auth.service";
import { Role } from "./auth.model";
import { homeForRole } from "./role-home";

export const PASSWORD_PAGE = '/account/password';

function passwordChangeRedirect(authService: AuthService, router: Router, url: string | undefined): UrlTree | null {
    return authService.mustChangePassword() && !(url ?? '').startsWith(PASSWORD_PAGE) ? router.createUrlTree([PASSWORD_PAGE]) : null;
}

export const authGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if(!authService.isLoggedIn()){
        return router.createUrlTree(['/login']);
    }
    return passwordChangeRedirect(authService, router, state.url) ?? true;
};

export const roleGuard = (...allowedRoles: Role[]): CanActivateFn => (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if(!authService.isLoggedIn()){
        return router.createUrlTree(['/login']);
    }

    const redirect = passwordChangeRedirect(authService, router, state.url);
    if(redirect !== null){
        return redirect;
    }

    const role = authService.role();
    return role !== null && allowedRoles.includes(role) ? true : router.createUrlTree([homeForRole(role)]);
} 