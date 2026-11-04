import { Router } from "express";
import { Rol } from "../../generated/prisma/client.js";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

import {
  registrarCampo,
  listarCampos,
  modificarCampo,
  borrarCampo
} from "../controllers/campos.controller.js";

export const documentoCamposRoutes = Router();

documentoCamposRoutes.use(verificarToken);

documentoCamposRoutes.post(
  "/:id/campos",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  registrarCampo
);

documentoCamposRoutes.get(
  "/:id/campos",
  listarCampos
);

const router = Router();

router.use(verificarToken);

router.patch(
  "/:id",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  modificarCampo
);

router.delete(
  "/:id",
  permitirRoles(Rol.ADMIN, Rol.JEFE),
  borrarCampo
);

export default router;