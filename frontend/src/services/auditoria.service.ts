
import api from "./api";

import type {
  FiltrosAuditoria,
  RespuestaAuditoria
} from "../types/auditoria.types";

// Obtener registros de auditoría
export const obtenerEventosAuditoria = async (
  filtros: FiltrosAuditoria
): Promise<RespuestaAuditoria> => {

  const respuesta = await api.get<RespuestaAuditoria>(
    "/auditoria",
    {
      params: filtros
    }
  );

  return respuesta.data;
};
