import { Component, HostListener, OnInit } from '@angular/core';
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
export class HomeLayout implements OnInit {
  isMobile = false;
  menuOpen = false;

  // ancho donde quieres que se “vuelva móvil”
  private readonly MOBILE_BP = 900;

  constructor(
    private auth: AuthService,
    private router: Router,
    private state: UserStateService
  ) {}

  ngOnInit(): void {
    this.checkScreen();
  }

  @HostListener('window:resize')
  checkScreen() {
    const mobileNow = window.innerWidth <= this.MOBILE_BP;

    // si cambió el modo, resetea drawer
    if (mobileNow !== this.isMobile) {
      this.isMobile = mobileNow;
      this.menuOpen = false;
    } else {
      this.isMobile = mobileNow;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  onNavClick() {
    // al navegar en mobile, cierra el menú
    if (this.isMobile) this.closeMenu();
  }

  isAdmin(): boolean {
    return this.state.hasRole('ADMIN') || this.state.hasRole('ROLE_ADMIN');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
