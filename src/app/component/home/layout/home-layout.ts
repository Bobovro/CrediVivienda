import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-layout.html',
  styleUrls: ['./home-layout.css'],
})
export class HomeLayout {
  constructor(
    private auth: AuthService,
    private router: Router,
    private state: UserStateService
  ) {}

  isAdmin(): boolean {
    return this.state.hasRole('ADMIN') || this.state.hasRole('ROLE_ADMIN');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
