
export type TipoCampo =
  | "TEXTO"
  | "NUMERO"
  | "FECHA"
  | "CHECKBOX";

export interface CampoDocumento {
  id_campo: number;
  id_documento: number;
  nombre: string;
  tipo: TipoCampo;
  obligatorio: boolean;

  pagina: number;

  posicion_x: number | null;
  posicion_y: number | null;
  ancho: number | null;
  alto: number | null;

  tamano_fuente: number;
}

export interface CrearCampoDTO {
  nombre: string;
  tipo: TipoCampo;
  obligatorio: boolean;

  pagina?: number;
  posicion_x?: number;
  posicion_y?: number;
  ancho?: number;
  alto?: number;
  tamano_fuente?: number;
}

export type ActualizarCampoDTO =
  Partial<CrearCampoDTO>;
