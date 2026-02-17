export interface Cuota {
  id?: number;
  numeroCuota: number;
  saldoInicial: number;
  amortizacion: number;
  interes: number;
  cuotaTotal: number;
  saldoFinal: number;
  esGraciaTotal?: boolean;
  esGraciaParcial?: boolean;
  fechaVencimiento?: string;
  fechaSimulacion?: string;
// "YYYY-MM-DD"
}

export interface Prestamo {
  id?: number;

  clienteId: number;
  unidadInmobiliariaId: number;

  montoPrestamo: number;
  plazoMeses: number;

  moneda: 'PEN' | 'USD';
  tipoTasa: 'EFECTIVA' | 'NOMINAL';
  capitalizacion?: 'DIARIA' | 'MENSUAL' | 'ANUAL' | null;

  tasaInteres: number;

  graciaTotal?: number;
  graciaParcial?: number;

  // resultados
  van?: number;
  tir?: number;
  cuotaFija?: number;
  interesesTotales?: number;
  montoTotalPagado?: number;
  tcea?: number;

  fechaSimulacion?: string;
  cronograma?: Cuota[];
}
