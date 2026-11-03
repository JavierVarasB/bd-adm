import { randomUUID } from "node:crypto";
import { supabase } from "../config/supabase.js";

const BUCKET = "almacen_documentos";

const TAMANO_MAXIMO = 20 * 1024 * 1024; // 20 MB

// Subir archivo PDF
export const subirArchivo = async (
  rutEmisor: number,
  archivo: Buffer
) => {
  // Validar tamaño
  if (archivo.length === 0 || archivo.length > TAMANO_MAXIMO) {
    throw new Error("Tamaño de archivo no permitido");
  }

  // Comprobar la firma del archivo PDF
  const encabezadoPDF = archivo.indexOf(
    Buffer.from("%PDF-"),
    0,
    "ascii"
  );

  if (encabezadoPDF === -1 || encabezadoPDF > 1024) {
    throw new Error("El archivo no tiene un encabezado PDF válido");
  }

  // Generar una ruta única
  const nombreArchivo = `${randomUUID()}.pdf`;

  const rutaArchivo = `${rutEmisor}/${nombreArchivo}`;

  // Subir a Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(rutaArchivo, archivo, {
      contentType: "application/pdf",
      upsert: false
    });

  if (error) {
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  return {
    rutaArchivo: data.path
  };
};

// Generar URL temporal de descarga
export const obtenerUrlDescarga = async (
  rutaArchivo: string
) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(rutaArchivo, 300);

  if (error) {
    throw new Error(
      `Error al generar URL: ${error.message}`
    );
  }

  return data.signedUrl;
};

// Eliminar archivo
export const eliminarArchivo = async (
  rutaArchivo: string
) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .remove([rutaArchivo]);

  if (error) {
    throw new Error(
      `Error al eliminar archivo: ${error.message}`
    );
  }

  return data;
};