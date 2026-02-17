import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';

import { finalize } from 'rxjs/operators';

import { ClienteService } from '../../../services/cliente.service';
import { Cliente } from '../../../model/cliente.model';

@Component({
  selector: 'app-home-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './home-clientes.html',
  styleUrls: ['./home-clientes.css'],
})
export class HomeClientes implements OnInit {
  clientes: Cliente[] = [];
  loading = false;
  saving = false;
  errorMsg = '';
  okMsg = '';

  editingId: number | null = null;

  form!: FormGroup;

  query = '';

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      email: [''],
      telefono: [''],
      ingresoMensual: [0],
      gastoMensual: [0],
    });
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  get filteredClientes(): Cliente[] {
    const q = (this.query || '').trim().toLowerCase();
    if (!q) return this.clientes;

    return this.clientes.filter((c) => {
      const dni = (c.dni ?? '').toString().toLowerCase();
      const nombres = (c.nombres ?? '').toLowerCase();
      const apellidos = (c.apellidos ?? '').toLowerCase();
      const email = (c.email ?? '').toLowerCase();
      const telefono = (c.telefono ?? '').toLowerCase();

      return (
        dni.includes(q) ||
        nombres.includes(q) ||
        apellidos.includes(q) ||
        email.includes(q) ||
        telefono.includes(q)
      );
    });
  }

  clearSearch() {
    this.query = '';
  }

  private resetFormOnly() {
    this.editingId = null;
    this.form.reset({
      nombres: '',
      apellidos: '',
      dni: '',
      email: '',
      telefono: '',
      ingresoMensual: 0,
      gastoMensual: 0,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  loadClientes() {
    this.loading = true;
    this.errorMsg = '';

    this.clienteService.list()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.clientes = data ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo cargar clientes';
        },
      });
  }

  startCreate() {
    this.okMsg = '';
    this.errorMsg = '';
    this.resetFormOnly();
  }

  startEdit(c: Cliente) {
    this.okMsg = '';
    this.errorMsg = '';
    this.editingId = (c as any).id ?? null;

    this.form.patchValue({
      nombres: (c as any).nombres ?? '',
      apellidos: (c as any).apellidos ?? '',
      dni: (c as any).dni ?? '',
      email: (c as any).email ?? '',
      telefono: (c as any).telefono ?? '',
      ingresoMensual: (c as any).ingresoMensual ?? 0,
      gastoMensual: (c as any).gastoMensual ?? 0,
    });
  }

  cancelEdit() {
    this.okMsg = '';
    this.errorMsg = '';
    this.resetFormOnly();
  }

  submit() {
    this.okMsg = '';
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.form.getRawValue();

    // CREATE
    if (!this.editingId) {
      this.clienteService.create(payload)
        .pipe(finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (created: Cliente) => {
            this.clientes = [created, ...this.clientes];

            this.okMsg = 'Cliente creado correctamente';
            this.resetFormOnly();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo crear cliente';
          },
        });

      return;
    }

    this.clienteService.update(this.editingId, payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (updated: Cliente) => {
          this.clientes = this.clientes.map(c => c.id === updated.id ? updated : c);
          this.okMsg = 'Cliente actualizado correctamente';
          this.resetFormOnly();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo actualizar cliente';
        },
      });
  }

  remove(id: number) {
    if (!id) return;

    this.okMsg = '';
    this.errorMsg = '';

    this.clienteService.delete(id)
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: () => {
          this.clientes = this.clientes.filter(c => c.id !== id);
          this.okMsg = 'Cliente eliminado';
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo eliminar cliente';
        },
      });
  }

  trackById = (_: number, item: any) => item?.id;
}
