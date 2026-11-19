import { prisma } from "../config/prisma.js";
import { Rol } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

interface RegistrarAuditoriaDTO {
  rut_usuario: number | null;
  nombre_usuario: string;
  rol_usuario: Rol;
  accion: string;
  modulo: string;
  descripcion?: string;
  id_registro?: number | null;
}

interface FiltrosAuditoria {
  pagina: number;
  limite: number;
  busqueda?: string;
  modulo?: string;
  accion?: string;
}

export const registrarEventoAuditoria = async (
  datos: RegistrarAuditoriaDTO
): Promise<void> => {
  try {
    await prisma.auditoria.create({
      data: {
        rut_usuario: datos.rut_usuario,
        nombre_usuario: datos.nombre_usuario,
        rol_usuario: datos.rol_usuario,
        accion: datos.accion,
        modulo: datos.modulo,
        descripcion: datos.descripcion ?? null,
        id_registro: datos.id_registro ?? null
      }
    });

  } catch (error) {
    console.error(
      "No fue posible registrar el evento de auditoría:",
      error
    );
  }
};



export const obtenerEventosAuditoria = async (
  filtros: FiltrosAuditoria
) => {

  const where: Prisma.AuditoriaWhereInput = {};

  // Filtrar por módulo
  if (filtros.modulo) {
    where.modulo = filtros.modulo;
  }

  // Filtrar por acción
  if (filtros.accion) {
    where.accion = filtros.accion;
  }

  // Buscar por nombre de usuario o descripción
  if (filtros.busqueda) {
    where.OR = [
      {
        nombre_usuario: {
          contains: filtros.busqueda,
          mode: "insensitive"
        }
      },
      {
        descripcion: {
          contains: filtros.busqueda,
          mode: "insensitive"
        }
      }
    ];
  }

  const skip = (filtros.pagina - 1) * filtros.limite;

  const [eventos, total] = await prisma.$transaction([

    prisma.auditoria.findMany({
      where,
      orderBy: [
        { fecha: "desc" },
        { id_auditoria: "desc" }
      ],
      skip,
      take: filtros.limite
    }),

    prisma.auditoria.count({
      where
    })

  ]);

  return {
    eventos,
    paginacion: {
      pagina: filtros.pagina,
      limite: filtros.limite,
      total,
      totalPaginas: Math.ceil(total / filtros.limite)
    }
  };
};

