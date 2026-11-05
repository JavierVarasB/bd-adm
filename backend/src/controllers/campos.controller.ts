import type { Request, Response } from "express";

import {
  crearCampo,
  obtenerCampos,
  actualizarCampo,
  eliminarCampo,
  ErrorCampo,
  TIPOS_CAMPO,
  type DatosCampo,
  type TipoCampo
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

  const permitidas = [
    "nombre",
    "tipo",
    "obligatorio",
    "pagina",
    "posicion_x",
    "posicion_y",
    "ancho",
    "alto",
    "tamano_fuente"
  ];

  const claves = Object.keys(valor);

  if (
    claves.length === 0 ||
    claves.some(c => !permitidas.includes(c))
  ) {
    return null;
  }

  const { nombre, tipo, obligatorio,
    pagina, posicion_x, posicion_y,
    ancho, alto, tamano_fuente } = valor;

  if (
    !parcial &&
    !["nombre", "tipo", "obligatorio"].every(
      c => claves.includes(c)
    )
  ) {
    return null;
  }

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

  if (
    pagina !== undefined &&
    (!Number.isInteger(pagina) || (pagina as number) < 1)
  ) return null;

  for (const coordenada of [
    posicion_x, posicion_y, ancho, alto
  ]) {
    if (
      coordenada !== undefined &&
      (
        typeof coordenada !== "number" ||
        !Number.isFinite(coordenada) ||
        coordenada < 0 ||
        coordenada > 100
      )
    ) return null;
  }

  if (
  tamano_fuente !== undefined &&
  (
    typeof tamano_fuente !== "number" ||
    !Number.isInteger(tamano_fuente) ||
    tamano_fuente < 6 ||
    tamano_fuente > 48
  )
) return null;

  // Las posiciones deben enviarse completas
  const posiciones = [
    posicion_x, posicion_y, ancho, alto
  ];

  if (
    posiciones.some(p => p !== undefined) &&
    !posiciones.every(p => p !== undefined)
  ) return null;

  return {
    ...(nombre !== undefined && { nombre: nombre.trim() }),
    ...(tipo !== undefined && { tipo: tipo as TipoCampo }),
    ...(obligatorio !== undefined && { obligatorio }),
    ...(pagina !== undefined && { pagina: pagina as number }),
    ...(posicion_x !== undefined && { posicion_x: posicion_x as number }),
    ...(posicion_y !== undefined && { posicion_y: posicion_y as number }),
    ...(ancho !== undefined && { ancho: ancho as number }),
    ...(alto !== undefined && { alto: alto as number }),
    ...(tamano_fuente !== undefined && {
      tamano_fuente: tamano_fuente as number
    })
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