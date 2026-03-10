import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Add token to request; withCredentials for cookie (refresh token)
  const token = authService.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  // Skip auth header for auth endpoints (login, register, refresh)
  const isAuthEndpoint = req.url.includes('/auth/');
  const finalReq = isAuthEndpoint ? req.clone({ withCredentials: true }) : authReq;

  return next(finalReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip refresh for auth endpoints to avoid loops
      if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh') || req.url.includes('/auth/logout')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
                withCredentials: true
              });
              return next(retryReq);
            }
            router.navigate(['/login']);
            return throwError(() => error);
          }),
          catchError(() => {
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
