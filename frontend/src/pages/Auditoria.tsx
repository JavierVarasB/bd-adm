
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";

import {
  obtenerEventosAuditoria
} from "../services/auditoria.service";

import type {
  EventoAuditoria,
  RespuestaAuditoria,
  FiltrosAuditoria
} from "../types/auditoria.types";

import "../styles/Auditoria.css";

const LIMITE = 10;

const Auditoria = () => {

  // Estados de información
  const [resultado, setResultado] =
    useState<RespuestaAuditoria | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estados de filtros
  const [busqueda, setBusqueda] = useState("");
  const [modulo, setModulo] = useState("");
  const [accion, setAccion] = useState("");

  const [filtrosAplicados, setFiltrosAplicados] =
    useState<Omit<FiltrosAuditoria, "pagina" | "limite">>({});

  // Paginación y actualización
  const [pagina, setPagina] = useState(1);
  const [actualizacion, setActualizacion] = useState(0);

  // Consultar registros del backend
  useEffect(() => {

    let vigente = true;

    const cargarAuditoria = async () => {

      try {

        setCargando(true);
        setError("");

        const datos = await obtenerEventosAuditoria({
          pagina,
          limite: LIMITE,
          ...filtrosAplicados
        });

        if (vigente) {
          setResultado(datos);
        }

      } catch (err: unknown) {

        console.error("Error al cargar auditoría:", err);

        const mensaje = axios.isAxiosError(err)
          ? err.response?.data?.message
          : undefined;

        if (vigente) {
          setError(
            typeof mensaje === "string"
              ? mensaje
              : "No fue posible cargar los registros de auditoría."
          );
        }

      } finally {

        if (vigente) {
          setCargando(false);
        }
      }
    };

    void cargarAuditoria();

    return () => {
      vigente = false;
    };

  }, [pagina, filtrosAplicados, actualizacion]);

  // Aplicar filtros
  const aplicarFiltros = (
    e: FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setPagina(1);

    setFiltrosAplicados({
      busqueda: busqueda.trim(),
      modulo,
      accion
    });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {

    setBusqueda("");
    setModulo("");
    setAccion("");
    setPagina(1);

    setFiltrosAplicados({});
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return "Fecha inválida";
    }

    return valor.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const eventos: EventoAuditoria[] =
    resultado?.eventos ?? [];

  const total = resultado?.paginacion.total ?? 0;

  const totalPaginas =
    resultado?.paginacion.totalPaginas ?? 0;

  return (

    <div className="auditoria-page">

      {/* Encabezado */}

      <section className="auditoria-header">

        <div>
          <span className="auditoria-label">
            ADMINISTRACIÓN DEL SISTEMA
          </span>

          <h2>Auditoría del sistema</h2>

          <p>
            Consulta y supervisa las operaciones
            realizadas dentro de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="auditoria-refresh"
          onClick={() => setActualizacion(v => v + 1)}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </button>

      </section>

      {/* Error */}

      {error && (
        <div className="auditoria-alert error" role="alert">
          {error}
        </div>
      )}

      {/* Indicadores */}

      <section className="auditoria-stats">

        <article className="auditoria-stat-card">

          <div className="auditoria-stat-icon">
            ◷
          </div>

          <div>
            <span>Eventos encontrados</span>

            <strong>
              {cargando && !resultado ? "—" : total}
            </strong>

            <small>
              Según los filtros aplicados
            </small>
          </div>

        </article>

        <article className="auditoria-stat-card">

          <div className="auditoria-stat-icon">
            ▤
          </div>

          <div>
            <span>Página actual</span>

            <strong>
              {totalPaginas > 0
                ? `${pagina} / ${totalPaginas}`
                : "—"}
            </strong>

            <small>
              Navegación del historial
            </small>
          </div>

        </article>

        <article className="auditoria-stat-card">

          <div className="auditoria-stat-icon">
            ≡
          </div>

          <div>
            <span>Registros por página</span>

            <strong>{LIMITE}</strong>

            <small>
              Máximo de eventos mostrados
            </small>
          </div>

        </article>

      </section>

      {/* Historial */}

      <section className="auditoria-card">

        <div className="auditoria-card-heading">

          <div>
            <h3>Historial de actividad</h3>

            <p>
              Registro cronológico de operaciones
              realizadas por los usuarios.
            </p>
          </div>

        </div>

        {/* Filtros */}

        <form
          className="auditoria-filters"
          onSubmit={aplicarFiltros}
        >

          <input
            type="text"
            placeholder="Buscar usuario o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            value={modulo}
            onChange={(e) => setModulo(e.target.value)}
          >
            <option value="">Todos los módulos</option>
            <option value="USUARIOS">Usuarios</option>
            <option value="DOCUMENTOS">Documentos</option>
            <option value="ASIGNACIONES">Asignaciones</option>
          </select>

          <select
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
          >
            <option value="">Todas las acciones</option>
            <option value="CREAR">Crear</option>
            <option value="MODIFICAR">Modificar</option>
            <option value="ELIMINAR">Eliminar</option>
            <option value="ASIGNAR">Asignar</option>
            <option value="VISUALIZAR">Visualizar</option>
          </select>

          <button
            type="submit"
            className="auditoria-btn-filter"
            disabled={cargando}
          >
            Buscar
          </button>

          <button
            type="button"
            className="auditoria-btn-clear"
            onClick={limpiarFiltros}
            disabled={cargando}
          >
            Limpiar
          </button>

        </form>

        {/* Tabla */}

        <div className="auditoria-table-container">

          <table className="auditoria-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>FECHA</th>
                <th>USUARIO</th>
                <th>ROL</th>
                <th>ACCIÓN</th>
                <th>MÓDULO</th>
                <th>DESCRIPCIÓN</th>
                <th>ID REGISTRO</th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (

                <tr>
                  <td colSpan={8} className="auditoria-empty">
                    Cargando registros de auditoría...
                  </td>
                </tr>

              ) : error ? (

                <tr>
                  <td colSpan={8} className="auditoria-empty">
                    No fue posible obtener los registros.
                  </td>
                </tr>

              ) : eventos.length === 0 ? (

                <tr>
                  <td colSpan={8} className="auditoria-empty">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>

              ) : (

                eventos.map((evento) => (

                  <tr key={evento.id_auditoria}>

                    <td>
                      <span className="auditoria-id">
                        #{evento.id_auditoria}
                      </span>
                    </td>

                    <td className="auditoria-fecha">
                      {formatearFecha(evento.fecha)}
                    </td>

                    <td>
                      <div className="auditoria-user">
                        <strong>
                          {evento.nombre_usuario}
                        </strong>

                        <small>
                          {evento.rut_usuario ?? "Usuario eliminado"}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className={`auditoria-rol rol-${evento.rol_usuario.toLowerCase()}`}>
                        {evento.rol_usuario}
                      </span>
                    </td>

                    <td>
                      <span className={`auditoria-action accion-${evento.accion.toLowerCase()}`}>
                        {evento.accion}
                      </span>
                    </td>

                    <td>
                      <span className="auditoria-module">
                        {evento.modulo}
                      </span>
                    </td>

                    <td className="auditoria-description">
                      {evento.descripcion ?? "Sin descripción"}
                    </td>

                    <td>
                      {evento.id_registro ?? "—"}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* Paginación */}

        <div className="auditoria-pagination">

          <span>
            Mostrando {eventos.length} de {total} registros
          </span>

          <div>

            <button
              type="button"
              onClick={() => setPagina(p => p - 1)}
              disabled={cargando || pagina <= 1 || total === 0}
            >
              ← Anterior
            </button>

            <span>
              {pagina}
            </span>

            <button
              type="button"
              onClick={() => setPagina(p => p + 1)}
              disabled={
                cargando ||
                pagina >= totalPaginas ||
                total === 0
              }
            >
              Siguiente →
            </button>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Auditoria;
