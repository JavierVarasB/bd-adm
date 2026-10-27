import { Router } from "express";

import {
  listarUsuarios,
  buscarUsuarioPorRut,
  registrarUsuario,
  modificarUsuario,
  borrarUsuario
} from "../controllers/usuario.controller.js";

const router = Router();

router.get("/", listarUsuarios);
router.get("/:rut", buscarUsuarioPorRut);

router.post("/", registrarUsuario);
router.patch("/:rut", modificarUsuario);
router.delete("/:rut", borrarUsuario);

export default router;