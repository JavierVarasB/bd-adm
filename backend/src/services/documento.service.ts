import { prisma } from "../config/prisma.js";
import { Rol } from "../../generated/prisma/client.js";

// Campos que devolveremos al consultar documentos
const documentoSelect = {
  id_documento: true,
  rut_emisor: true,
  nombre: true,
  ruta_archivo: true,
  fecha_creacion: true,
  estado: true,
  emisor: {
    select: {
      rut: true,
      nombre: true,
      correo: true,
      rol: true
    }
  }
} as const;

// Crear documento
export const crearDocumento = async (
  rutEmisor: number,
  nombre: string,
  rutaArchivo: string
) => {
  return prisma.documentos.create({
    data: {
      nombre,
      ruta_archivo: rutaArchivo,
      estado: "CREADO",
      emisor: {
        connect: {
          rut: rutEmisor
        }
      }
    },
    select: documentoSelect
  });
};

// Listar documentos
export const obtenerDocumentos = async (
  rutUsuario: number,
  esAdmin: boolean
) => {
  return prisma.documentos.findMany({
    where: esAdmin
      ? {}
      : { rut_emisor: rutUsuario },
    select: documentoSelect,
    orderBy: {
      fecha_creacion: "desc"
    }
  });
};

// Buscar documento por ID
export const obtenerDocumentoPorId = async (
  id: number,
  rutUsuario: number,
  esAdmin: boolean
) => {
  return prisma.documentos.findFirst({
    where: {
      id_documento: id,
      ...(esAdmin ? {} : { rut_emisor: rutUsuario })
    },
    select: documentoSelect
  });
};

//Obtener documento desde storage para descarga
export const obtenerDocumentoParaDescarga = async (
  idDocumento: number,
  rutUsuario: number,
  rolUsuario: Rol
) => {
  return prisma.documentos.findFirst({
    where: {
      id_documento: idDocumento,

      ...(rolUsuario === Rol.ADMIN
        ? {}
        : rolUsuario === Rol.JEFE
          ? {
              rut_emisor: rutUsuario
            }
          : {
              asignaciones: {
                some: {
                  rut_receptor: rutUsuario
                }
              }
            })
    },

    select: {
      id_documento: true,
      nombre: true,
      ruta_archivo: true
    }
  });
};