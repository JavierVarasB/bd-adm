import { Router } from "express";

import {
  registrarDocumento,
  listarDocumentos,
  buscarDocumentoPorId,
  subirDocumento,
  descargarDocumento
} from "../controllers/documento.controller.js";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

import { Rol } from "../../generated/prisma/client.js";
import { recibirArchivo } from "../middlewares/upload.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

//subir documento
router.post(
  "/upload",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  recibirArchivo,
  subirDocumento
);

// Crear documento: ADMIN y JEFE
router.post(
  "/",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  registrarDocumento
);

// Listar documentos: ADMIN y JEFE
router.get(
  "/",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  listarDocumentos
);


// Descarga de documento
router.get(
  "/:id/descargar",
  descargarDocumento
);


// Consultar documento: ADMIN y JEFE
router.get(
  "/:id",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  buscarDocumentoPorId
);

export default router;