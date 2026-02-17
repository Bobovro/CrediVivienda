export interface Cliente {
  id?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email?: string;
  telefono?: string;
  ingresoMensual?: number;
  gastoMensual?: number;
}
