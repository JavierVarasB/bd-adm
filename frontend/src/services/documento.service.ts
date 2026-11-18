
import api from "./api";

import type {
  Documento,
  DocumentoResponse,
  DescargarDocumentoResponse
} from "../types/documento.types";

// Listar documentos
export const obtenerDocumentos = async (): Promise<Documento[]> => {

  const respuesta = await api.get<Documento[]>("/documentos");

  return respuesta.data;
};

// Consultar documento por ID
export const obtenerDocumento = async (
  id: number
): Promise<Documento> => {

  const respuesta = await api.get<Documento>(
    `/documentos/${id}`
  );

  return respuesta.data;
};

// Subir documento PDF
export const subirDocumento = async (
  nombre: string,
  archivo: File
): Promise<DocumentoResponse> => {

  const formulario = new FormData();

  formulario.append("nombre", nombre);
  formulario.append("archivo", archivo);

  const respuesta = await api.post<DocumentoResponse>(
    "/documentos/upload",
    formulario
  );

  return respuesta.data;
};


// Obtener URL temporal para visualizar o descargar
export const descargarDocumento = async (
  id: number,
  descargar: boolean = false
): Promise<DescargarDocumentoResponse> => {

  const respuesta = await api.get<DescargarDocumentoResponse>(
    `/documentos/${id}/descargar`,
    {
      params: {
        download: descargar
      }
    }
  );

  return respuesta.data;
};

