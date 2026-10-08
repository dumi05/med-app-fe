import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(AuthService).token();
    const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));

    if(token === null || !req.url.startsWith('/api/') || isPublic) {
        return next(req);
    }
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}`}}));
}