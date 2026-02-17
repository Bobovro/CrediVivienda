import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { UnidadInmobiliariaService } from '../../../services/unidad-inmobiliaria.service';
import { UnidadInmobiliaria } from '../../../model/unidad-inmobiliaria.model';

@Component({
  selector: 'app-home-unidades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './home-unidades.html',
  styleUrls: ['./home-unidades.css'],
})
export class HomeUnidades implements OnInit {
  unidades: UnidadInmobiliaria[] = [];

  loading = false; // listar/refresh/delete
  saving = false;  // create/update

  errorMsg = '';
  okMsg = '';

  editingId: number | null = null;

  // buscador
  query = '';

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private unidadService: UnidadInmobiliariaService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      proyecto: ['', [Validators.required]],
      ubicacion: ['', [Validators.required]],
      valorInmueble: [0, [Validators.required, Validators.min(0)]],
      aplicaTechoPropio: [false],
      bonoTechoPropio: [{ value: 0, disabled: true }, [Validators.min(0)]],
    });

    // Habilitar/deshabilitar bono según checkbox
    this.form.get('aplicaTechoPropio')?.valueChanges.subscribe((checked: boolean) => {
      const bonoCtrl = this.form.get('bonoTechoPropio');
      if (!bonoCtrl) return;

      if (checked) {
        bonoCtrl.enable({ emitEvent: false });
      } else {
        bonoCtrl.setValue(0, { emitEvent: false });
        bonoCtrl.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadUnidades();
  }

  // Forzar UI update (misma idea que HomeClientes)
  private uiTick() {
    // run dentro de Angular zone + fuerza detección
    this.zone.run(() => {
      this.cdr.detectChanges();
    });
  }

  // Filtrado en vivo
  get filteredUnidades(): UnidadInmobiliaria[] {
    const q = (this.query || '').trim().toLowerCase();
    if (!q) return this.unidades;

    return this.unidades.filter((u) => {
      const id = (u.id ?? '').toString().toLowerCase();
      const proyecto = (u.proyecto ?? '').toLowerCase();
      const ubicacion = (u.ubicacion ?? '').toLowerCase();
      const valor = (u.valorInmueble ?? '').toString().toLowerCase();

      return id.includes(q) || proyecto.includes(q) || ubicacion.includes(q) || valor.includes(q);
    });
  }

  clearSearch() {
    this.query = '';
    this.uiTick();
  }

  private resetFormOnly() {
    this.editingId = null;

    this.form.reset({
      proyecto: '',
      ubicacion: '',
      valorInmueble: 0,
      aplicaTechoPropio: false,
      bonoTechoPropio: 0,
    });

    // al reset queda desmarcado => deshabilitar bono
    this.form.get('bonoTechoPropio')?.disable({ emitEvent: false });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  loadUnidades() {
    this.loading = true;
    this.errorMsg = '';

    this.uiTick(); // 👈 para que el botón cambie a "Cargando..." al toque

    this.unidadService.list()
      .pipe(finalize(() => {
        this.loading = false;
        this.uiTick(); // 👈 clave: apaga loading y fuerza repaint
      }))
      .subscribe({
        next: (data) => {
          this.unidades = data ?? [];
          this.uiTick(); // 👈 clave: pinta tabla sin necesidad de click
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo cargar unidades';
          this.uiTick();
        },
      });
  }

  startCreate() {
    this.okMsg = '';
    this.errorMsg = '';
    this.resetFormOnly();
    this.uiTick();
  }

  startEdit(u: UnidadInmobiliaria) {
    this.okMsg = '';
    this.errorMsg = '';
    this.editingId = (u as any).id ?? null;

    this.form.patchValue({
      proyecto: u.proyecto ?? '',
      ubicacion: u.ubicacion ?? '',
      valorInmueble: u.valorInmueble ?? 0,
      aplicaTechoPropio: !!u.aplicaTechoPropio,
      bonoTechoPropio: u.bonoTechoPropio ?? 0,
    });

    // habilitar/deshabilitar bono según checkbox
    const bonoCtrl = this.form.get('bonoTechoPropio');
    if (u.aplicaTechoPropio) bonoCtrl?.enable({ emitEvent: false });
    else bonoCtrl?.disable({ emitEvent: false });

    this.uiTick();
  }

  cancelEdit() {
    this.okMsg = '';
    this.errorMsg = '';
    this.resetFormOnly();
    this.uiTick();
  }

  submit() {
    this.okMsg = '';
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.uiTick();
      return;
    }

    this.saving = true;
    this.uiTick();

    // getRawValue() incluye bono aunque esté disabled
    const payload: UnidadInmobiliaria = this.form.getRawValue();

    // CREATE
    if (!this.editingId) {
      this.unidadService.create(payload)
        .pipe(finalize(() => {
          this.saving = false;
          this.uiTick();
        }))
        .subscribe({
          next: (created) => {
            this.unidades = [created, ...this.unidades];
            this.okMsg = 'Unidad creada correctamente';
            this.resetFormOnly();
            this.uiTick();
          },
          error: (err) => {
            this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo crear unidad';
            this.uiTick();
          },
        });

      return;
    }

    // UPDATE
    this.unidadService.update(this.editingId, payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.uiTick();
      }))
      .subscribe({
        next: (updated) => {
          this.unidades = this.unidades.map(u => u.id === updated.id ? updated : u);
          this.okMsg = 'Unidad actualizada correctamente';
          this.resetFormOnly();
          this.uiTick();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo actualizar unidad';
          this.uiTick();
        },
      });
  }

  remove(id: number) {
    if (!id) return;

    this.okMsg = '';
    this.errorMsg = '';

    this.loading = true; // muestra skeleton mientras elimina (opcional)
    this.uiTick();

    this.unidadService.delete(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.uiTick();
      }))
      .subscribe({
        next: () => {
          this.unidades = this.unidades.filter(u => u.id !== id);
          this.okMsg = 'Unidad eliminada';
          this.uiTick();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo eliminar unidad';
          this.uiTick();
        },
      });
  }

  trackById = (_: number, item: any) => item?.id;
}
