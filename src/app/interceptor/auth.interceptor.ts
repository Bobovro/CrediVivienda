import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1) Nunca interceptar preflight
  if (req.method === 'OPTIONS') return next(req);

  // 2) No agregar token en endpoints públicos de auth
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
