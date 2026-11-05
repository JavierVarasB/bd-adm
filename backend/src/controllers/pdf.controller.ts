
import type { Request, Response } from "express";

import {
  generarPdfCompletado
} from "../services/pdf.service.js";

const leerId = (valor: unknown): number | null => {

  if (
    typeof valor !== "string" ||
    !/^\d+$/.test(valor)
  ) {
    return null;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) &&
    id > 0 &&
    id <= 2147483647
    ? id
    : null;
};

export const generarDocumentoPDF = async (
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

    const resultado = await generarPdfCompletado(
      id,
      req.usuario.rut
    );

    res.status(201).json({
      message: "PDF completado generado correctamente",
      documento: resultado
    });

  } catch (error) {

    const errores: Record<string, { status: number; message: string }> = {

      ASIGNACION_NO_ENCONTRADA: {
        status: 404,
        message: "Asignación no encontrada"
      },

      DOCUMENTO_YA_FIRMADO: {
        status: 409,
        message: "El documento ya se encuentra firmado"
      },

      DOCUMENTO_SIN_CAMPOS: {
        status: 400,
        message: "El documento no tiene campos configurados"
      },

      CAMPOS_SIN_POSICION: {
        status: 409,
        message: "Existen campos sin posicionamiento configurado"
      },

      CAMPOS_OBLIGATORIOS_INCOMPLETOS: {
        status: 400,
        message: "Debes completar todos los campos obligatorios"
      },

      PAGINA_INEXISTENTE: {
        status: 400,
        message: "Uno o más campos hacen referencia a páginas inexistentes"
      },

      CAMPO_FUERA_DE_PAGINA: {
        status: 400,
        message: "Uno o más campos están fuera de los límites del PDF"
      },

      TEXTO_SUPERA_ALTO_DEL_CAMPO: {
        status: 400,
        message: "El texto supera el espacio disponible en uno de los campos"
      }
    };

    if (error instanceof Error && errores[error.message]) {
        const respuesta = errores[error.message];
        if(respuesta){
            res.status(respuesta.status).json({
            message: respuesta.message
            });
        }
        
      return;
    }

    console.error("Error al generar PDF:", error);

    res.status(500).json({
      message: "No fue posible generar el documento PDF"
    });
  }
};
