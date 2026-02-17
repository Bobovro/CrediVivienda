import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import {HomeClientes} from './component/home/clientes/home-clientes';
import {HomeDashboardUser} from './component/home/user/home-dashboard-user/home-dashboard-user';

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

      { path: 'admin', loadComponent: () => import('./component/home/admin/home-admin').then(m => m.HomeAdmin) },

      { path: 'config', loadComponent: () => import('./component/home/config/home-config').then(m => m.HomeConfig) },
      { path: 'clientes', loadComponent: () => import('./component/home/clientes/home-clientes').then(m => m.HomeClientes) },
      { path: 'unidades', loadComponent: () => import('./component/home/unidades/home-unidades').then(m => m.HomeUnidades) },
      { path: 'simulacion', loadComponent: () => import('./component/home/simulacion/home-simulacion').then(m => m.HomeSimulacion) },
      { path: 'operaciones', loadComponent: () => import('./component/home/operaciones/home-operaciones').then(m => m.HomeOperaciones) },
      { path: 'clientes', canActivate: [authGuard], loadComponent: () => import('./component/home/clientes/home-clientes').then(m => m.HomeClientes) },
      { path: 'dashboard', loadComponent: () => import('./component/home/user/home-dashboard-user/home-dashboard-user').then(m => m.HomeDashboardUser),}
      ,
      {
        path: 'admin',
        loadComponent: () =>
          import('./component/home/admin/home-admin')
            .then(m => m.HomeAdmin),
      },
      {
        path: 'admin/auditoria',
        loadComponent: () =>
          import('./component/home/admin/auditoria/auditoria')
            .then(m => m.Auditoria),
      }

    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: '**', redirectTo: 'login' },
];
