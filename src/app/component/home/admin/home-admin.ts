import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil, timeout } from 'rxjs/operators';

import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartType } from 'chart.js';

import { AuditLog, AuditPage } from '../../../model/audit.model';

Chart.register(...registerables);

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './home-admin.html',
  styleUrls: ['./home-admin.css'],
})
export class HomeAdmin implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  errorMsg = '';
  chartsReady = false;

  debug = {
    clientes: 'INIT',
    unidades: 'INIT',
    prestamos: 'INIT',
    audit: 'INIT',
  };

  totalClientes = 0;
  totalUnidades = 0;
  totalPrestamos = 0;
  totalAuditoria = 0;

  ultimosLogs: AuditLog[] = [];

  entidadChartType: ChartType = 'bar';
  entidadChartData: ChartConfiguration['data'] = {
    labels: ['CLIENTE', 'UNIDAD', 'PRESTAMO', 'OTROS'],
    datasets: [{ data: [0, 0, 0, 0], label: 'Eventos' }],
  };
  entidadChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  accionesChartType: ChartType = 'doughnut';
  accionesChartData: ChartConfiguration['data'] = {
    labels: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'OTROS'],
    datasets: [{ data: [0, 0, 0, 0, 0], label: 'Acciones' }],
  };
  accionesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  private readonly BASE = 'http://localhost:8080';
  private readonly API_CLIENTES = `${this.BASE}/api/clientes`;
  private readonly API_UNIDADES = `${this.BASE}/api/unidades`;
  private readonly API_PRESTAMOS = `${this.BASE}/api/prestamos`;
  private readonly API_AUDIT = `${this.BASE}/api/admin/audit`;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.chartsReady = false;
    this.ultimosLogs = [];

    this.debug = { clientes: 'REQ', unidades: 'REQ', prestamos: 'REQ', audit: 'REQ' };
    this.cdr.detectChanges();

    const safeArr = <T>() => of([] as T[]);
    const safeAudit = () =>
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
      } as AuditPage);

    const reqClientes = this.http.get<any[]>(this.API_CLIENTES).pipe(
      timeout(12000),
      catchError((e) => {
        this.debug.clientes = `ERR ${e?.status ?? ''}`.trim();
        return safeArr<any>();
      })
    );

    const reqUnidades = this.http.get<any[]>(this.API_UNIDADES).pipe(
      timeout(12000),
      catchError((e) => {
        this.debug.unidades = `ERR ${e?.status ?? ''}`.trim();
        return safeArr<any>();
      })
    );

    const reqPrestamos = this.http.get<any[]>(this.API_PRESTAMOS).pipe(
      timeout(12000),
      catchError((e) => {
        this.debug.prestamos = `ERR ${e?.status ?? ''}`.trim();
        return safeArr<any>();
      })
    );

    const reqAudit = this.http
      .get<AuditPage>(`${this.API_AUDIT}?page=0&size=50&sort=fecha&dir=desc`)
      .pipe(
        timeout(12000),
        catchError((e) => {
          this.debug.audit = `ERR ${e?.status ?? ''}`.trim();
          return safeAudit();
        })
      );

    forkJoin({
      clientes: reqClientes,
      unidades: reqUnidades,
      prestamos: reqPrestamos,
      audit: reqAudit,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (this.debug.clientes === 'REQ') this.debug.clientes = 'OK';
          if (this.debug.unidades === 'REQ') this.debug.unidades = 'OK';
          if (this.debug.prestamos === 'REQ') this.debug.prestamos = 'OK';
          if (this.debug.audit === 'REQ') this.debug.audit = 'OK';

          this.totalClientes = Array.isArray(res.clientes) ? res.clientes.length : 0;
          this.totalUnidades = Array.isArray(res.unidades) ? res.unidades.length : 0;
          this.totalPrestamos = Array.isArray(res.prestamos) ? res.prestamos.length : 0;

          const logs = res.audit?.content ?? [];
          this.totalAuditoria = res.audit?.totalElements ?? logs.length;
          this.ultimosLogs = logs.slice(0, 10);

          this.buildCharts(logs);
          this.chartsReady = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg =
            err?.message ?? 'No se pudo cargar el dashboard admin (error inesperado).';
        },
      });
  }

  private buildCharts(logs: AuditLog[]) {
    const acc = { CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, OTROS: 0 };

    for (const l of logs) {
      const a = (l.accion ?? '').toUpperCase();
      if (a.includes('CREATE') || a.includes('CREAR')) acc.CREATE++;
      else if (a.includes('UPDATE') || a.includes('ACTUAL')) acc.UPDATE++;
      else if (a.includes('DELETE') || a.includes('ELIM')) acc.DELETE++;
      else if (a.includes('LOGIN') || a.includes('AUTH')) acc.LOGIN++;
      else acc.OTROS++;
    }

    this.accionesChartData = {
      labels: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'OTROS'],
      datasets: [{ data: [acc.CREATE, acc.UPDATE, acc.DELETE, acc.LOGIN, acc.OTROS], label: 'Acciones' }],
    };

    const ent = { CLIENTE: 0, UNIDAD: 0, PRESTAMO: 0, OTROS: 0 };

    for (const l of logs) {
      const e = (l.entidad ?? '').toUpperCase();
      if (e.includes('CLIENT')) ent.CLIENTE++;
      else if (e.includes('UNIDAD')) ent.UNIDAD++;
      else if (e.includes('PREST')) ent.PRESTAMO++;
      else ent.OTROS++;
    }

    this.entidadChartData = {
      labels: ['CLIENTE', 'UNIDAD', 'PRESTAMO', 'OTROS'],
      datasets: [{ data: [ent.CLIENTE, ent.UNIDAD, ent.PRESTAMO, ent.OTROS], label: 'Eventos' }],
    };
  }

  badgeClass(action: string) {
    const a = (action ?? '').toUpperCase();
    if (a.includes('CREATE') || a.includes('CREAR')) return 'badge ok';
    if (a.includes('UPDATE') || a.includes('ACTUAL')) return 'badge warn';
    if (a.includes('DELETE') || a.includes('ELIM')) return 'badge bad';
    if (a.includes('LOGIN') || a.includes('AUTH')) return 'badge info';
    return 'badge';
  }
}
