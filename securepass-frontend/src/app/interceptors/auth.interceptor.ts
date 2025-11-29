import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Add token to all requests except auth endpoints
  if (!req.url.includes('/auth/')) {
    const token = authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only logout on auth endpoints or if token is clearly invalid
      // For other endpoints, 401/403 might be due to data validation
      const isAuthEndpoint = req.url.includes('/auth/');
      const isBulkImport = req.url.includes('/vault/batch') || req.url.includes('/vault/bulk');
      
      // For bulk import, never auto-logout - let the component handle the error
      // Backend might return 401/403 for validation errors or auth issues
      // Component will check token and error details to decide
      if (isBulkImport) {
        // Don't auto-logout, let component handle it
        return throwError(() => error);
      }
      
      if ((error.status === 401 || error.status === 403) && isAuthEndpoint) {
        // Auth endpoint errors - definitely logout
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 401) {
        // 401 on non-auth endpoints - check error message to see if it's actually auth-related
        const errorBody = error.error;
        const errorMessage = typeof errorBody === 'string' 
          ? errorBody.toLowerCase() 
          : (errorBody?.message || errorBody?.error || '').toLowerCase();
        
        // Check if error message indicates actual authentication failure
        const isAuthError = errorMessage.includes('token') || 
                           errorMessage.includes('unauthorized') || 
                           errorMessage.includes('authentication') ||
                           errorMessage.includes('expired') ||
                           errorMessage.includes('invalid credentials');
        
        if (isAuthError) {
          // Real auth error - logout
          const token = authService.getToken();
          if (!token || errorMessage.includes('expired') || errorMessage.includes('invalid')) {
            authService.logout();
            router.navigate(['/login']);
          }
        }
        // If not an auth error, let the component handle it (might be validation error)
      } else if (error.status === 403) {
        // 403 on non-auth endpoints - check if it's auth-related
        const errorBody = error.error;
        const errorMessage = typeof errorBody === 'string' 
          ? errorBody.toLowerCase() 
          : (errorBody?.message || errorBody?.error || '').toLowerCase();
        
        const isAuthError = errorMessage.includes('forbidden') && 
                           (errorMessage.includes('token') || errorMessage.includes('unauthorized'));
        
        if (isAuthError) {
          // Real auth error - logout
          authService.logout();
          router.navigate(['/login']);
        }
        // Otherwise let component handle it
      }
      return throwError(() => error);
    })
  );
};

