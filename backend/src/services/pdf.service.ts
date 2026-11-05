import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { prisma } from "../config/prisma.js";

import {
  descargarArchivoBuffer,
  subirArchivoBuffer
} from "./storage.service.js";



const dividirTexto = (
  texto: string,
  anchoMaximo: number,
  fuente: any,
  tamano: number
): string[] => {

  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let lineaActual = "";

  for (const palabra of palabras) {

    const prueba = lineaActual
      ? `${lineaActual} ${palabra}`
      : palabra;

    const ancho = fuente.widthOfTextAtSize(
      prueba,
      tamano
    );

    if (ancho <= anchoMaximo) {
      lineaActual = prueba;
    } else {
      if (lineaActual) {
        lineas.push(lineaActual);
      }

      lineaActual = palabra;
    }
  }

  if (lineaActual) {
    lineas.push(lineaActual);
  }

  return lineas;
};




export const generarPdfCompletado = async (
  idAsignacion: number,
  rutTrabajador: number
) => {

  // 1. Obtener asignación, documento, campos y respuestas
  const asignacion = await prisma.asignacionDocumento.findFirst({
    where: {
      id_asignacion: idAsignacion,
      rut_receptor: rutTrabajador
    },
    include: {
      documento: {
        include: {
          campos: true
        }
      },
      valores: {
        include: {
          campo: true
        }
      }
    }
  });

  if (!asignacion) {
    throw new Error("ASIGNACION_NO_ENCONTRADA");
  }

  if (asignacion.estado === "FIRMADO") {
    throw new Error("DOCUMENTO_YA_FIRMADO");
  }

  const campos = asignacion.documento.campos;
  const valores = asignacion.valores;

  // 2. Comprobar que los campos estén configurados
  if (campos.length === 0) {
    throw new Error("DOCUMENTO_SIN_CAMPOS");
  }

  // 3. Comprobar que todos los campos tengan posición
  for (const campo of campos) {
    if (
      campo.posicion_x === null ||
      campo.posicion_y === null ||
      campo.ancho === null ||
      campo.alto === null ||
      campo.pagina < 1 ||
      campo.pagina > 1000
    ) {
      throw new Error("CAMPOS_SIN_POSICION");
    }
  }

  // 4. Comprobar los campos obligatorios
  for (const campo of campos) {

    if (!campo.obligatorio) continue;

    const respuesta = valores.find(
      v => v.id_campo === campo.id_campo
    );

    if (
      !respuesta ||
      respuesta.valor.trim() === "" ||
      (
        campo.tipo === "CHECKBOX" &&
        respuesta.valor !== "true"
      )
    ) {
      throw new Error("CAMPOS_OBLIGATORIOS_INCOMPLETOS");
    }
  }

  // 5. Descargar PDF original
  const archivoOriginal = await descargarArchivoBuffer(
    asignacion.documento.ruta_archivo
  );

  // 6. Cargar documento PDF
  const pdf = await PDFDocument.load(archivoOriginal);

  pdf.registerFontkit(fontkit);

  const paginas = pdf.getPages();

  // 7. Comprobar que las páginas configuradas existan
  for (const campo of campos) {
    if (campo.pagina > paginas.length) {
      throw new Error("PAGINA_INEXISTENTE");
    }
  }

  // 8. Incorporar fuente personalizada
    pdf.registerFontkit(fontkit);

    const rutaFuente = path.resolve(
    process.cwd(),
    "src/assets/fonts/DejaVuSans.ttf"
    );

    const fuenteBuffer = await readFile(rutaFuente);

    const fuente = await pdf.embedFont(fuenteBuffer, {
    subset: true
    });

  // 9. Incorporar respuestas
  for (const respuesta of valores) {

    const campo = campos.find(
      c => c.id_campo === respuesta.id_campo
    );

    if (!campo) continue;

    const pagina = paginas[campo.pagina - 1];

    if (!pagina) {throw new Error("PAGINA_INEXISTENTE");}

    const { width, height } = pagina.getSize();

    const x = width * (campo.posicion_x! / 100);

    const anchoCampo = width * (campo.ancho! / 100);

    const altoCampo = height * (campo.alto! / 100);

    const ySuperior = height * (campo.posicion_y! / 100);

    const y = height - ySuperior - altoCampo;

    const tamano = campo.tamano_fuente;
    


    // Comprobar que el campo esté dentro de la página
    if (
      x + anchoCampo > width ||
      y < 0 ||
      y + altoCampo > height
    ) {
      throw new Error("CAMPO_FUERA_DE_PAGINA");
    }

    // Casillas de verificación
    if (campo.tipo === "CHECKBOX") {

      if (respuesta.valor === "true" && pagina!=undefined) {
        pagina.drawText("✓", {
          x,
          y: y + Math.max(0, (altoCampo - tamano) / 2),
          size: tamano,
          font: fuente,
          color: rgb(0, 0, 0)
        });
      }

      continue;
    }

    // Distribuir texto en líneas
    const lineas = dividirTexto(
      respuesta.valor,
      anchoCampo,
      fuente,
      tamano
    );

    const lineHeight = tamano * 1.2;

    if (lineas.length * lineHeight > altoCampo) {
      throw new Error("TEXTO_SUPERA_ALTO_DEL_CAMPO");
    }

    lineas.forEach((linea, index) => {

      pagina.drawText(linea, {
        x,
        y: height - ySuperior - tamano - index * lineHeight,
        size: tamano,
        font: fuente,
        color: rgb(0, 0, 0),
        maxWidth: anchoCampo
      });

    });
  }

  // 10. Generar PDF resultante
  const pdfBytes = await pdf.save();

  const archivoBuffer = Buffer.from(pdfBytes);

  // 11. Crear ruta individual
  const nombreArchivo = `${randomUUID()}.pdf`;

  const rutaArchivo =
    `documentos_completados/${idAsignacion}/${nombreArchivo}`;

  // 12. Almacenar en Supabase
  await subirArchivoBuffer(
    rutaArchivo,
    archivoBuffer
  );

  try {

    // 13. Actualizar asignación
    await prisma.asignacionDocumento.update({
      where: {
        id_asignacion: idAsignacion
      },
      data: {
        archivo_completado: rutaArchivo
      }
    });

  } catch (error) {

    // Si falla PostgreSQL, eliminar el archivo subido
    await prisma.asignacionDocumento.update({
      where: {
        id_asignacion: idAsignacion
      },
      data: {
        archivo_completado: null
      }
    }).catch(() => undefined);

    throw error;
  }

  return {
    id_asignacion: idAsignacion,
    archivo_completado: rutaArchivo
  };
};
