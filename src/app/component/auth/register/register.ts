import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  loading = false;
  errorMsg = '';
  okMsg = '';

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      dni: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    this.errorMsg = '';
    this.okMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: (msg) => {
        this.okMsg = msg || 'Usuario registrado correctamente';
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? err?.error ?? 'No se pudo registrar';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
