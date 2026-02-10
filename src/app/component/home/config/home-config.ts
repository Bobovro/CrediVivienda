import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { ConfigService } from '../../../services/config.service';
import { AppConfig } from '../../../model/config.model';

@Component({
  selector: 'app-home-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home-config.html',
  styleUrls: ['./home-config.css'],
})
export class HomeConfig {
  savedMsg: string = '';

  // ✅ IMPORTANTE: NO usamos this.fb aquí para evitar TS2729
  form!: FormGroup;

  constructor(private fb: FormBuilder, private cfg: ConfigService) {
    // ✅ ahora sí, ya existe this.fb
    this.form = this.fb.group({
      monedaDefault: ['PEN', [Validators.required]],
      tipoTasaDefault: ['EFECTIVA', [Validators.required]],
      capitalizacion: [{ value: 'MENSUAL', disabled: true }], // por defecto deshabilitado si es efectiva
      graciaTipo: ['NINGUNA', [Validators.required]],
      graciaPeriodos: [0, [Validators.required, Validators.min(0), Validators.max(60)]],
    });

    // cargar config guardada
    const current: AppConfig = this.cfg.get();
    this.form.patchValue(current as any);

    // habilitar/deshabilitar capitalización según tipo tasa
    this.applyCapitalizacionRules(this.form.get('tipoTasaDefault')?.value);

    // escuchar cambios
    this.form.get('tipoTasaDefault')?.valueChanges.subscribe((tipo) => {
      this.applyCapitalizacionRules(tipo);
    });
  }

  private applyCapitalizacionRules(tipo: 'EFECTIVA' | 'NOMINAL') {
    const cap = this.form.get('capitalizacion');

    if (tipo === 'NOMINAL') {
      cap?.enable({ emitEvent: false });
      cap?.setValidators([Validators.required]);
    } else {
      cap?.clearValidators();
      cap?.setValue('MENSUAL', { emitEvent: false });
      cap?.disable({ emitEvent: false });
    }

    cap?.updateValueAndValidity({ emitEvent: false });
  }

  save() {
    this.savedMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as AppConfig;

    // si es efectiva, capitalizacion no aplica
    if (value.tipoTasaDefault !== 'NOMINAL') {
      delete (value as any).capitalizacion;
    }

    this.cfg.set(value);

    this.savedMsg = 'Configuración guardada ✅';
    setTimeout(() => (this.savedMsg = ''), 2500);
  }

  reset() {
    this.cfg.reset();

    const current: AppConfig = this.cfg.get();
    this.form.reset({
      monedaDefault: current.monedaDefault,
      tipoTasaDefault: current.tipoTasaDefault,
      capitalizacion: current.capitalizacion ?? 'MENSUAL',
      graciaTipo: current.graciaTipo,
      graciaPeriodos: current.graciaPeriodos,
    });

    this.applyCapitalizacionRules(this.form.get('tipoTasaDefault')?.value);

    this.savedMsg = 'Configuración restaurada ✅';
    setTimeout(() => (this.savedMsg = ''), 2500);
  }
}
