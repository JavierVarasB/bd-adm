
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types/auth.types";

interface SidebarProps {
  abierto: boolean;
  cerrar: () => void;
}

interface MenuItem {
  nombre: string;
  ruta: string;
  icono: string;
}

const menuPorRol: Record<Rol, MenuItem[]> = {
  ADMIN: [
    {
      nombre: "Inicio",
      ruta: "/admin",
      icono: "⌂"
    },
    {
      nombre: "Usuarios",
      ruta: "/admin/usuarios",
      icono: "♙"
    },
    {
      nombre: "Documentos",
      ruta: "/admin/documentos",
      icono: "▤"
    }
  ],

  JEFE: [
    {
      nombre: "Inicio",
      ruta: "/jefe",
      icono: "⌂"
    },
    {
      nombre: "Documentos",
      ruta: "/jefe/documentos",
      icono: "▤"
    }
  ],

  TRABAJADOR: [
    {
      nombre: "Inicio",
      ruta: "/trabajador",
      icono: "⌂"
    }
  ]
};

const Sidebar = ({ abierto, cerrar }: SidebarProps) => {
  const { usuario } = useAuth();

  if (!usuario) return null;

  const opciones = menuPorRol[usuario.rol];

  return (
    <>
      {abierto && (
        <div
          className="sidebar-overlay"
          onClick={cerrar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${abierto ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">GD</div>

          <div>
            <h2>Gestión Documental</h2>
            <span>Firma electrónica</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MENÚ PRINCIPAL</p>

          <nav aria-label="Menú principal">
            {opciones.map((opcion) => (
              <NavLink
                key={opcion.ruta}
                to={opcion.ruta}
                end
                onClick={cerrar}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-icon">
                  {opcion.icono}
                </span>

                <span>{opcion.nombre}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {usuario.nombre.charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <strong>{usuario.nombre}</strong>
              <span>{usuario.rol}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
