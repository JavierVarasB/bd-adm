import type { Request, Response } from "express";
import { iniciarSesion } from "../services/auth.service.js";

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const datos: unknown = req.body;

    if (
      typeof datos !== "object" ||
      datos === null ||
      Array.isArray(datos)
    ) {
      res.status(400).json({
        message: "Datos de inicio de sesión inválidos"
      });
      return;
    }

    const { correo, clave } = datos as Record<string, unknown>;

    if (
      typeof correo !== "string" ||
      typeof clave !== "string" ||
      !correo.trim() ||
      !clave
    ) {
      res.status(400).json({
        message: "Correo y contraseña son obligatorios"
      });
      return;
    }

    const resultado = await iniciarSesion(correo, clave);

    if (!resultado) {
      res.status(401).json({
        message: "Credenciales incorrectas"
      });
      return;
    }

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      ...resultado
    });

  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};