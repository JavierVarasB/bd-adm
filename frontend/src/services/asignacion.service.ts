
import api from "./api";

import type {
  Asignacion
} from "../types/asignacion.types";

// Obtener asignaciones según el rol del usuario autenticado
export const obtenerAsignaciones = async (): Promise<Asignacion[]> => {

  const respuesta = await api.get<Asignacion[]>("/asignaciones");

  return respuesta.data;
};
