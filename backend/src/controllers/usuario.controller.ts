import type { Request, Response } from "express";
import {
  obtenerUsuarios,
  obtenerUsuarioPorRut,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  cambiarClaveUsuario,
  obtenerTrabajadores
} from "../services/usuario.service.js";

import {
  registrarEventoAuditoria
} from "../services/auditoria.service.js";




//GET USUARIOS
export const listarUsuarios = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const usuarios = await obtenerUsuarios();

    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//GET USUARIO POR RUT
export const buscarUsuarioPorRut = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rutParam = req.params.rut;

    if (
      typeof rutParam !== "string" ||
      !/^\d+$/.test(rutParam)
    ) {
      res.status(400).json({
        message: "El RUT debe ser un número válido"
      });
      return;
    }

    const rut = Number(rutParam);

    if (!Number.isSafeInteger(rut) || rut > 2147483647) {
      res.status(400).json({
        message: "RUT fuera del rango permitido"
      });
      return;
    }

    const usuario = await obtenerUsuarioPorRut(rut);

    if (!usuario) {
      res.status(404).json({
        message: "Usuario no encontrado"
      });
      return;
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al buscar usuario:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//VALIDACIONES DE TIPOS

const esObjeto = (
  valor: unknown
): valor is Record<string, unknown> =>
  typeof valor === "object" &&
  valor !== null &&
  !Array.isArray(valor);

const esTexto = (valor: unknown): valor is string =>
  typeof valor === "string" &&
  valor.trim().length > 0;

const esCorreo = (valor: unknown): valor is string =>
  esTexto(valor) &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const esRut = (valor: unknown): valor is number =>
  typeof valor === "number" &&
  Number.isSafeInteger(valor) &&
  valor > 0 &&
  valor <= 2147483647;

const leerRut = (valor: unknown): number | null => {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }

  const rut = Number(valor);
  return esRut(rut) ? rut : null;
};

const codigoPrisma = (error: unknown): string | undefined => {
  if (
    esObjeto(error) &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
};

//POST DE USUSARIO
export const registrarUsuario = async (
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
    const datos: unknown = req.body;

    if (!esObjeto(datos)) {
      res.status(400).json({
        message: "Debes enviar un objeto JSON válido"
      });
      return;
    }

    const { rut, nombre, correo, clave } = datos;

    if (
      !esRut(rut) ||
      !esTexto(nombre) ||
      !esCorreo(correo) ||
      !esTexto(clave) ||
      clave.length < 12 ||
      clave.length > 72
    ) {
      res.status(400).json({
        message: "Datos inválidos. Revisa RUT, nombre, correo y contraseña (12 a 72 caracteres)"
      });
      return;
    }

    const usuario = await crearUsuario({
      rut,
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      clave
    });

    // Obtener los datos del administrador autenticado
    const administrador = await obtenerUsuarioPorRut(
      req.usuario.rut
    );

    // Registrar evento de auditoría
    await registrarEventoAuditoria({
      rut_usuario: req.usuario.rut,
      nombre_usuario: administrador?.nombre ?? "Administrador",
      rol_usuario: req.usuario.rol,
      accion: "CREAR",
      modulo: "USUARIOS",
      descripcion: `Se registró el usuario ${usuario.nombre}`,
      id_registro: usuario.rut
    });

    res.status(201).json({
      message: "Usuario creado correctamente",
      usuario
    });

  } catch (error) {
    if (codigoPrisma(error) === "P2002") {
      res.status(409).json({
        message: "El RUT o correo ya está registrado"
      });
      return;
    }

    console.error("Error al registrar usuario:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//UPDATE DE USUARIO
export const modificarUsuario = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rut = leerRut(req.params.rut);
    const datos: unknown = req.body;

    if (rut === null) {
      res.status(400).json({
        message: "RUT inválido"
      });
      return;
    }

    if (!esObjeto(datos)) {
      res.status(400).json({
        message: "Datos inválidos"
      });
      return;
    }

    const campos = Object.keys(datos);
    const permitidos = ["nombre", "correo"];

    if (
      campos.length === 0 ||
      campos.some((campo) => !permitidos.includes(campo))
    ) {
      res.status(400).json({
        message: "Solo puedes actualizar nombre o correo"
      });
      return;
    }

    const { nombre, correo} = datos;

    if (
      (nombre !== undefined && !esTexto(nombre)) ||
      (correo !== undefined && !esCorreo(correo))
      
    ) {
      res.status(400).json({
        message: "Los datos enviados no son válidos"
      });
      return;
    }

    const usuario = await actualizarUsuario(rut, {
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(correo !== undefined && {
        correo: correo.trim().toLowerCase()
      }),
    });

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      usuario
    });

  } catch (error) {
    const codigo = codigoPrisma(error);

    if (codigo === "P2025") {
      res.status(404).json({
        message: "Usuario no encontrado"
      });
      return;
    }

    if (codigo === "P2002") {
      res.status(409).json({
        message: "El correo ya está registrado"
      });
      return;
    }

    console.error("Error al actualizar usuario:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//DELETE DE USUARIO
export const borrarUsuario = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rut = leerRut(req.params.rut);

    if (rut === null) {
      res.status(400).json({
        message: "RUT inválido"
      });
      return;
    }

    await eliminarUsuario(rut);

    res.status(200).json({
      message: "Usuario eliminado con éxito"
    });

  } catch (error) {
    const codigo = codigoPrisma(error);

    if (codigo === "P2025") {
      res.status(404).json({
        message: "Usuario no encontrado"
      });
      return;
    }

    if (codigo === "P2003") {
      res.status(409).json({
        message: "No se puede eliminar el usuario porque tiene registros relacionados"
      });
      return;
    }

    console.error("Error al eliminar usuario:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

//ACTUALIZAR CLAVE
export const actualizarClave = async (
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

    const datos: unknown = req.body;

    if (!esObjeto(datos)) {
      res.status(400).json({
        message: "Datos inválidos"
      });
      return;
    }

    const { claveActual, claveNueva } = datos;

    if (
      !esTexto(claveActual) ||
      !esTexto(claveNueva)
    ) {
      res.status(400).json({
        message: "Debes ingresar ambas contraseñas"
      });
      return;
    }

    if (
      claveNueva.length < 12 ||
      Buffer.byteLength(claveNueva, "utf8") > 72
    ) {
      res.status(400).json({
        message: "La nueva contraseña debe tener al menos 12 caracteres y no superar 72 bytes"
      });
      return;
    }

    const resultado = await cambiarClaveUsuario(
      req.usuario.rut,
      claveActual,
      claveNueva
    );

    if (resultado === "clave_incorrecta") {
      res.status(400).json({
        message: "La contraseña actual es incorrecta"
      });
      return;
    }

    if (resultado === "misma_clave") {
      res.status(400).json({
        message: "La nueva contraseña debe ser diferente"
      });
      return;
    }

    if (resultado === "no_encontrado") {
      res.status(404).json({
        message: "Usuario no encontrado"
      });
      return;
    }

    res.status(200).json({
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};



// GET TRABAJADORES
export const listarTrabajadores = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const trabajadores = await obtenerTrabajadores();

    res.status(200).json(trabajadores);

  } catch (error) {
    console.error("Error al obtener trabajadores:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};
