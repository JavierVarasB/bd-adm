
import { Router } from "express";
import { Rol } from "../../generated/prisma/client.js";

import {
  listarEventosAuditoria
} from "../controllers/auditoria.controller.js";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verificarToken);

router.get(
  "/",
  permitirRoles(Rol.ADMIN),
  listarEventosAuditoria
);

export default router;
