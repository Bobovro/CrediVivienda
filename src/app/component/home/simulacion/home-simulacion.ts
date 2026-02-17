import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { PrestamoService } from '../../../services/prestamo.service';
import { ClienteService } from '../../../services/cliente.service';
import { UnidadInmobiliariaService } from '../../../services/unidad-inmobiliaria.service';
import { AppConfigService } from '../../../services/config.service';

import { Prestamo } from '../../../model/prestamo.model';
import { Cliente } from '../../../model/cliente.model';
import { UnidadInmobiliaria } from '../../../model/unidad-inmobiliaria.model';
import { AppConfig } from '../../../model/config.model';

@Component({
  selector: 'app-home-simulacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home-simulacion.html',
  styleUrls: ['./home-simulacion.css'],
})
export class HomeSimulacion implements OnInit {
  loading = false;
  simulating = false;
  saving = false;

  errorMsg = '';
  okMsg = '';

  form!: FormGroup;

  clientes: Cliente[] = [];
  unidades: UnidadInmobiliaria[] = [];

  config: AppConfig | null = null;

  result: Prestamo | null = null;

  monedas = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
  ] as const;

  tiposTasa = [
    { value: 'EFECTIVA', label: 'Efectiva' },
    { value: 'NOMINAL', label: 'Nominal' },
  ] as const;

  caps = [
    { value: 'DIARIA', label: 'Diaria' },
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'ANUAL', label: 'Anual' },
  ] as const;

  constructor(
    private fb: FormBuilder,
    private prestamoService: PrestamoService,
    private clienteService: ClienteService,
    private unidadService: UnidadInmobiliariaService,
    private configService: AppConfigService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      clienteId: [null, [Validators.required]],
      unidadInmobiliariaId: [null, [Validators.required]],

      montoPrestamo: [0, [Validators.required, Validators.min(1)]],
      plazoMeses: [12, [Validators.required, Validators.min(1), Validators.max(600)]],

      moneda: ['PEN', [Validators.required]],
      tipoTasa: ['EFECTIVA', [Validators.required]],
      capitalizacion: [null],

      tasaInteres: [0.12, [Validators.required, Validators.min(0)]],

      graciaTotal: [0, [Validators.min(0), Validators.max(60)]],
      graciaParcial: [0, [Validators.min(0), Validators.max(60)]],
    });

    this.form.valueChanges.subscribe(() => {
      this.errorMsg = '';
      this.okMsg = '';
    });

    this.form.get('plazoMeses')?.valueChanges.subscribe(() => {
      const plazo = Number(this.form.get('plazoMeses')?.value ?? 0);
      const maxG = Math.min(60, Math.max(0, plazo));

      const gT = this.form.get('graciaTotal');
      const gP = this.form.get('graciaParcial');

      gT?.setValidators([Validators.min(0), Validators.max(maxG)]);
      gP?.setValidators([Validators.min(0), Validators.max(maxG)]);
      gT?.updateValueAndValidity({ emitEvent: false });
      gP?.updateValueAndValidity({ emitEvent: false });

      if (this.config) {
        this.applyConfig(this.config);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.bootstrap();
  }

  monedaLabel(value: any): string {
    return this.monedas.find(x => x.value === value)?.label ?? String(value ?? '-');
  }
  tipoTasaLabel(value: any): string {
    return this.tiposTasa.find(x => x.value === value)?.label ?? String(value ?? '-');
  }
  capLabel(value: any): string {
    if (!value) return '-';
    return this.caps.find(x => x.value === value)?.label ?? String(value);
  }
  graciaLabel(): string {
    if (!this.config) return '-';
    if (this.config.graciaTipo === 'NINGUNA') return 'Ninguna';
    if (this.config.graciaTipo === 'TOTAL') return `Total (${this.config.graciaPeriodos ?? 0})`;
    return `Parcial (${this.config.graciaPeriodos ?? 0})`;
  }

  private lockConfigFields() {
    this.form.get('moneda')?.disable({ emitEvent: false });
    this.form.get('tipoTasa')?.disable({ emitEvent: false });
    this.form.get('capitalizacion')?.disable({ emitEvent: false });
    this.form.get('graciaTotal')?.disable({ emitEvent: false });
    this.form.get('graciaParcial')?.disable({ emitEvent: false });
  }

  private clamp(n: number, min: number, max: number) {
    const x = Number.isFinite(n) ? n : 0;
    return Math.max(min, Math.min(max, x));
  }

  private applyConfig(cfg: AppConfig) {
    this.config = cfg;

    const plazo = Number(this.form.get('plazoMeses')?.value ?? 0);

    const periodosCfg = Number(cfg.graciaPeriodos ?? 0);
    const periodos = this.clamp(periodosCfg, 0, Math.min(60, Math.max(0, plazo)));

    const graciaTotal = cfg.graciaTipo === 'TOTAL' ? periodos : 0;
    const graciaParcial = cfg.graciaTipo === 'PARCIAL' ? periodos : 0;

    this.form.patchValue({
      moneda: cfg.monedaDefault,
      tipoTasa: cfg.tipoTasaDefault,
      capitalizacion: cfg.tipoTasaDefault === 'NOMINAL' ? (cfg.capitalizacion ?? 'MENSUAL') : null,
      graciaTotal,
      graciaParcial,
    }, { emitEvent: false });

    this.lockConfigFields();
  }

  public bootstrap() {
    this.loading = true;
    this.errorMsg = '';
    this.okMsg = '';
    this.cdr.detectChanges();

    forkJoin({
      cfg: this.configService.getConfig().pipe(catchError(() => of(null))),
      clientes: this.clienteService.list().pipe(catchError(() => of([] as Cliente[]))),
      unidades: this.unidadService.list().pipe(catchError(() => of([] as UnidadInmobiliaria[]))),
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe(({ cfg, clientes, unidades }) => {
        this.clientes = clientes ?? [];
        this.unidades = unidades ?? [];

        if (cfg) this.applyConfig(cfg);
        else this.lockConfigFields();

        this.cdr.detectChanges();
      });
  }

  simulate() {
    this.errorMsg = '';
    this.okMsg = '';
    this.result = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawCheck = this.form.getRawValue();
    const plazo = Number(rawCheck.plazoMeses ?? 0);
    const gT = Number(rawCheck.graciaTotal ?? 0);
    const gP = Number(rawCheck.graciaParcial ?? 0);

    if (gT > plazo || gP > plazo) {
      this.errorMsg = 'La gracia no puede ser mayor que el plazo.';
      return;
    }
    if (gT + gP > plazo) {
      this.errorMsg = 'La suma de gracia total y parcial no puede superar el plazo.';
      return;
    }

    this.simulating = true;
    this.cdr.detectChanges();

    const raw = this.form.getRawValue();

    const payload: Prestamo = {
      clienteId: Number(raw.clienteId),
      unidadInmobiliariaId: Number(raw.unidadInmobiliariaId),
      montoPrestamo: Number(raw.montoPrestamo),
      plazoMeses: Number(raw.plazoMeses),
      moneda: raw.moneda,
      tipoTasa: raw.tipoTasa,
      capitalizacion: raw.tipoTasa === 'NOMINAL' ? raw.capitalizacion : null,
      tasaInteres: Number(raw.tasaInteres),
      graciaTotal: Number(raw.graciaTotal ?? 0),
      graciaParcial: Number(raw.graciaParcial ?? 0),
    };

    this.prestamoService.simular(payload)
      .pipe(finalize(() => {
        this.simulating = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.result = res;
          this.okMsg = 'Simulación lista';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo simular';
          this.cdr.detectChanges();
        }
      });
  }

  saveOperacion() {
    if (!this.result) return;

    this.saving = true;
    this.errorMsg = '';
    this.okMsg = '';
    this.cdr.detectChanges();

    const raw = this.form.getRawValue();

    const payload: Prestamo = {
      clienteId: Number(raw.clienteId),
      unidadInmobiliariaId: Number(raw.unidadInmobiliariaId),
      montoPrestamo: Number(raw.montoPrestamo),
      plazoMeses: Number(raw.plazoMeses),
      moneda: raw.moneda,
      tipoTasa: raw.tipoTasa,
      capitalizacion: raw.tipoTasa === 'NOMINAL' ? raw.capitalizacion : null,
      tasaInteres: Number(raw.tasaInteres),
      graciaTotal: Number(raw.graciaTotal ?? 0),
      graciaParcial: Number(raw.graciaParcial ?? 0),
    };

    this.prestamoService.create(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.okMsg = 'Operación guardada';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo guardar operación';
          this.cdr.detectChanges();
        }
      });
  }

  trackByCuota = (_: number, item: any) => item?.numeroCuota;
}
