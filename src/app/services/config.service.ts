// config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../model/config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private baseUrl = 'http://localhost:8080/api/config';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<AppConfig> {
    return this.http.get<AppConfig>(this.baseUrl);
  }

  updateConfig(payload: AppConfig): Observable<AppConfig> {
    return this.http.put<AppConfig>(this.baseUrl, payload);
  }
}
