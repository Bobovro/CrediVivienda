import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuditPage } from '../model/audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly API = 'http://localhost:8080/api/admin/audit';

  constructor(private http: HttpClient) {}

  listar(params?: {
    page?: number;
    size?: number;
    sort?: string;
    dir?: 'asc' | 'desc';
    entidad?: string;
    accion?: string;
    username?: string;
  }): Observable<AuditPage> {
    const p = params ?? {};

    let httpParams = new HttpParams()
      .set('page', String(p.page ?? 0))
      .set('size', String(p.size ?? 20))
      .set('sort', String(p.sort ?? 'fecha'))
      .set('dir', String(p.dir ?? 'desc'));

    if (p.entidad) httpParams = httpParams.set('entidad', p.entidad);
    if (p.accion) httpParams = httpParams.set('accion', p.accion);
    if (p.username) httpParams = httpParams.set('username', p.username);

    return this.http.get<AuditPage>(this.API, { params: httpParams });
  }
}
