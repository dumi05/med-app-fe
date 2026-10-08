import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
    status: number;
    code: string;
    message: string;
}

export function toApiError (err: HttpErrorResponse): ApiError {
    const body = err.error;

    if(body && typeof body === 'object' && 'code' in body && 'message' in body) {
        return {
            status: err.status,
            code: String(body.code),
            message: String(body.message)
        };
    }

    if(err.status === 0) {
        return {
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Server not available. Try again later.'
        };
    }
    return {
            status: err.status,
            code: 'SERVER_ERROR',
            message: 'Unexpected server error.'
        };
}