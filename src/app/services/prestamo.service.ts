import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestamo } from '../model/prestamo.model';

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  private baseUrl = 'http://localhost:8080/api/prestamos';

  constructor(private http: HttpClient) {}

  simular(payload: Prestamo): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.baseUrl}/simular`, payload);
  }

  create(payload: Prestamo): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.baseUrl, payload);
  }

  list(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(this.baseUrl);
  }

  getById(id: number): Observable<Prestamo> {
    return this.http.get<Prestamo>(`${this.baseUrl}/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
