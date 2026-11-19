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


// Obtener exclusivamente usuarios con rol TRABAJADOR
export const obtenerTrabajadores = async () => {
  return await prisma.usuario.findMany({
    where: {
      rol: Rol.TRABAJADOR
    },
    select: {
      rut: true,
      nombre: true,
      correo: true
    },
    orderBy: {
      nombre: "asc"
    }
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
  return prisma.usuario.update({
    where: { rut },
    data: datos,
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


export const cambiarClaveUsuario = async (
  rut: number,
  claveActual: string,
  claveNueva: string
) => {
  const usuario = await prisma.usuario.findUnique({
    where: { rut },
    select: { clave: true }
  });

  if (!usuario) {
    return "no_encontrado" as const;
  }

  const coincide = await bcrypt.compare(
    claveActual,
    usuario.clave
  );

  if (!coincide) {
    return "clave_incorrecta" as const;
  }

  const mismaClave = await bcrypt.compare(
    claveNueva,
    usuario.clave
  );

  if (mismaClave) {
    return "misma_clave" as const;
  }

  const nuevoHash = await bcrypt.hash(claveNueva, 12);

  await prisma.usuario.update({
    where: { rut },
    data: { clave: nuevoHash }
  });

  return "actualizada" as const;
};