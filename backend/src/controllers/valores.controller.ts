
import type { Request, Response } from "express";

import {
  guardarValores,
  obtenerValores
} from "../services/valores.service.js";

import { ErrorCampo } from "../services/campos.service.js";

const leerId = (valor: unknown): number | null => {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) &&
    id > 0 &&
    id <= 2147483647
    ? id
    : null;
};

export const registrarValores = async (
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
      res.status(400).json({ message: "ID inválido" });
      return;
    }

    const datos: unknown = req.body;

    if (
      typeof datos !== "object" ||
      datos === null ||
      Array.isArray(datos) ||
      !("respuestas" in datos)
    ) {
      res.status(400).json({
        message: "Debes enviar las respuestas"
      });
      return;
    }

    const respuestas = datos.respuestas;

    if (
      !Array.isArray(respuestas) ||
      respuestas.length > 100 ||
      !respuestas.every(
        r =>
          typeof r === "object" &&
          r !== null &&
          !Array.isArray(r) &&
          Number.isSafeInteger(r.id_campo) &&
          r.id_campo > 0 &&
          r.id_campo <= 2147483647 &&
          typeof r.valor === "string"
      )
    ) {
      res.status(400).json({
        message: "Formato de respuestas inválido"
      });
      return;
    }

    const valores = await guardarValores(
      id,
      req.usuario.rut,
      respuestas
    );

    res.status(200).json({
      message: "Respuestas guardadas correctamente",
      valores
    });

  } catch (error) {
    if (error instanceof ErrorCampo) {
      res.status(error.codigo).json({
        message: error.message
      });
      return;
    }

    console.error("Error al guardar respuestas:", error);
    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

export const consultarValores = async (
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
      res.status(400).json({ message: "ID inválido" });
      return;
    }

    const valores = await obtenerValores(
      id,
      req.usuario.rut,
      req.usuario.rol
    );

    res.status(200).json(valores);

  } catch (error) {
    if (error instanceof ErrorCampo) {
      res.status(error.codigo).json({
        message: error.message
      });
      return;
    }

    console.error("Error al consultar respuestas:", error);
    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};
