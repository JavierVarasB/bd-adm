
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { obtenerDocumentos } from "../services/documento.service";

import type { Documento } from "../types/documento.types";

import "../styles/DashboardHome.css";

const JefeDashboard = () => {
  const { usuario } = useAuth();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Consultar documentos autorizados para esta jefatura
  const cargarDashboard = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await obtenerDocumentos();

      setDocumentos(datos);

    } catch (err: unknown) {
      console.error("Error al cargar el dashboard JEFE:", err);

      const mensaje = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        typeof mensaje === "string"
          ? mensaje
          : "No fue posible cargar los documentos."
      );

    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDashboard();
  }, [cargarDashboard]);

  // Fecha actual según el navegador
  const ahora = new Date();

  // Documentos creados durante el mes actual
  const documentosEsteMes = useMemo(() => {
    const fechaActual = new Date();

    return documentos.filter((documento) => {
      const fecha = new Date(documento.fecha_creacion);

      return (
        fecha.getMonth() === fechaActual.getMonth() &&
        fecha.getFullYear() === fechaActual.getFullYear()
      );
    });
  }, [documentos]);

  // Últimos cinco documentos
  const documentosRecientes = useMemo(() => {
    return [...documentos]
      .sort(
        (a, b) =>
          new Date(b.fecha_creacion).getTime() -
          new Date(a.fecha_creacion).getTime()
      )
      .slice(0, 5);
  }, [documentos]);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="dashboard-home">

      {/* Encabezado de bienvenida */}
      <section className="home-welcome">
        <div>
          <span className="welcome-label">
            PANEL DE JEFATURA
          </span>

          <h2>
            ¡Bienvenido, {usuario?.nombre ?? "Jefe"}!
          </h2>

          <p>
            Consulta tus documentos y accede a las
            herramientas de gestión documental.
          </p>
        </div>

        <div className="welcome-icon">
          GD
        </div>
      </section>

      {/* Mensajes de error */}
      {error && (
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      )}

      {/* Resumen de documentos */}
      <section className="dashboard-stats">

        <article className="stat-card">
          <div className="stat-icon stat-blue">
            ▤
          </div>

          <div>
            <span>Mis documentos</span>

            <strong>
              {cargando || error ? "—" : documentos.length}
            </strong>

            <small>
              Documentos disponibles para tu usuario
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-green">
            ◷
          </div>

          <div>
            <span>Documentos este mes</span>

            <strong>
              {cargando || error
                ? "—"
                : documentosEsteMes.length}
            </strong>

            <small>
              {ahora.toLocaleDateString("es-CL", {
                month: "long",
                year: "numeric"
              })}
            </small>
          </div>
        </article>

      </section>

      {/* Accesos rápidos */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <h3>Accesos rápidos</h3>
            <p>
              Accede a las herramientas disponibles
              para tu rol.
            </p>
          </div>
        </div>

        <div className="quick-access-grid">

          <Link
            to="/jefe/documentos"
            className="quick-access-card"
          >
            <div className="quick-access-icon blue">
              ▤
            </div>

            <div>
              <h4>Mis documentos</h4>
              <p>
                Consultar, visualizar y descargar
                documentos registrados.
              </p>
            </div>

            <span className="quick-arrow">→</span>
          </Link>

          <Link
            to="/jefe/documentos"
            className="quick-access-card"
          >
            <div className="quick-access-icon green">
              +
            </div>

            <div>
              <h4>Subir documento</h4>
              <p>
                Registrar un nuevo PDF en la plataforma.
              </p>
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
            <p>
              Últimos documentos disponibles
              para esta jefatura.
            </p>
          </div>

          <Link
            to="/jefe/documentos"
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

          ) : error ? (
            <p className="dashboard-empty">
              No fue posible obtener los documentos.
            </p>

          ) : documentosRecientes.length === 0 ? (
            <p className="dashboard-empty">
              Todavía no tienes documentos registrados.
            </p>

          ) : (
            documentosRecientes.map((documento) => (
              <div
                key={documento.id_documento}
                className="recent-document-item"
              >
                <div className="recent-document-icon">
                  PDF
                </div>

                <div className="recent-document-info">
                  <strong>{documento.nombre}</strong>

                  <span>
                    Creado el{" "}
                    {formatearFecha(
                      documento.fecha_creacion
                    )}
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

      {/* Actualización manual */}
      <div className="dashboard-refresh">
        <button
          type="button"
          className="btn-actualizar"
          onClick={() => void cargarDashboard()}
          disabled={cargando}
        >
          {cargando
            ? "Actualizando..."
            : "Actualizar estadísticas"}
        </button>
      </div>

    </div>
  );
};

export default JefeDashboard;

