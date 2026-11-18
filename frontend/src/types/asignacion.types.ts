
export interface Asignacion {
  id_asignacion: number;
  estado: string;
  fecha_envio: string | null;
  fecha_visualizacion: string | null;
  archivo_firmado: string | null;
  archivo_completado: string | null;

  documento: {
    id_documento: number;
    nombre: string;
    fecha_creacion: string;
    estado: string;
    emisor: {
      rut: number;
      nombre: string;
    };
  };

  receptor: {
    rut: number;
    nombre: string;
    correo: string;
  };
}
