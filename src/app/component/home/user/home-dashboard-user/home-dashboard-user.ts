import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, Chart, registerables } from 'chart.js';

import { Prestamo } from '../../../../model/prestamo.model';
import { HttpClient } from '@angular/common/http';

import { Subscription, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

// ✅ NECESARIO EN CHART.JS v3+
Chart.register(...registerables);

@Component({
  selector: 'app-home-dashboard-user',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './home-dashboard-user.html',
  styleUrls: ['./home-dashboard-user.css'],
})
export class HomeDashboardUser implements OnInit, OnDestroy {
  loading = false;          // para spinners/secciones
  loadingBtn = false;       // para botón (extra seguro)
  errorMsg = '';

  debug = {
    url: '',
    ms: 0,
    count: 0,
    lastStatus: '',
  };

  totalOperaciones = 0;
  montoTotal = 0;
  interesesTotales = 0;
  promTcea = 0;

  ultimas: Prestamo[] = [];

  opsChartType: ChartType = 'bar';
  opsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Operaciones' }],
  };
  opsChartOptions: ChartConfiguration['options'] = { responsive: true };

  montoChartType: ChartType = 'line';
  montoChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Monto total' }],
  };
  montoChartOptions: ChartConfiguration['options'] = { responsive: true };

  private sub?: Subscription;

  // ✅ mejor con proxy luego: '/api/prestamos'
  private readonly API = 'http://localhost:8080/api/prestamos';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // pequeño delay para evitar que Chart inicialice antes de pintar el canvas
    setTimeout(() => this.load(), 0);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private repaint() {
    this.cdr.detectChanges();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }

  load() {
    this.sub?.unsubscribe();

    this.loading = true;
    this.loadingBtn = true;
    this.errorMsg = '';
    this.debug.url = this.API;
    this.debug.lastStatus = 'REQUEST...';
    this.debug.ms = 0;
    this.debug.count = 0;

    const t0 = performance.now();
    this.repaint();

    this.sub = this.http
      .get<Prestamo[]>(this.API)
      .pipe(
        timeout(12000),
        catchError((err) => {
          this.debug.lastStatus = `ERROR ${err?.status ?? ''}`.trim();
          this.errorMsg =
            err?.name === 'TimeoutError'
              ? 'El servidor tardó demasiado (timeout). Revisa si el backend está corriendo.'
              : (err?.error?.message ?? err?.error ?? err?.message ?? 'No se pudo cargar el dashboard');
          return of([] as Prestamo[]);
        }),
        finalize(() => {
          this.debug.ms = Math.round(performance.now() - t0);
          this.loading = false;
          this.loadingBtn = false;
          this.repaint();
        })
      )
      .subscribe((prestamos) => {
        this.debug.count = Array.isArray(prestamos) ? prestamos.length : 0;
        this.debug.lastStatus = 'OK';

        this.buildDashboard(prestamos ?? []);
        this.repaint();
      });
  }

  private buildDashboard(prestamos: Prestamo[]) {
    this.totalOperaciones = prestamos.length;

    this.montoTotal = this.round2(prestamos.reduce((a, p) => a + Number(p.montoPrestamo ?? 0), 0));
    this.interesesTotales = this.round2(prestamos.reduce((a, p) => a + Number(p.interesesTotales ?? 0), 0));

    const sumTcea = prestamos.reduce((a, p) => a + Number(p.tcea ?? 0), 0);
    this.promTcea = this.totalOperaciones ? this.round4(sumTcea / this.totalOperaciones) : 0;

    this.ultimas = prestamos
      .slice()
      .sort((a, b) => {
        const da = a.fechaSimulacion ?? '';
        const db = b.fechaSimulacion ?? '';
        if (da && db) return db.localeCompare(da);
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      })
      .slice(0, 5);

    const map = new Map<string, Prestamo[]>();
    for (const p of prestamos) {
      const f = p.fechaSimulacion ?? '';
      if (!f) continue;
      const key = f.substring(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }

    const rows = Array.from(map.entries())
      .map(([mes, list]) => ({
        mes,
        operaciones: list.length,
        montoTotal: list.reduce((a, x) => a + Number(x.montoPrestamo ?? 0), 0),
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const labels = rows.map((r) => r.mes);

    this.opsChartData = {
      labels,
      datasets: [{ data: rows.map((r) => r.operaciones), label: 'Operaciones' }],
    };

    this.montoChartData = {
      labels,
      datasets: [{ data: rows.map((r) => this.round2(r.montoTotal)), label: 'Monto total' }],
    };
  }

  private round2(v: number) {
    return Math.round(v * 100) / 100;
  }
  private round4(v: number) {
    return Math.round(v * 10000) / 10000;
  }
}
