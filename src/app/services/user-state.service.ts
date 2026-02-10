import { Injectable } from '@angular/core';

const ROLES_KEY = 'roles';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  setRoles(roles: string[]) { localStorage.setItem(ROLES_KEY, JSON.stringify(roles)); }
  getRoles(): string[] {
    const raw = localStorage.getItem(ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
  clear() { localStorage.removeItem(ROLES_KEY); }
}
