import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const TAMANO_MAXIMO = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: TAMANO_MAXIMO,
    files: 1
  },

  fileFilter: (_req, file, callback) => {
    const esPDF =
      file.mimetype === "application/pdf" &&
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!esPDF) {
      callback(new Error("Solo se permiten archivos PDF"));
      return;
    }

    callback(null, true);
  }
});

// Middleware personalizado para controlar errores de Multer
export const recibirArchivo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single("archivo")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message: "El archivo supera el límite permitido de 20 MB"
        });
        return;
      }

      res.status(400).json({
        message: "Error al procesar el archivo"
      });
      return;
    }

    if (error) {
      res.status(400).json({
        message: error.message
      });
      return;
    }

    next();
  });
};