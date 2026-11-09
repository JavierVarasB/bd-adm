
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  abrirMenu: () => void;
}

const Navbar = ({ abrirMenu }: NavbarProps) => {
  const { usuario, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const titulos: Record<string, string> = {
    "/admin": "Panel de Administración",
    "/jefe": "Gestión Documental",
    "/trabajador": "Portal del Trabajador"
  };

  const titulo =
    titulos[location.pathname] ?? "Gestión Documental";

  const cerrarSesion = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={abrirMenu}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <div>
          <h1>{titulo}</h1>
          <p>Sistema de gestión y firma de contratos</p>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <strong>{usuario?.nombre}</strong>
          <span>{usuario?.rol}</span>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={cerrarSesion}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
};

export default Navbar;
