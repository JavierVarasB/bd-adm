
import type { Request, Response } from "express";

import {
  obtenerEventosAuditoria
} from "../services/auditoria.service.js";

// Validar parámetros numéricos
const leerNumero = (
  valor: unknown,
  defecto: number
): number | null => {

  if (valor === undefined) {
    return defecto;
  }

  if (
    typeof valor !== "string" ||
    !/^\d+$/.test(valor)
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
};

// Validar parámetros de texto
const leerTexto = (
  valor: unknown
): string | undefined | null => {

  if (valor === undefined) {
    return undefined;
  }

  if (typeof valor !== "string") {
    return null;
  }

  return valor.trim();
};

// GET AUDITORÍA
export const listarEventosAuditoria = async (
  req: Request,
  res: Response
): Promise<void> => {

  try {

    const pagina = leerNumero(req.query.pagina, 1);
    const limite = leerNumero(req.query.limite, 10);

    const busqueda = leerTexto(req.query.busqueda);
    const modulo = leerTexto(req.query.modulo);
    const accion = leerTexto(req.query.accion);

    if (
      pagina === null ||
      limite === null ||
      limite > 100 ||
      busqueda === null ||
      modulo === null ||
      accion === null
    ) {
      res.status(400).json({
        message: "Los parámetros de consulta son inválidos"
      });
      return;
    }

    const resultado = await obtenerEventosAuditoria({
      pagina,
      limite,
      ...(busqueda && { busqueda }),
      ...(modulo && { modulo }),
      ...(accion && { accion })
    });

    res.status(200).json(resultado);

  } catch (error) {

    console.error(
      "Error al consultar auditoría:",
      error
    );

    res.status(500).json({
      message: "No fue posible obtener los registros de auditoría"
    });
  }
};
