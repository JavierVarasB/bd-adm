
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { obtenerUsuarios } from "../services/usuario.service";
import { obtenerDocumentos } from "../services/documento.service";

import { useAuth } from "../context/AuthContext";

import type { Documento } from "../types/documento.types";

import "../styles/DashboardHome.css";

const AdminDashboard = () => {

  const { usuario } = useAuth();

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [documentos, setDocumentos] = useState<Documento[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Obtener estadísticas generales
  useEffect(() => {

    const cargarDashboard = async () => {

      try {

        setCargando(true);
        setError("");

        const [usuariosData, documentosData] = await Promise.all([
          obtenerUsuarios(),
          obtenerDocumentos()
        ]);

        setTotalUsuarios(usuariosData.length);
        setDocumentos(documentosData);

      } catch (error) {

        console.error("Error al cargar dashboard:", error);

        setError("No fue posible cargar las estadísticas.");

      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();

  }, []);

  // Obtener los últimos documentos
  const documentosRecientes = [...documentos]
    .sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() -
        new Date(a.fecha_creacion).getTime()
    )
    .slice(0, 5);

  return (
    <div className="dashboard-home">

      {/* Bienvenida */}
      <section className="home-welcome">

        <div>
          <span className="welcome-label">
            PANEL DE ADMINISTRACIÓN
          </span>

          <h2>
            ¡Bienvenido, {usuario?.nombre ?? "Administrador"}!
          </h2>

          <p>
            Desde aquí puedes administrar los usuarios y documentos
            de la plataforma.
          </p>
        </div>

        <div className="welcome-icon">
          GD
        </div>

      </section>

      {/* Mensaje de error */}
      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <section className="dashboard-stats">

        <article className="stat-card">

          <div className="stat-icon stat-blue">
            ♙
          </div>

          <div>
            <span>Usuarios registrados</span>

            <strong>
              {cargando ? "..." : totalUsuarios}
            </strong>

            <small>Usuarios del sistema</small>
          </div>

        </article>

        <article className="stat-card">

          <div className="stat-icon stat-green">
            ▤
          </div>

          <div>
            <span>Documentos registrados</span>

            <strong>
              {cargando ? "..." : documentos.length}
            </strong>

            <small>Documentos almacenados</small>
          </div>

        </article>

      </section>

      {/* Accesos rápidos */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <h3>Accesos rápidos</h3>
            <p>Accede directamente a las principales funcionalidades.</p>
          </div>
        </div>

        <div className="quick-access-grid">

          <Link
            to="/admin/usuarios"
            className="quick-access-card"
          >
            <div className="quick-access-icon blue">
              ♙
            </div>

            <div>
              <h4>Gestión de usuarios</h4>
              <p>Crear, consultar, editar y administrar usuarios.</p>
            </div>

            <span className="quick-arrow">→</span>
          </Link>

          <Link
            to="/admin/documentos"
            className="quick-access-card"
          >
            <div className="quick-access-icon green">
              ▤
            </div>

            <div>
              <h4>Gestión documental</h4>
              <p>Subir, consultar y descargar documentos PDF.</p>
            </div>

            <span className="quick-arrow">→</span>
          </Link>

        </div>

      </section>

      {/* Documentos recientes */}
      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <h3>Documentos recientes</h3>
            <p>Últimos documentos incorporados al sistema.</p>
          </div>

          <Link
            to="/admin/documentos"
            className="section-link"
          >
            Ver todos →
          </Link>

        </div>

        <div className="recent-documents">

          {cargando ? (

            <p className="dashboard-empty">
              Cargando documentos...
            </p>

          ) : documentosRecientes.length === 0 ? (

            <p className="dashboard-empty">
              Todavía no hay documentos registrados.
            </p>

          ) : (

            documentosRecientes.map((documento) => (

              <div
                className="recent-document-item"
                key={documento.id_documento}
              >

                <div className="recent-document-icon">
                  PDF
                </div>

                <div className="recent-document-info">

                  <strong>{documento.nombre}</strong>

                  <span>
                    {new Date(
                      documento.fecha_creacion
                    ).toLocaleDateString("es-CL")}
                  </span>

                </div>

                <span className="recent-document-status">
                  {documento.estado}
                </span>

              </div>

            ))

          )}

        </div>

      </section>

    </div>
  );
};

export default AdminDashboard;
