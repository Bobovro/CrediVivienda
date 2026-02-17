import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cliente } from '../model/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private baseUrl = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<Cliente[]>(this.baseUrl);
  }

  getById(id: number) {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  create(body: Cliente) {
    return this.http.post<Cliente>(this.baseUrl, body);
  }

  update(id: number, body: Cliente) {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
