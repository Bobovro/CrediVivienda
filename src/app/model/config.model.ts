export type Moneda = 'PEN' | 'USD';
export type TipoTasa = 'EFECTIVA' | 'NOMINAL';
export type Capitalizacion = 'DIARIA' | 'MENSUAL' | 'ANUAL';
export type GraciaTipo = 'NINGUNA' | 'TOTAL' | 'PARCIAL';

export interface AppConfig {
  id?: number;
  monedaDefault: Moneda;
  tipoTasaDefault: TipoTasa;
  capitalizacion?: Capitalizacion | null;
  graciaTipo: GraciaTipo;
  graciaPeriodos: number;
}
