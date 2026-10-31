import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import {
  jwt,
  JWT_SECRET,
  JWT_OPTIONS
} from "../config/jwt.js";

export const iniciarSesion = async (
  correo: string,
  clave: string
) => {
  // Buscar usuario por correo
  const usuario = await prisma.usuario.findUnique({
    where: {
      correo: correo.trim().toLowerCase()
    }
  });

  if (!usuario) {
    return null;
  }

  // Comparar contraseña con el hash almacenado
  const claveCorrecta = await bcrypt.compare(
    clave,
    usuario.clave
  );

  if (!claveCorrecta) {
    return null;
  }

  // Generar JWT
  const token = jwt.sign(
    {},
    JWT_SECRET,
    {
      ...JWT_OPTIONS,
      subject: String(usuario.rut)
    }
  );

  return {
    token,
    tokenType: "Bearer",
    usuario: {
      rut: usuario.rut,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    }
  };
};