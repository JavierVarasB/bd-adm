import bcrypt from "bcryptjs";
import { Rol } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";

const usuarioSelect = {
  rut: true,
  nombre: true,
  correo: true,
  rol: true,
  firma: true
} as const;

export const obtenerUsuarios = async () => {
  return await prisma.usuario.findMany({
    select: usuarioSelect
  });
};

export const obtenerUsuarioPorRut = async (rut: number) => {
  return await prisma.usuario.findUnique({
    where: { rut },
    select: usuarioSelect
  });
};




interface CrearUsuarioDTO {
  rut: number;
  nombre: string;
  correo: string;
  clave: string;
}

interface ActualizarUsuarioDTO {
  nombre?: string;
  correo?: string;
  clave?: string;
}

// Crear usuario
export const crearUsuario = async (
  datos: CrearUsuarioDTO
) => {
  const claveHash = await bcrypt.hash(datos.clave, 12);

  return prisma.usuario.create({
    data: {
      rut: datos.rut,
      nombre: datos.nombre,
      correo: datos.correo,
      clave: claveHash,
      rol: Rol.TRABAJADOR
    },
    select: usuarioSelect
  });
};

// Actualizar usuario
export const actualizarUsuario = async (
  rut: number,
  datos: ActualizarUsuarioDTO
) => {
  const data: {
    nombre?: string;
    correo?: string;
    clave?: string;
  } = {};

  if (datos.nombre !== undefined) {
    data.nombre = datos.nombre;
  }

  if (datos.correo !== undefined) {
    data.correo = datos.correo;
  }

  if (datos.clave !== undefined) {
    data.clave = await bcrypt.hash(datos.clave, 12);
  }

  return prisma.usuario.update({
    where: { rut },
    data,
    select: usuarioSelect
  });
};

// Eliminar usuario
export const eliminarUsuario = async (rut: number) => {
  return prisma.usuario.delete({
    where: { rut },
    select: usuarioSelect
  });
};