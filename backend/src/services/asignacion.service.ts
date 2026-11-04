import { prisma } from "../config/prisma.js";
import { Rol } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";


// Asignar un documento a varios trabajadores
export const asignarDocumento = async (
  idDocumento: number,
  rutEmisor: number,
  rolEmisor: Rol,
  rutReceptores: number[]
) => {

  return prisma.$transaction(async (tx) => {

    // 1. Comprobar que el documento exista
    const documento = await tx.documentos.findUnique({
      where: {
        id_documento: idDocumento
      },
      select: {
        id_documento: true,
        rut_emisor: true,
        nombre: true
      }
    });

    if (!documento) {
      throw new Error("DOCUMENTO_NO_ENCONTRADO");
    }

    // 2. Comprobar que el emisor tenga acceso
    if (
      rolEmisor !== Rol.ADMIN &&
      documento.rut_emisor !== rutEmisor
    ) {
      throw new Error("DOCUMENTO_NO_AUTORIZADO");
    }

    // 3. Buscar los trabajadores destinatarios
    const trabajadores = await tx.usuario.findMany({
      where: {
        rut: {
          in: rutReceptores
        },
        rol: Rol.TRABAJADOR
      },
      select: {
        rut: true,
        nombre: true,
        correo: true
      }
    });

    // 4. Comprobar que todos existan y sean trabajadores
    if (trabajadores.length !== rutReceptores.length) {
      throw new Error("DESTINATARIOS_INVALIDOS");
    }

    // 5. Crear las asignaciones
    const resultado = await tx.asignacionDocumento.createMany({
      data: rutReceptores.map((rut) => ({
        id_documento: idDocumento,
        rut_receptor: rut,
        estado: "PENDIENTE",
        fecha_envio: new Date()
      }))
    });

    return {
      documento,
      trabajadores,
      cantidad_asignada: resultado.count
    };

  });
};



const asignacionSelect = {
  id_asignacion: true,
  estado: true,
  fecha_envio: true,
  fecha_visualizacion: true,
  archivo_firmado: true,
  documento: {
    select: {
      id_documento: true,
      nombre: true,
      fecha_creacion: true,
      estado: true,
      emisor: {
        select: {
          rut: true,
          nombre: true
        }
      }
    }
  },
  receptor: {
    select: {
      rut: true,
      nombre: true,
      correo: true
    }
  }
} satisfies Prisma.AsignacionDocumentoSelect;

// Filtro reutilizable de autorización
const filtroAcceso = (
  rut: number,
  rol: Rol
): Prisma.AsignacionDocumentoWhereInput => {
  if (rol === Rol.ADMIN) {
    return {};
  }

  if (rol === Rol.JEFE) {
    return {
      documento: {
        is: { rut_emisor: rut }
      }
    };
  }

  return { rut_receptor: rut };
};

// Listar asignaciones según los permisos
export const obtenerAsignaciones = async (
  rut: number,
  rol: Rol
) => {
  return prisma.asignacionDocumento.findMany({
    where: filtroAcceso(rut, rol),
    select: asignacionSelect,
    orderBy: {
      id_asignacion: "desc"
    }
  });
};

// Consultar documentos recibidos por el usuario
export const obtenerMisDocumentos = async (rut: number) => {
  return prisma.asignacionDocumento.findMany({
    where: { rut_receptor: rut },
    select: asignacionSelect,
    orderBy: {
      id_asignacion: "desc"
    }
  });
};

// Buscar una asignación según los permisos
export const obtenerAsignacionPorId = async (
  id: number,
  rut: number,
  rol: Rol
) => {
  return prisma.asignacionDocumento.findFirst({
    where: {
      id_asignacion: id,
      ...filtroAcceso(rut, rol)
    },
    select: asignacionSelect
  });
};


export const registrarVisualizacion = async (
  idAsignacion: number,
  rutTrabajador: number
) => {
  // Actualización condicional para evitar sobrescribir
  // la primera fecha de visualización.
  const resultado = await prisma.asignacionDocumento.updateMany({
    where: {
      id_asignacion: idAsignacion,
      rut_receptor: rutTrabajador,
      estado: "PENDIENTE",
      fecha_visualizacion: null
    },
    data: {
      estado: "VISUALIZADO",
      fecha_visualizacion: new Date()
    }
  });

  // Consultar el registro autorizado y actualizado
  const asignacion = await prisma.asignacionDocumento.findFirst({
    where: {
      id_asignacion: idAsignacion,
      rut_receptor: rutTrabajador
    },
    select: asignacionSelect
  });

  return {
    asignacion,
    primeraVisualizacionRegistrada: resultado.count === 1
  };
};