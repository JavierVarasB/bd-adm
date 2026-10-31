import { Router } from "express";

import { login } from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);

router.get("/me", verificarToken, (req, res) => {
  res.status(200).json({
    message: "Usuario autenticado correctamente",
    usuario: req.usuario
  });
});

export default router;