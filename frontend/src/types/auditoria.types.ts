
export interface EventoAuditoria {
  id_auditoria: number;
  rut_usuario: number | null;
  nombre_usuario: string;
  rol_usuario: "ADMIN" | "JEFE" | "TRABAJADOR";
  accion: string;
  modulo: string;
  descripcion: string | null;
  id_registro: number | null;
  fecha: string;
}

export interface PaginacionAuditoria {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface RespuestaAuditoria {
  eventos: EventoAuditoria[];
  paginacion: PaginacionAuditoria;
}

export interface FiltrosAuditoria {
  pagina: number;
  limite: number;
  busqueda?: string;
  modulo?: string;
  accion?: string;
}
