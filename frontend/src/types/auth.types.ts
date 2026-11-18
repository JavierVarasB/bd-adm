export type Rol = "ADMIN" | "JEFE" | "TRABAJADOR";

export interface Usuario {
  rut: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface LoginResponse {
  message: string;
  token: string;
  tokenType: string;
  usuario: Usuario;
}

export interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
  cargando: boolean;

  login: (correo: string, clave: string) => Promise<void>;
  logout: () => void;
}