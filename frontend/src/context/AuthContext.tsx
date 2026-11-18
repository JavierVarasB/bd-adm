
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode
} from "react";

import api from "../services/api";

import type {
  Usuario,
  LoginResponse,
  AuthContextType
} from "../types/auth.types";

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

// Obtener fecha de expiración del JWT
const obtenerExpiracionToken = (
  token: string
): number | null => {

  try {

    const partes = token.split(".");

    if (partes.length !== 3) {
      return null;
    }

    const payloadBase64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(
      atob(payloadBase64)
    );

    if (typeof payload.exp !== "number") {
      return null;
    }

    return payload.exp * 1000;

  } catch {
    return null;
  }
};

export const AuthProvider = ({
  children
}: AuthProviderProps) => {

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("token")
  );

  const [cargando, setCargando] = useState(true);

  // Cerrar sesión
  const logout = useCallback(() => {

    sessionStorage.removeItem("token");

    setToken(null);
    setUsuario(null);

  }, []);

  // Controlar expiración automática del JWT
  useEffect(() => {

    if (!token) {
      return;
    }

    const expiracion = obtenerExpiracionToken(token);

    // Si el token no tiene una expiración válida,
    // cerramos la sesión por seguridad.
    if (expiracion === null) {
      logout();
      return;
    }

    const tiempoRestante = expiracion - Date.now();

    // Si el token ya expiró
    if (tiempoRestante <= 0) {
      logout();
      return;
    }

    // Programar cierre de sesión
    const temporizador = window.setTimeout(() => {
      logout();
    }, tiempoRestante);

    return () => {
      window.clearTimeout(temporizador);
    };

  }, [token, logout]);

  // Escuchar respuestas 401 del backend
  useEffect(() => {

    const manejarSesionExpirada = () => {
      logout();
    };

    window.addEventListener(
      "auth:unauthorized",
      manejarSesionExpirada
    );

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        manejarSesionExpirada
      );
    };

  }, [logout]);

  // Verificar sesión existente al iniciar la aplicación
  useEffect(() => {

    const verificarSesion = async () => {

      const tokenGuardado = sessionStorage.getItem("token");

      if (!tokenGuardado) {
        setCargando(false);
        return;
      }

      try {

        const respuesta = await api.get("/auth/me");

        const usuarioActual: Usuario =
          respuesta.data.usuario ?? respuesta.data;

        setUsuario(usuarioActual);
        setToken(tokenGuardado);

      } catch (error) {

        logout();

      } finally {
        setCargando(false);
      }
    };

    verificarSesion();

  }, [logout]);

  // Iniciar sesión
  const login = async (
    correo: string,
    clave: string
  ): Promise<void> => {

    const respuesta = await api.post<LoginResponse>(
      "/auth/login",
      {
        correo,
        clave
      }
    );

    const datos = respuesta.data;

    sessionStorage.setItem("token", datos.token);

    setToken(datos.token);
    setUsuario(datos.usuario);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        autenticado: !!usuario && !!token,
        cargando,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => {

  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return contexto;
};

