import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UnidadInmobiliaria } from '../model/unidad-inmobiliaria.model';

@Injectable({ providedIn: 'root' })
export class UnidadInmobiliariaService {
  private baseUrl = 'http://localhost:8080/api/unidades';

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<UnidadInmobiliaria[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<UnidadInmobiliaria>(`${this.baseUrl}/${id}`);
  }

  create(body: Partial<UnidadInmobiliaria>) {
    return this.http.post<UnidadInmobiliaria>(this.baseUrl, body);
  }

  update(id: number, body: Partial<UnidadInmobiliaria>) {
    return this.http.put<UnidadInmobiliaria>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
