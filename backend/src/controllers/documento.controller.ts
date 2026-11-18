import type { Request, Response } from "express";
import { obtenerUrlDescarga } from "../services/storage.service.js";
import { obtenerDocumentoParaDescarga } from "../services/documento.service.js";

import {
  crearDocumento,
  obtenerDocumentos,
  obtenerDocumentoPorId
} from "../services/documento.service.js";

import {
  subirArchivo,
  eliminarArchivo
} from "../services/storage.service.js";

// Crear documento
export const registrarDocumento = async (
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

    const { nombre, ruta_archivo } = req.body;

    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      nombre.length > 200 ||
      typeof ruta_archivo !== "string" ||
      !ruta_archivo.trim()
    ) {
      res.status(400).json({
        message: "Nombre y ruta del archivo son obligatorios"
      });
      return;
    }

    const documento = await crearDocumento(
      req.usuario.rut,
      nombre.trim(),
      ruta_archivo.trim()
    );

    res.status(201).json({
      message: "Documento creado correctamente",
      documento
    });

  } catch (error) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// Listar documentos
export const listarDocumentos = async (
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

    const esAdmin = req.usuario.rol === "ADMIN";

    const documentos = await obtenerDocumentos(
      req.usuario.rut,
      esAdmin
    );

    res.status(200).json(documentos);

  } catch (error) {
    console.error("Error al listar documentos:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};

// Buscar documento por ID
export const buscarDocumentoPorId = async (
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

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({
        message: "Identificador de documento inválido"
      });
      return;
    }

    const esAdmin = req.usuario.rol === "ADMIN";

    const documento = await obtenerDocumentoPorId(
      id,
      req.usuario.rut,
      esAdmin
    );

    if (!documento) {
      res.status(404).json({
        message: "Documento no encontrado"
      });
      return;
    }

    res.status(200).json(documento);

  } catch (error) {
    console.error("Error al buscar documento:", error);

    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


//Subir documento al storage de supabase
export const subirDocumento = async (
  req: Request,
  res: Response
): Promise<void> => {
  let rutaArchivo: string | null = null;

  try {
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    // Comprobar que se recibió un archivo
    if (!req.file) {
      res.status(400).json({
        message: "Debes adjuntar un archivo PDF"
      });
      return;
    }

    // Validar nombre del documento
    const nombre = req.body.nombre;

    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      nombre.trim().length > 200
    ) {
      res.status(400).json({
        message: "El nombre del documento es obligatorio y no debe superar 200 caracteres"
      });
      return;
    }

    // Subir archivo a Supabase Storage
    const archivoSubido = await subirArchivo(
      req.usuario.rut,
      req.file.buffer
    );

    rutaArchivo = archivoSubido.rutaArchivo;

    // Registrar documento en PostgreSQL
    const documento = await crearDocumento(
      req.usuario.rut,
      nombre.trim(),
      rutaArchivo
    );

    res.status(201).json({
      message: "Documento subido y registrado correctamente",
      documento
    });

  } catch (error) {

    // Si falló el registro en PostgreSQL,
    // intentamos eliminar el archivo de Supabase
    if (rutaArchivo) {
      try {
        await eliminarArchivo(rutaArchivo);
      } catch (errorLimpieza) {
        console.error(
          "No se pudo eliminar el archivo temporal:",
          errorLimpieza
        );
      }
    }

    console.error("Error al subir documento:", error);

    res.status(500).json({
      message: "No fue posible subir y registrar el documento"
    });
  }
};


//Descarga de documento
export const descargarDocumento = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. Verificar usuario autenticado
    if (!req.usuario) {
      res.status(401).json({
        message: "Autenticación requerida"
      });
      return;
    }

    // 2. Validar identificador
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

    // 3. Buscar documento con autorización
    const documento = await obtenerDocumentoParaDescarga(
      idDocumento,
      req.usuario.rut,
      req.usuario.rol
    );

    if (!documento) {
      res.status(404).json({
        message: "Documento no encontrado"
      });
      return;
    }

    // 4. Generar URL de descarga temporal
    const descargar = req.query.download === "true";

    const url = await obtenerUrlDescarga(
      documento.ruta_archivo,
      descargar
    );

    // 5. Devolver la URL al cliente
    res.setHeader("Cache-Control", "no-store");

    res.status(200).json({
      message: "URL de descarga generada correctamente",
      documento: {
        id_documento: documento.id_documento,
        nombre: documento.nombre
      },
      url,
      expiraEn: 300
    });

  } catch (error) {
    console.error("Error al descargar documento:", error);

    res.status(500).json({
      message: "No fue posible generar la descarga"
    });
  }
};