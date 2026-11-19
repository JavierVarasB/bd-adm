
import api from "./api";

import type {
  Asignacion
} from "../types/asignacion.types";

// Respuesta del backend al asignar documentos
export interface AsignarDocumentoResponse {
  message: string;
  documento: {
    id_documento: number;
    rut_emisor: number;
    nombre: string;
  };
  trabajadores: {
    rut: number;
    nombre: string;
    correo: string;
  }[];
  cantidad_asignada: number;
}

// Obtener asignaciones según el rol autenticado
export const obtenerAsignaciones = async (): Promise<Asignacion[]> => {
  const respuesta = await api.get<Asignacion[]>("/asignaciones");

  return respuesta.data;
};

// Asignar documento a uno o varios trabajadores
export const asignarDocumento = async (
  idDocumento: number,
  rutReceptores: number[]
): Promise<AsignarDocumentoResponse> => {

  const respuesta = await api.post<AsignarDocumentoResponse>(
    `/documentos/${idDocumento}/asignaciones`,
    {
      rut_receptores: rutReceptores
    }
  );

  return respuesta.data;
};
