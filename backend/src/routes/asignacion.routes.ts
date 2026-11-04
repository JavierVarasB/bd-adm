import { Router } from "express";
import { Rol } from "../../generated/prisma/client.js";

import {
  registrarAsignaciones,
  listarAsignaciones,
  listarMisDocumentos,
  buscarAsignacionPorId,
  marcarVisualizacion
} from "../controllers/asignacion.controller.js";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

// Rutas vinculadas a documentos
export const documentoAsignacionRoutes = Router();

documentoAsignacionRoutes.use(verificarToken);

documentoAsignacionRoutes.post(
  "/:id/asignaciones",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  registrarAsignaciones
);

// Rutas de consulta y visualización
const router = Router();

router.use(verificarToken);

router.get("/", listarAsignaciones);

router.get(
  "/mis-documentos",
  listarMisDocumentos
);

router.get(
  "/:id",
  buscarAsignacionPorId
);

router.patch(
  "/:id/visualizacion",
  permitirRoles(Rol.TRABAJADOR),
  marcarVisualizacion
);

export default router;
