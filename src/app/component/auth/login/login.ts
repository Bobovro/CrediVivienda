import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  loading = false;
  errorMsg = '';
  form: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]], // DNI
      password: ['', [Validators.required]],
    });
  }

  submit() {
    this.errorMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigateByUrl('/home/dashboard'),
      error: (err) => {
        this.errorMsg =
          err?.error?.message ?? err?.error ?? 'Credenciales inválidas';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
