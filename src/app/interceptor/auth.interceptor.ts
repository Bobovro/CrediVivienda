import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'OPTIONS') return next(req);

  const isAuthEndpoint =
    req.url.includes('/api/auth/register') ||
    req.url.includes('/api/authenticate') ||
    req.url.includes('/api/auth/'); // por si luego agregas más

  if (isAuthEndpoint) return next(req);

  const token = inject(TokenService).get();
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
