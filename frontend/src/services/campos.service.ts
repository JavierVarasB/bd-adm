
import api from "./api";

import type {
  CampoDocumento,
  CrearCampoDTO,
  ActualizarCampoDTO
} from "../types/campos.types";

// Obtener campos configurados de un documento
export const obtenerCampos = async (
  idDocumento: number
): Promise<CampoDocumento[]> => {

  const respuesta = await api.get<CampoDocumento[]>(
    `/documentos/${idDocumento}/campos`
  );

  return respuesta.data;
};

// Crear un campo
export const crearCampo = async (
  idDocumento: number,
  datos: CrearCampoDTO
): Promise<CampoDocumento> => {

  const respuesta = await api.post<CampoDocumento>(
    `/documentos/${idDocumento}/campos`,
    datos
  );

  return respuesta.data;
};

// Modificar un campo
export const actualizarCampo = async (
  idCampo: number,
  datos: ActualizarCampoDTO
): Promise<CampoDocumento> => {

  const respuesta = await api.patch<CampoDocumento>(
    `/campos/${idCampo}`,
    datos
  );

  return respuesta.data;
};

// Eliminar un campo
export const eliminarCampo = async (
  idCampo: number
): Promise<void> => {

  await api.delete(`/campos/${idCampo}`);
};
