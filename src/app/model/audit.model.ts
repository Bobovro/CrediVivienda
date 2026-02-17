export interface AuditLog {
  id: number;
  fecha: string;
  username: string;
  roles: string;
  accion: string;
  entidad: string;
  entidadId: number;
  detalle: string;
}

export interface AuditPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
