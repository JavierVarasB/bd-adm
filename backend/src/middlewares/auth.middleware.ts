import { Rol } from "../../generated/prisma/client.js";
import type {
  Request,
  Response,
  NextFunction
} from "express";

import { prisma } from "../config/prisma.js";
import {
  jwt,
  JWT_SECRET,
  JWT_OPTIONS
} from "../config/jwt.js";

export const verificarToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Token de autenticación requerido"
      });
      return;
    }

    const token = authorization.slice(7);

    if (!token) {
      res.status(401).json({
        message: "Token inválido"
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_OPTIONS.algorithm],
      issuer: JWT_OPTIONS.issuer,
      audience: JWT_OPTIONS.audience
    });

    if (typeof decoded === "string" || !decoded.sub) {
      res.status(401).json({
        message: "Token inválido"
      });
      return;
    }

    if (!/^\d+$/.test(decoded.sub)) {
      res.status(401).json({
        message: "Token inválido"
      });
      return;
    }

    const rut = Number(decoded.sub);

    if (!Number.isSafeInteger(rut)) {
      res.status(401).json({
        message: "Token inválido"
      });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { rut },
      select: {
        rut: true,
        rol: true
      }
    });

    if (!usuario) {
      res.status(401).json({
        message: "Usuario no autorizado"
      });
      return;
    }

    req.usuario = usuario;

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Token inválido o expirado"
      });
      return;
    }

    console.error("Error de autenticación:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


// Permitir únicamente determinados roles
export const permitirRoles = (...roles: Rol[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({
        message: "No tienes permisos para esta operación"
      });
      return;
    }

    next();
  };
};

// Permitir acceso al propietario o al administrador
export const permitirPropietarioOAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.usuario) {
    res.status(401).json({
      message: "Autenticación requerida"
    });
    return;
  }

  const rutParam = req.params.rut;

  if (
    typeof rutParam !== "string" ||
    !/^\d+$/.test(rutParam)
  ) {
    res.status(400).json({
      message: "RUT inválido"
    });
    return;
  }

  const rut = Number(rutParam);

  if (!Number.isSafeInteger(rut) || rut <= 0) {
    res.status(400).json({
      message: "RUT inválido"
    });
    return;
  }

  if (
    req.usuario.rut !== rut &&
    req.usuario.rol !== Rol.ADMIN
  ) {
    res.status(403).json({
      message: "No tienes permiso para acceder a este usuario"
    });
    return;
  }

  next();
};