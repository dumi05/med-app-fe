import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { catchError, throwError } from "rxjs";
import { toApiError } from "./api-error";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    
    return next(req).pipe(
        catchError((err: HttpErrorResponse) => {
            const isAuthCall = req.url.includes('/auth/');
            if ((err.status === 401 || err.status === 403) && !isAuthCall && !auth.isLoggedIn()) {
                router.navigateByUrl('/login');
            }
            return throwError(() => toApiError(err));
        })
    );
}