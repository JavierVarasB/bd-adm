import { Router } from "express";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

import { Rol } from "../../generated/prisma/client.js";

import {
  registrarValores,
  consultarValores
} from "../controllers/valores.controller.js";

const router = Router();

router.use(verificarToken);

router.put(
  "/:id/valores",
  permitirRoles(Rol.TRABAJADOR),
  registrarValores
);

router.get(
  "/:id/valores",
  consultarValores
);

export default router;
