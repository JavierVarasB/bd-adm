import { Router } from "express";

import {
  verificarToken,
  permitirRoles
} from "../middlewares/auth.middleware.js";

import { Rol } from "../../generated/prisma/client.js";

import {
  generarDocumentoPDF
} from "../controllers/pdf.controller.js";

const router = Router();

router.use(verificarToken);

router.post(
  "/:id/generar-pdf",
  permitirRoles(Rol.TRABAJADOR),
  generarDocumentoPDF
);

export default router;
