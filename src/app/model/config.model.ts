export type Moneda = 'PEN' | 'USD';
export type TipoTasa = 'EFECTIVA' | 'NOMINAL';
export type Capitalizacion = 'DIARIA' | 'MENSUAL' | 'ANUAL';

export interface AppConfig {
  monedaDefault: Moneda;
  tipoTasaDefault: TipoTasa;
  capitalizacion?: Capitalizacion; // solo si NOMINAL
  graciaTipo: 'NINGUNA' | 'TOTAL' | 'PARCIAL';
  graciaPeriodos: number; // 0..n
}
