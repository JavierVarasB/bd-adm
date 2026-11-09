import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types/auth.types";

interface ProtectedRouteProps {
  allowedRoles?: Rol[];
}

const obtenerRutaPorRol = (rol: Rol): string => {

  switch (rol) {
    case "ADMIN":
      return "/admin";

    case "JEFE":
      return "/jefe";

    case "TRABAJADOR":
      return "/trabajador";

    default:
      return "/login";
  }
};

const ProtectedRoute = ({
  allowedRoles
}: ProtectedRouteProps) => {

  const {
    usuario,
    autenticado,
    cargando
  } = useAuth();

  // Esperar la verificación de la sesión
  if (cargando) {
    return <p>Verificando sesión...</p>;
  }

  // Si no existe una sesión activa, ir al Login
  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Comprobar si el rol tiene autorización
  if (
    allowedRoles &&
    !allowedRoles.includes(usuario.rol)
  ) {
    return (
      <Navigate
        to={obtenerRutaPorRol(usuario.rol)}
        replace
      />
    );
  }

  // Si cumple las condiciones, permitir el acceso
  return <Outlet />;
};

export default ProtectedRoute;
