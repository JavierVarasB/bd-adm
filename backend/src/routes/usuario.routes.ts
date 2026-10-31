import { Router } from "express";
import { Rol } from "../../generated/prisma/client.js";

import {
  listarUsuarios,
  buscarUsuarioPorRut,
  registrarUsuario,
  modificarUsuario,
  borrarUsuario,
  actualizarClave
} from "../controllers/usuario.controller.js";

import {
  verificarToken,
  permitirRoles,
  permitirPropietarioOAdmin
} from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

//Actualizacion de clave
router.patch("/me/clave", actualizarClave);

// Solo administradores
router.get("/", permitirRoles(Rol.ADMIN), listarUsuarios);

router.post("/", permitirRoles(Rol.ADMIN), registrarUsuario);

router.delete(
  "/:rut",
  permitirRoles(Rol.ADMIN),
  borrarUsuario
);

// Propietario de la cuenta o administrador
router.get(
  "/:rut",
  permitirPropietarioOAdmin,
  buscarUsuarioPorRut
);

router.patch(
  "/:rut",
  permitirPropietarioOAdmin,
  modificarUsuario
);

export default router;