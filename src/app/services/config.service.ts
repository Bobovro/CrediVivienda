import { Injectable } from '@angular/core';
import { AppConfig } from '../model/config.model';

const KEY = 'mv_config';

const DEFAULT_CONFIG: AppConfig = {
  monedaDefault: 'PEN',
  tipoTasaDefault: 'EFECTIVA',
  capitalizacion: 'MENSUAL',
  graciaTipo: 'NINGUNA',
  graciaPeriodos: 0,
};

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get(): AppConfig {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as AppConfig;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  set(cfg: AppConfig): void {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  }

  reset(): void {
    localStorage.removeItem(KEY);
  }
}
