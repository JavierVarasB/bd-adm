
import {
  createContext,
  useContext,
  useEffect,
  useState,
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

export const AuthProvider = ({
  children
}: AuthProviderProps) => {

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("token")
  );

  const [cargando, setCargando] = useState(true);

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

        sessionStorage.removeItem("token");

        setUsuario(null);
        setToken(null);

      } finally {
        setCargando(false);
      }
    };

    verificarSesion();

  }, []);

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

  // Cerrar sesión
  const logout = () => {

    sessionStorage.removeItem("token");

    setToken(null);
    setUsuario(null);
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
