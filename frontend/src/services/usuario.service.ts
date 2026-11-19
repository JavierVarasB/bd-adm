
import api from "./api";
import type { Usuario } from "../types/auth.types";

// Datos necesarios para registrar un usuario
export interface CrearUsuarioDTO {
  rut: number;
  nombre: string;
  correo: string;
  clave: string;
}

// Datos permitidos para actualizar un usuario
export interface ActualizarUsuarioDTO {
  nombre?: string;
  correo?: string;
  clave?: string;
}

// Obtener todos los usuarios
export const obtenerUsuarios = async (): Promise<Usuario[]> => {
  const respuesta = await api.get<Usuario[]>("/usuarios");

  return respuesta.data;
};

// Obtener un usuario por RUT
export const obtenerUsuario = async (
  rut: number
): Promise<Usuario> => {
  const respuesta = await api.get<Usuario>(`/usuarios/${rut}`);

  return respuesta.data;
};

// Crear un usuario
export const crearUsuario = async (
  datos: CrearUsuarioDTO
): Promise<Usuario> => {
  const respuesta = await api.post<Usuario>(
    "/usuarios",
    datos
  );

  return respuesta.data;
};

// Actualizar un usuario
export const actualizarUsuario = async (
  rut: number,
  datos: ActualizarUsuarioDTO
): Promise<Usuario> => {
  const respuesta = await api.patch<Usuario>(
    `/usuarios/${rut}`,
    datos
  );

  return respuesta.data;
};

// Eliminar un usuario
export const eliminarUsuario = async (
  rut: number
): Promise<void> => {
  await api.delete(`/usuarios/${rut}`);
};


// Obtener trabajadores disponibles para asignaciones
export const obtenerTrabajadores = async (): Promise<Usuario[]> => {
  const respuesta = await api.get<Usuario[]>("/usuarios/trabajadores");

  return respuesta.data;
};
