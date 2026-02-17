import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AppConfigService } from '../../../services/config.service';
import {
  AppConfig,
  Moneda,
  TipoTasa,
  Capitalizacion,
  GraciaTipo
} from '../../../model/config.model';

@Component({
  selector: 'app-home-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home-config.html',
  styleUrls: ['./home-config.css'],
})
export class HomeConfig implements OnInit {
  loading = false;
  saving = false;

  errorMsg = '';
  okMsg = '';

  form!: FormGroup;
  private lastLoaded!: AppConfig;

  canEdit = true;

  monedas: { value: Moneda; label: string }[] = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
  ];

  tiposTasa: { value: TipoTasa; label: string }[] = [
    { value: 'EFECTIVA', label: 'Efectiva' },
    { value: 'NOMINAL', label: 'Nominal' },
  ];

  caps: { value: Capitalizacion; label: string }[] = [
    { value: 'DIARIA', label: 'Diaria' },
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'ANUAL', label: 'Anual' },
  ];

  gracias: { value: GraciaTipo; label: string }[] = [
    { value: 'NINGUNA', label: 'Ninguna' },
    { value: 'TOTAL', label: 'Total' },
    { value: 'PARCIAL', label: 'Parcial' },
  ];

  constructor(
    private fb: FormBuilder,
    private configService: AppConfigService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      monedaDefault: ['PEN', [Validators.required]],
      tipoTasaDefault: ['EFECTIVA', [Validators.required]],
      capitalizacion: [{ value: 'MENSUAL', disabled: true }], // solo si NOMINAL
      graciaTipo: ['NINGUNA', [Validators.required]],
      graciaPeriodos: [0, [Validators.required, Validators.min(0), Validators.max(60)]],
    });

    this.form.get('tipoTasaDefault')?.valueChanges.subscribe((tipo: TipoTasa) => {
      const capCtrl = this.form.get('capitalizacion');
      if (!capCtrl) return;

      if (tipo === 'NOMINAL') {
        capCtrl.enable({ emitEvent: false });
        if (!capCtrl.value) capCtrl.setValue('MENSUAL', { emitEvent: false });
      } else {
        capCtrl.setValue(null, { emitEvent: false });
        capCtrl.disable({ emitEvent: false });
      }

      if (!this.canEdit) this.form.disable({ emitEvent: false });

      this.cdr.detectChanges();
    });

    this.form.valueChanges.subscribe(() => {
      this.errorMsg = '';
      this.okMsg = '';
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.canEdit = this.isAdminFromToken();
    this.applyEditMode();
    this.loadConfig();
  }

  private applyEditMode() {
    if (!this.canEdit) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
      const tipo = this.form.get('tipoTasaDefault')?.value as TipoTasa;
      const capCtrl = this.form.get('capitalizacion');
      if (tipo !== 'NOMINAL') {
        capCtrl?.disable({ emitEvent: false });
      }
    }
    this.cdr.detectChanges();
  }

  private isAdminFromToken(): boolean {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt');

    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if ((payload?.sub || '').toString().toLowerCase() === 'admin') return true;

      const roles: string[] =
        payload?.roles ||
        payload?.authorities ||
        payload?.scope?.split?.(' ') ||
        [];

      return roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
    } catch {
      return false;
    }
  }

  private toErrorMsg(err: any): string {
    const e = err?.error ?? err;
    if (typeof e === 'string') return e;
    if (e?.message && typeof e.message === 'string') return e.message;
    try { return JSON.stringify(e); } catch { return 'Ocurrió un error'; }
  }

  loadConfig() {
    this.loading = true;
    this.errorMsg = '';
    this.okMsg = '';
    this.cdr.detectChanges();

    this.configService.getConfig()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (cfg: AppConfig) => {
          this.lastLoaded = cfg;

          this.form.patchValue({
            monedaDefault: cfg.monedaDefault,
            tipoTasaDefault: cfg.tipoTasaDefault,
            capitalizacion: cfg.capitalizacion ?? null,
            graciaTipo: cfg.graciaTipo,
            graciaPeriodos: cfg.graciaPeriodos ?? 0,
          }, { emitEvent: false });

          const capCtrl = this.form.get('capitalizacion');
          if (cfg.tipoTasaDefault === 'NOMINAL') capCtrl?.enable({ emitEvent: false });
          else capCtrl?.disable({ emitEvent: false });

          this.applyEditMode();

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = this.toErrorMsg(err) || 'No se pudo cargar configuración';
          this.cdr.detectChanges();
        },
      });
  }

  save() {
    if (!this.canEdit) {
      this.errorMsg = 'No tienes permisos para modificar la configuración.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMsg = '';
    this.okMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    const raw = this.form.getRawValue();
    const payload: AppConfig = { ...(this.lastLoaded ?? ({} as any)), ...raw };

    this.configService.updateConfig(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (saved) => {
          this.lastLoaded = saved;
          this.okMsg = 'Configuración guardada';
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = this.toErrorMsg(err) || 'No se pudo guardar configuración';
          this.cdr.detectChanges();
        },
      });
  }

  restore() {
    if (!this.canEdit) return;

    this.errorMsg = '';
    this.okMsg = '';

    if (!this.lastLoaded) {
      this.loadConfig();
      return;
    }

    this.form.patchValue({
      monedaDefault: this.lastLoaded.monedaDefault,
      tipoTasaDefault: this.lastLoaded.tipoTasaDefault,
      capitalizacion: this.lastLoaded.capitalizacion ?? null,
      graciaTipo: this.lastLoaded.graciaTipo,
      graciaPeriodos: this.lastLoaded.graciaPeriodos ?? 0,
    }, { emitEvent: false });

    const capCtrl = this.form.get('capitalizacion');
    if (this.lastLoaded.tipoTasaDefault === 'NOMINAL') capCtrl?.enable({ emitEvent: false });
    else capCtrl?.disable({ emitEvent: false });

    this.applyEditMode();
  }
}
