import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, catchError, take } from 'rxjs/operators';
import { forkJoin, of, Subscription } from 'rxjs';

import { PrestamoService } from '../../../services/prestamo.service';
import { ClienteService } from '../../../services/cliente.service';
import { UnidadInmobiliariaService } from '../../../services/unidad-inmobiliaria.service';

import { Prestamo, Cuota } from '../../../model/prestamo.model';
import { Cliente } from '../../../model/cliente.model';
import { UnidadInmobiliaria } from '../../../model/unidad-inmobiliaria.model';

@Component({
  selector: 'app-home-operaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-operaciones.html',
  styleUrls: ['./home-operaciones.css'],
})
export class HomeOperaciones implements OnInit, OnDestroy {
  loading = false;
  deletingId: number | null = null;
  errorMsg = '';
  okMsg = '';

  prestamos: Prestamo[] = [];
  clientes: Cliente[] = [];
  unidades: UnidadInmobiliaria[] = [];

  private clienteMap = new Map<number, Cliente>();
  private unidadMap = new Map<number, UnidadInmobiliaria>();

  selected: Prestamo | null = null;

  private loadSub?: Subscription;
  private detailSub?: Subscription;
  private deleteSub?: Subscription;

  constructor(
    private prestamoService: PrestamoService,
    private clienteService: ClienteService,
    private unidadService: UnidadInmobiliariaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.bootstrap();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.detailSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
  }

  private repaint() {
    this.cdr.markForCheck();
  }

  // ---------- Carga principal ----------
  bootstrap() {
    this.loadSub?.unsubscribe();

    this.loading = true;
    this.errorMsg = '';
    this.okMsg = '';
    this.selected = null;
    this.repaint();

    this.loadSub = forkJoin({
      prestamos: this.prestamoService.list().pipe(take(1), catchError(() => of([] as Prestamo[]))),
      clientes: this.clienteService.list().pipe(take(1), catchError(() => of([] as Cliente[]))),
      unidades: this.unidadService.list().pipe(take(1), catchError(() => of([] as UnidadInmobiliaria[]))),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.repaint();
        })
      )
      .subscribe({
        next: ({ prestamos, clientes, unidades }) => {
          this.prestamos = (prestamos ?? [])
            .slice()
            .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));

          this.clientes = clientes ?? [];
          this.unidades = unidades ?? [];

          this.clienteMap = new Map(
            this.clientes
              .filter((c) => c.id != null)
              .map((c) => [Number(c.id), c])
          );

          this.unidadMap = new Map(
            this.unidades
              .filter((u) => u.id != null)
              .map((u) => [Number(u.id), u])
          );

          this.repaint();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo cargar operaciones';
          this.repaint();
        },
      });
  }

  clienteLabel(clienteId: number): string {
    const c = this.clienteMap.get(Number(clienteId));
    if (!c) return `Cliente #${clienteId}`;
    return `${c.nombres} ${c.apellidos} (DNI: ${c.dni})`;
  }

  unidadLabel(unidadId: number): string {
    const u = this.unidadMap.get(Number(unidadId));
    if (!u) return `Unidad #${unidadId}`;
    return `${u.proyecto} (${u.ubicacion})`;
  }

  monedaLabel(moneda: any): string {
    if (moneda === 'PEN') return 'Soles (PEN)';
    if (moneda === 'USD') return 'Dólares (USD)';
    return String(moneda ?? '-');
  }

  tipoTasaLabel(tipo: any): string {
    if (tipo === 'EFECTIVA') return 'Efectiva';
    if (tipo === 'NOMINAL') return 'Nominal';
    return String(tipo ?? '-');
  }

  capLabel(cap: any): string {
    if (!cap) return '-';
    if (cap === 'DIARIA') return 'Diaria';
    if (cap === 'MENSUAL') return 'Mensual';
    if (cap === 'ANUAL') return 'Anual';
    return String(cap);
  }

  graciaResumen(p: Prestamo): string {
    const gt = Number(p.graciaTotal ?? 0);
    const gp = Number(p.graciaParcial ?? 0);
    if (gt > 0) return `Total (${gt})`;
    if (gp > 0) return `Parcial (${gp})`;
    return 'Ninguna';
  }

  openDetail(p: Prestamo) {
    this.errorMsg = '';
    this.okMsg = '';
    this.selected = p;
    this.repaint();

    const id = Number(p.id ?? 0);
    if (!id) return;

    if (p.cronograma && p.cronograma.length > 0) return;

    this.detailSub?.unsubscribe();
    this.loading = true;
    this.repaint();

    this.detailSub = this.prestamoService
      .getById(id)
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
          this.repaint();
        })
      )
      .subscribe({
        next: (full) => {
          this.selected = full;

          const idx = this.prestamos.findIndex((x) => Number(x.id) === Number(full.id));
          if (idx >= 0) this.prestamos[idx] = full;

          this.repaint();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo cargar el detalle';
          this.repaint();
        },
      });
  }

  closeDetail() {
    this.selected = null;
    this.repaint();
  }

  deletePrestamo(p: Prestamo) {
    const id = Number(p.id ?? 0);
    if (!id) return;

    if (this.deletingId !== null) return;
    const ok = confirm(`¿Eliminar la operación #${id}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    this.errorMsg = '';
    this.okMsg = '';
    this.deletingId = id;
    this.repaint();

    this.deleteSub?.unsubscribe();

    this.deleteSub = this.prestamoService
      .delete(id)
      .pipe(
        take(1),
        finalize(() => {
          this.deletingId = null;
          this.repaint();
        })
      )
      .subscribe({
        next: () => {
          this.prestamos = this.prestamos.filter((x) => Number(x.id) !== id);
          if (this.selected && Number(this.selected.id) === id) this.selected = null;
          this.okMsg = 'Operación eliminada';
          this.repaint();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo eliminar';
          this.repaint();
        },
      });
  }

  trackByPrestamo = (_: number, item: Prestamo) => item.id ?? _;
  trackByCuota = (_: number, item: Cuota) => item.numeroCuota ?? _;
}
