import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

import { AuditService } from '../../../../services/audit.service';
import { AuditLog, AuditPage } from '../../../../model/audit.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auditoria.html',
  styleUrls: ['./auditoria.css'],
})
export class Auditoria implements OnInit, OnDestroy {
  logs: AuditLog[] = [];
  loading = false;
  error = '';

  debug = {
    ms: 0,
    status: '',
    items: 0,
  };

  private sub?: Subscription;

  constructor(
    private auditService: AuditService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.sub?.unsubscribe();

    this.loading = true;
    this.error = '';
    this.debug.status = 'REQUEST...';
    this.debug.items = 0;
    const t0 = performance.now();
    this.cdr.detectChanges();

    this.sub = this.auditService
      .listar({
        page: 0,
        size: 20,
        sort: 'fecha',
        dir: 'desc',
      })
      .pipe(
        timeout(12000),
        catchError((err) => {
          this.debug.status = `ERROR ${err?.status ?? ''}`.trim();

          this.error =
            err?.name === 'TimeoutError'
              ? 'Timeout: el servidor tardó demasiado. Revisa si el backend está corriendo.'
              : (err?.error?.message ??
                err?.error ??
                err?.message ??
                'No se pudo cargar auditoría (posible 401/403 o error de red).');

          const empty: AuditPage = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
          };
          return of(empty);
        }),
        finalize(() => {
          this.debug.ms = Math.round(performance.now() - t0);
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((res) => {
        this.logs = res?.content ?? [];
        this.debug.items = this.logs.length;
        if (!this.error) this.debug.status = 'OK';
        this.cdr.detectChanges();
      });
  }

  trackById = (_: number, item: AuditLog) => item.id;

  badgeClass(action: string) {
    const a = (action ?? '').toUpperCase();
    if (a.includes('CREATE') || a.includes('CREAR')) return 'badge ok';
    if (a.includes('UPDATE') || a.includes('ACTUAL')) return 'badge warn';
    if (a.includes('DELETE') || a.includes('ELIM')) return 'badge bad';
    if (a.includes('LOGIN') || a.includes('AUTH')) return 'badge info';
    return 'badge';
  }
}
