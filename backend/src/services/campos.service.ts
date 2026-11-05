import { prisma } from "../config/prisma.js";
import { Rol } from "../../generated/prisma/client.js";

export const TIPOS_CAMPO = [
  "TEXTO",
  "NUMERO",
  "FECHA",
  "CHECKBOX"
] as const;

export type TipoCampo = typeof TIPOS_CAMPO[number];

export interface DatosCampo {
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

export class ErrorCampo extends Error {
  constructor(
    public codigo: number,
    mensaje: string
  ) {
    super(mensaje);
  }
}

// Verificar acceso al documento
export const comprobarAccesoDocumento = async (
  idDocumento: number,
  rut: number,
  rol: Rol,
  edicion = false
) => {
  const documento = await prisma.documentos.findFirst({
    where: {
      id_documento: idDocumento,
      ...(rol === Rol.ADMIN
        ? {}
        : edicion || rol === Rol.JEFE
          ? { rut_emisor: rut }
          : {
              asignaciones: {
                some: { rut_receptor: rut }
              }
            })
    },
    select: { id_documento: true }
  });

  if (!documento) {
    throw new ErrorCampo(404, "Documento no encontrado");
  }
};

// Evitar cambios cuando ya hay destinatarios
const comprobarEditable = async (idDocumento: number) => {
  const cantidad = await prisma.asignacionDocumento.count({
    where: { id_documento: idDocumento }
  });

  if (cantidad > 0) {
    throw new ErrorCampo(
      409,
      "No puedes modificar campos de un documento ya asignado"
    );
  }
};

// Crear campo
export const crearCampo = async (
  idDocumento: number,
  rut: number,
  rol: Rol,
  datos: DatosCampo
) => {
  await comprobarAccesoDocumento(
    idDocumento,
    rut,
    rol,
    true
  );

  await comprobarEditable(idDocumento);

  return prisma.camposDocumento.create({
    data: {
      nombre: datos.nombre,
      tipo: datos.tipo,
      obligatorio: datos.obligatorio,

      pagina: datos.pagina ?? 1,
      posicion_x: datos.posicion_x ?? null,
      posicion_y: datos.posicion_y ?? null,
      ancho: datos.ancho ?? null,
      alto: datos.alto ?? null,
      tamano_fuente: datos.tamano_fuente ?? 10,

      document: {
        connect: {
          id_documento: idDocumento
        }
      }
    }
  });
};


// Listar campos de un documento
export const obtenerCampos = async (
  idDocumento: number,
  rut: number,
  rol: Rol
) => {
  await comprobarAccesoDocumento(idDocumento, rut, rol);

  return prisma.camposDocumento.findMany({
    where: { id_documento: idDocumento },
    orderBy: { id_campo: "asc" }
  });
};

// Modificar campo
export const actualizarCampo = async (
  idCampo: number,
  rut: number,
  rol: Rol,
  datos: Partial<DatosCampo>
) => {
  const campo = await prisma.camposDocumento.findUnique({
    where: { id_campo: idCampo }
  });

  if (!campo) {
    throw new ErrorCampo(404, "Campo no encontrado");
  }

  await comprobarAccesoDocumento(
    campo.id_documento, rut, rol, true
  );

  await comprobarEditable(campo.id_documento);

  return prisma.camposDocumento.update({
    where: { id_campo: idCampo },
    data: datos
  });
};

// Eliminar campo
export const eliminarCampo = async (
  idCampo: number,
  rut: number,
  rol: Rol
) => {
  const campo = await prisma.camposDocumento.findUnique({
    where: { id_campo: idCampo }
  });

  if (!campo) {
    throw new ErrorCampo(404, "Campo no encontrado");
  }

  await comprobarAccesoDocumento(
    campo.id_documento, rut, rol, true
  );

  await comprobarEditable(campo.id_documento);

  return prisma.camposDocumento.delete({
    where: { id_campo: idCampo }
  });
};