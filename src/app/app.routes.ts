import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./component/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./component/auth/register/register').then(m => m.Register),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./component/home/layout/home-layout').then(m => m.HomeLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'user' },

      { path: 'user', loadComponent: () => import('./component/home/user/home-user').then(m => m.HomeUser) },
      { path: 'admin', loadComponent: () => import('./component/home/admin/home-admin').then(m => m.HomeAdmin) },

      { path: 'config', loadComponent: () => import('./component/home/config/home-config').then(m => m.HomeConfig) },
      { path: 'clientes', loadComponent: () => import('./component/home/clientes/home-clientes').then(m => m.HomeClientes) },
      { path: 'unidades', loadComponent: () => import('./component/home/unidades/home-unidades').then(m => m.HomeUnidades) },
      { path: 'simulacion', loadComponent: () => import('./component/home/simulacion/home-simulacion').then(m => m.HomeSimulacion) },
      { path: 'operaciones', loadComponent: () => import('./component/home/operaciones/home-operaciones').then(m => m.HomeOperaciones) },
    ],
  },

  // ✅ esto evita pantalla en blanco al entrar a /
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ✅ cualquier cosa rara manda a login
  { path: '**', redirectTo: 'login' },
];
