
export interface Documento {
  id_documento: number;
  rut_emisor: number;
  nombre: string;
  ruta_archivo: string;
  fecha_creacion: string;
  estado: string;
}

export interface DocumentoResponse {
  message: string;
  documento: Documento;
}

export interface DescargarDocumentoResponse {
  message: string;
  documento: {
    id_documento: number;
    nombre: string;
  };
  url: string;
  expiraEn: number;
}
