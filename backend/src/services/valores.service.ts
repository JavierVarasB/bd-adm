import { prisma } from "../config/prisma.js";
import { Rol } from "../../generated/prisma/client.js";
import { ErrorCampo } from "./campos.service.js";

interface RespuestaCampo {
  id_campo: number;
  valor: string;
}

const validarValor = (tipo: string, valor: string): boolean => {
  switch (tipo) {
    case "TEXTO":
      return valor.length <= 1000;

    case "NUMERO":
      return valor.trim() !== "" &&
        Number.isFinite(Number(valor));

    case "FECHA": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

      const fecha = new Date(`${valor}T00:00:00.000Z`);

      return !Number.isNaN(fecha.getTime()) &&
        fecha.toISOString().slice(0, 10) === valor;
    }

    case "CHECKBOX":
      return valor === "true" || valor === "false";

    default:
      return false;
  }
};

// Guardar todas las respuestas de una asignación
export const guardarValores = async (
  idAsignacion: number,
  rut: number,
  respuestas: RespuestaCampo[]
) => {
  return prisma.$transaction(async (tx) => {
    const asignacion = await tx.asignacionDocumento.findFirst({
      where: {
        id_asignacion: idAsignacion,
        rut_receptor: rut
      },
      include: {
        documento: {
          include: {
            campos: true
          }
        }
      }
    });

    if (!asignacion) {
      throw new ErrorCampo(404, "Asignación no encontrada");
    }

    if (asignacion.estado === "FIRMADO") {
      throw new ErrorCampo(
        409,
        "No puedes modificar un documento firmado"
      );
    }

    const campos = asignacion.documento.campos;

    const ids = respuestas.map(r => r.id_campo);

    if (new Set(ids).size !== ids.length) {
      throw new ErrorCampo(400, "Hay campos repetidos");
    }

    const mapaCampos = new Map(
      campos.map(campo => [campo.id_campo, campo])
    );

    // Comprobar que cada campo pertenece al documento
    for (const respuesta of respuestas) {
      const campo = mapaCampos.get(respuesta.id_campo);

      if (!campo) {
        throw new ErrorCampo(
          400,
          "Uno o más campos no pertenecen al documento"
        );
      }

      if (!validarValor(campo.tipo, respuesta.valor)) {
        throw new ErrorCampo(
          400,
          `Valor inválido para el campo ${campo.nombre}`
        );
      }
    }

    // Comprobar todos los campos obligatorios
    for (const campo of campos) {
      if (!campo.obligatorio) continue;

      const respuesta = respuestas.find(
        r => r.id_campo === campo.id_campo
      );

      if (
        !respuesta ||
        respuesta.valor.trim() === "" ||
        (campo.tipo === "CHECKBOX" &&
          respuesta.valor !== "true")
      ) {
        throw new ErrorCampo(
          400,
          `Falta completar el campo obligatorio: ${campo.nombre}`
        );
      }
    }

    // Reemplazar las respuestas de manera transaccional
    await tx.valoresCampo.deleteMany({
      where: { id_asignacion: idAsignacion }
    });

    if (respuestas.length > 0) {
      await tx.valoresCampo.createMany({
        data: respuestas.map(r => ({
          id_asignacion: idAsignacion,
          id_campo: r.id_campo,
          valor: r.valor
        }))
      });
    }

    return tx.valoresCampo.findMany({
      where: { id_asignacion: idAsignacion },
      orderBy: { id_campo: "asc" }
    });
  });
};

// Consultar respuestas según permisos
export const obtenerValores = async (
  idAsignacion: number,
  rut: number,
  rol: Rol
) => {
  const asignacion = await prisma.asignacionDocumento.findFirst({
    where: {
      id_asignacion: idAsignacion,
      ...(rol === Rol.ADMIN
        ? {}
        : rol === Rol.JEFE
          ? {
              documento: {
                is: { rut_emisor: rut }
              }
            }
          : {
              rut_receptor: rut
            })
    },
    select: { id_asignacion: true }
  });

  if (!asignacion) {
    throw new ErrorCampo(404, "Asignación no encontrada");
  }

  return prisma.valoresCampo.findMany({
    where: { id_asignacion: idAsignacion },
    include: {
      campo: {
        select: {
          nombre: true,
          tipo: true,
          obligatorio: true
        }
      }
    },
    orderBy: { id_campo: "asc" }
  });
};