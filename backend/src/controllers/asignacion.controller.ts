
import type { Request, Response } from "express";
import {
  obtenerAsignaciones,
  obtenerMisDocumentos,
  obtenerAsignacionPorId,
  registrarVisualizacion,
  asignarDocumento
} from "../services/asignacion.service.js";

import { Rol } from "../../generated/prisma/client.js";

export const registrarAsignaciones = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    // 1. Comprobar autenticación
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    // 2. Validar ID del documento
    const idParam = req.params.id;

    if (
      typeof idParam !== "string" ||
      !/^\d+$/.test(idParam)
    ) {
      res.status(400).json({
        message: "ID de documento inválido"
      });
      return;
    }

    const idDocumento = Number(idParam);

    if (
      !Number.isSafeInteger(idDocumento) ||
      idDocumento <= 0 ||
      idDocumento > 2147483647
    ) {
      res.status(400).json({
        message: "ID de documento inválido"
      });
      return;
    }

    // 3. Validar los destinatarios
    const rutReceptores: unknown = req.body.rut_receptores;

    if (
      !Array.isArray(rutReceptores) ||
      rutReceptores.length === 0 ||
      rutReceptores.length > 500
    ) {
      res.status(400).json({
        message: "Debes indicar entre 1 y 500 trabajadores"
      });
      return;
    }

    // 4. Validar cada RUT
    const validos = rutReceptores.every(
      (rut): rut is number =>
        typeof rut === "number" &&
        Number.isSafeInteger(rut) &&
        rut > 0 &&
        rut <= 2147483647
    );

    if (!validos) {
      res.status(400).json({
        message: "La lista contiene RUT inválidos"
      });
      return;
    }

    // 5. Evitar RUT repetidos
    const unicos = new Set(rutReceptores);

    if (unicos.size !== rutReceptores.length) {
      res.status(400).json({
        message: "No puedes incluir trabajadores repetidos"
      });
      return;
    }

    // 6. Ejecutar asignación
    const resultado = await asignarDocumento(
      idDocumento,
      req.usuario.rut,
      req.usuario.rol,
      rutReceptores
    );

    res.status(201).json({
      message: "Documento asignado correctamente",
      ...resultado
    });

  } catch (error) {

    if (error instanceof Error) {

      const errores: Record<string, { status: number; message: string }> = {
        DOCUMENTO_NO_ENCONTRADO: {
          status: 404,
          message: "Documento no encontrado"
        },
        DOCUMENTO_NO_AUTORIZADO: {
          status: 403,
          message: "No tienes permiso para asignar este documento"
        },
        DESTINATARIOS_INVALIDOS: {
          status: 400,
          message: "Uno o más destinatarios no existen o no son trabajadores"
        }
      };

      const respuesta = errores[error.message];

      if (respuesta) {
        res.status(respuesta.status).json({
          message: respuesta.message
        });
        return;
      }
    }

    // Conflicto por asignación duplicada
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        message: "Uno o más trabajadores ya tienen asignado este documento"
      });
      return;
    }

    console.error("Error al asignar documento:", error);

    res.status(500).json({
      message: "Error interno al asignar documento"
    });
  }
};



const leerId = (valor: unknown): number | null => {
  if (
    typeof valor !== "string" ||
    !/^\d+$/.test(valor)
  ) {
    return null;
  }

  const id = Number(valor);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > 2147483647
  ) {
    return null;
  }

  return id;
};

//Listar asignaciones
export const listarAsignaciones = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    const asignaciones = await obtenerAsignaciones(
      req.usuario.rut,
      req.usuario.rol
    );

    res.status(200).json(asignaciones);

  } catch (error) {
    console.error("Error al listar asignaciones:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//Consulta de documentos
export const listarMisDocumentos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    const asignaciones = await obtenerMisDocumentos(
      req.usuario.rut
    );

    res.status(200).json(asignaciones);

  } catch (error) {
    console.error("Error al consultar documentos:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


//Consultar una asignacion
export const buscarAsignacionPorId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    const id = leerId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "ID de asignación inválido"
      });
      return;
    }

    const asignacion = await obtenerAsignacionPorId(
      id,
      req.usuario.rut,
      req.usuario.rol
    );

    if (!asignacion) {
      res.status(404).json({
        message: "Asignación no encontrada"
      });
      return;
    }

    res.status(200).json(asignacion);

  } catch (error) {
    console.error("Error al consultar asignación:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


//Registrar una visualizacion
export const marcarVisualizacion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    const id = leerId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "ID de asignación inválido"
      });
      return;
    }

    const resultado = await registrarVisualizacion(
      id,
      req.usuario.rut
    );

    if (!resultado.asignacion) {
      res.status(404).json({
        message: "Asignación no encontrada"
      });
      return;
    }

    res.status(200).json({
      message: resultado.primeraVisualizacionRegistrada
        ? "Primera visualización registrada"
        : "La asignación no requiere actualización",
      asignacion: resultado.asignacion
    });

  } catch (error) {
    console.error("Error al registrar visualización:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};
