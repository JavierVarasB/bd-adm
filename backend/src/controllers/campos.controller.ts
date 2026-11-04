import type { Request, Response } from "express";

import {
  crearCampo,
  obtenerCampos,
  actualizarCampo,
  eliminarCampo,
  ErrorCampo,
  TIPOS_CAMPO,
  type DatosCampo
} from "../services/campos.service.js";


//funciones auxiliares para validacion de parámetros recibidos
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

const esObjeto = (
  valor: unknown
): valor is Record<string, unknown> =>
  typeof valor === "object" &&
  valor !== null &&
  !Array.isArray(valor);

const validarDatosCampo = (
  valor: unknown,
  parcial = false
): Partial<DatosCampo> | null => {
  if (!esObjeto(valor)) return null;

  const claves = Object.keys(valor);
  const permitidas = ["nombre", "tipo", "obligatorio"];

  if (
    claves.length === 0 ||
    claves.some(c => !permitidas.includes(c))
  ) return null;

  const { nombre, tipo, obligatorio } = valor;

  if (!parcial && claves.length !== 3) return null;

  if (
    nombre !== undefined &&
    (typeof nombre !== "string" ||
     nombre.trim().length === 0 ||
     nombre.trim().length > 150)
  ) return null;

  if (
    tipo !== undefined &&
    (typeof tipo !== "string" ||
     !TIPOS_CAMPO.some(t => t === tipo))
  ) return null;

  if (
    obligatorio !== undefined &&
    typeof obligatorio !== "boolean"
  ) return null;

  return {
    ...(nombre !== undefined && { nombre: nombre.trim() }),
    ...(tipo !== undefined && {
      tipo: tipo as DatosCampo["tipo"]
    }),
    ...(obligatorio !== undefined && { obligatorio })
  };
};

const responderError = (error: unknown, res: Response) => {
  if (error instanceof ErrorCampo) {
    res.status(error.codigo).json({ message: error.message });
    return;
  }

  console.error("Error en campos:", error);
  res.status(500).json({
    message: "Error interno del servidor"
  });
};

//Controladores

//Registro de campo
export const registrarCampo = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.usuario) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  const id = leerId(req.params.id);
  const datos = validarDatosCampo(req.body);

  if (id === null || !datos) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }

  try {
    const campo = await crearCampo(
      id,
      req.usuario.rut,
      req.usuario.rol,
      datos as DatosCampo
    );

    res.status(201).json(campo);
  } catch (error) {
    responderError(error, res);
  }
};


//Listar campo
export const listarCampos = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.usuario) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  const id = leerId(req.params.id);

  if (id === null) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  try {
    const campos = await obtenerCampos(
      id,
      req.usuario.rut,
      req.usuario.rol
    );

    res.status(200).json(campos);
  } catch (error) {
    responderError(error, res);
  }
};


//Modificar campo

export const modificarCampo = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.usuario) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  const id = leerId(req.params.id);
  const datos = validarDatosCampo(req.body, true);

  if (id === null || !datos) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }

  try {
    const campo = await actualizarCampo(
      id,
      req.usuario.rut,
      req.usuario.rol,
      datos
    );

    res.status(200).json(campo);
  } catch (error) {
    responderError(error, res);
  }
};


//Borrar campo

export const borrarCampo = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.usuario) {
    res.status(401).json({ message: "Autenticación requerida" });
    return;
  }

  const id = leerId(req.params.id);

  if (id === null) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  try {
    await eliminarCampo(
      id,
      req.usuario.rut,
      req.usuario.rol
    );

    res.status(204).send();
  } catch (error) {
    responderError(error, res);
  }
};