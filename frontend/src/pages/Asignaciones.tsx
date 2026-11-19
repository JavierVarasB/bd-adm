
import { useCallback, useEffect, useMemo, useState, type FormEvent} from "react";
import axios from "axios";

import { obtenerDocumentos } from "../services/documento.service";
import { obtenerTrabajadores } from "../services/usuario.service";

import {
  obtenerAsignaciones,
  asignarDocumento
} from "../services/asignacion.service";

import type { Documento } from "../types/documento.types";
import type { Asignacion } from "../types/asignacion.types";
import type { Usuario } from "../types/auth.types";

import "../styles/Asignaciones.css";

const Asignaciones = () => {

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [trabajadores, setTrabajadores] = useState<Usuario[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState("");
  const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState<number[]>([]);

  const [busquedaTrabajador, setBusquedaTrabajador] = useState("");
  const [busquedaAsignacion, setBusquedaAsignacion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Obtener mensaje de error del backend
  const obtenerMensajeError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const mensaje = err.response?.data?.message;

      if (typeof mensaje === "string") {
        return mensaje;
      }
    }

    return "Ocurrió un error inesperado.";
  };

  // Cargar información necesaria
  const cargarDatos = useCallback(async () => {

    try {
      setCargando(true);
      setError("");

      const [docs, usuarios, registros] = await Promise.all([
        obtenerDocumentos(),
        obtenerTrabajadores(),
        obtenerAsignaciones()
      ]);

      setDocumentos(docs);
      setTrabajadores(usuarios);
      setAsignaciones(registros);

    } catch (err: unknown) {
      console.error("Error al cargar asignaciones:", err);
      setError(obtenerMensajeError(err));

    } finally {
      setCargando(false);
    }

  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Selección de trabajadores
  const alternarTrabajador = (rut: number) => {

    setTrabajadoresSeleccionados(actual =>
      actual.includes(rut)
        ? actual.filter(item => item !== rut)
        : [...actual, rut]
    );
  };

  // Seleccionar o deseleccionar todos
  const alternarTodos = () => {

    if (trabajadoresSeleccionados.length === trabajadoresFiltrados.length) {
      setTrabajadoresSeleccionados([]);
    } else {
      setTrabajadoresSeleccionados(
        trabajadoresFiltrados.map(trabajador => trabajador.rut)
      );
    }
  };

  // Filtrar trabajadores por nombre o RUT
  const trabajadoresFiltrados = useMemo(() => {

    const termino = busquedaTrabajador.toLowerCase().trim();

    return trabajadores.filter(trabajador =>
      trabajador.nombre.toLowerCase().includes(termino) ||
      String(trabajador.rut).includes(termino)
    );

  }, [trabajadores, busquedaTrabajador]);

  // Filtrar asignaciones por estado
  const asignacionesFiltradas = useMemo(() => {

    return asignaciones.filter(asignacion => {

      const coincideEstado =
        filtroEstado === "TODOS" ||
        asignacion.estado === filtroEstado;

      const coincideBusqueda =
        asignacion.documento.nombre.toLowerCase().includes(busquedaAsignacion.toLowerCase()) ||
        asignacion.receptor.nombre.toLowerCase().includes(busquedaAsignacion.toLowerCase()) ||
        String(asignacion.receptor.rut).includes(busquedaAsignacion);

      return coincideEstado && coincideBusqueda;
    });

  }, [asignaciones, filtroEstado, busquedaAsignacion]);

  // Estadísticas
  const pendientes = asignaciones.filter(
    a => a.estado === "PENDIENTE"
  ).length;

  const visualizadas = asignaciones.filter(
    a => a.estado === "VISUALIZADO"
  ).length;

  const completadas = asignaciones.filter(
    a => Boolean(a.archivo_completado) || a.estado === "FIRMADO"
  ).length;

  // Registrar asignaciones
  const manejarAsignacion = async (
    event: FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setError("");
    setMensaje("");

    if (!documentoSeleccionado) {
      setError("Debes seleccionar un documento.");
      return;
    }

    if (trabajadoresSeleccionados.length === 0) {
      setError("Debes seleccionar al menos un trabajador.");
      return;
    }

    try {

      setEnviando(true);

      const resultado = await asignarDocumento(
        Number(documentoSeleccionado),
        trabajadoresSeleccionados
      );

      setMensaje(
        `${resultado.cantidad_asignada} asignación(es) registradas correctamente.`
      );

      setDocumentoSeleccionado("");
      setTrabajadoresSeleccionados([]);
      setBusquedaAsignacion("");

      await cargarDatos();

    } catch (err: unknown) {

      console.error("Error al asignar documento:", err);
      setError(obtenerMensajeError(err));

    } finally {
      setEnviando(false);
    }
  };

  const formatearFecha = (fecha: string | null) => {

    if (!fecha) return "—";

    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const obtenerEstado = (asignacion: Asignacion) => {

    if (asignacion.estado === "FIRMADO" || asignacion.archivo_completado) {
      return "COMPLETADO";
    }

    return asignacion.estado;
  };

  return (
    <div className="asignaciones-page">

      <section className="asignaciones-header">
        <div>
          <span className="asignaciones-label">
            GESTIÓN DOCUMENTAL
          </span>

          <h2>Gestión de asignaciones</h2>

          <p>
            Asigna documentos a trabajadores y consulta su seguimiento.
          </p>
        </div>

        <button
          type="button"
          className="asignaciones-refresh"
          onClick={() => void cargarDatos()}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </section>

      {error && (
        <div className="asignaciones-alert error" role="alert">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="asignaciones-alert success" role="status">
          {mensaje}
        </div>
      )}

      {/* Indicadores */}
      <section className="asignaciones-stats">

        <article>
          <span>Total de asignaciones</span>
          <strong>{cargando ? "—" : asignaciones.length}</strong>
        </article>

        <article>
          <span>Pendientes</span>
          <strong>{cargando ? "—" : pendientes}</strong>
        </article>

        <article>
          <span>Visualizadas</span>
          <strong>{cargando ? "—" : visualizadas}</strong>
        </article>

        <article>
          <span>Completadas</span>
          <strong>{cargando ? "—" : completadas}</strong>
        </article>

      </section>

      {/* Nueva asignación */}
      <section className="asignaciones-card">

        <div className="asignaciones-card-heading">
          <div>
            <h3>Nueva asignación</h3>
            <p>
              Selecciona el documento y sus destinatarios.
            </p>
          </div>
        </div>

        <form onSubmit={manejarAsignacion}>

          <div className="asignacion-form-group">
            <label htmlFor="documento">
              Documento
            </label>

            <select
              id="documento"
              value={documentoSeleccionado}
              onChange={e => setDocumentoSeleccionado(e.target.value)}
              disabled={cargando || enviando}
            >
              <option value="">
                Selecciona un documento
              </option>

              {documentos.map(documento => (
                <option
                  key={documento.id_documento}
                  value={documento.id_documento}
                >
                  {documento.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="asignacion-form-group">

            <label htmlFor="buscar-trabajador">
              Buscar trabajadores
            </label>

            <input
              id="buscar-trabajador"
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={busquedaTrabajador}
              onChange={e => setBusquedaTrabajador(e.target.value)}
              disabled={enviando}
            />

          </div>

          <div className="trabajadores-selection-header">

            <strong>
              Trabajadores disponibles
            </strong>

            <span>
              {trabajadoresSeleccionados.length} seleccionados
            </span>

          </div>

          <div className="trabajadores-selection">

            {cargando ? (

              <p>Cargando trabajadores...</p>

            ) : trabajadoresFiltrados.length === 0 ? (

              <p>No se encontraron trabajadores.</p>

            ) : (

              <>
                <label className="trabajador-select-all">
                  <input
                    type="checkbox"
                    checked={
                      trabajadoresFiltrados.length > 0 &&
                      trabajadoresFiltrados.every(t =>
                        trabajadoresSeleccionados.includes(t.rut)
                      )
                    }
                    onChange={alternarTodos}
                    disabled={enviando}
                  />
                  Seleccionar todos los resultados
                </label>

                {trabajadoresFiltrados.map(trabajador => (

                  <label
                    key={trabajador.rut}
                    className="trabajador-option"
                  >

                    <input
                      type="checkbox"
                      checked={trabajadoresSeleccionados.includes(trabajador.rut)}
                      onChange={() => alternarTrabajador(trabajador.rut)}
                      disabled={enviando}
                    />

                    <span className="trabajador-avatar">
                      {trabajador.nombre.charAt(0).toUpperCase()}
                    </span>

                    <span className="trabajador-data">
                      <strong>{trabajador.nombre}</strong>
                      <small>
                        RUT: {trabajador.rut} · {trabajador.correo}
                      </small>
                    </span>

                  </label>

                ))}

              </>

            )}

          </div>

          <div className="asignacion-form-footer">

            <span>
              {trabajadoresSeleccionados.length} trabajador(es) seleccionados
            </span>

            <button
              type="submit"
              disabled={
                cargando ||
                enviando ||
                !documentoSeleccionado ||
                trabajadoresSeleccionados.length === 0
              }
            >
              {enviando ? "Asignando..." : "Confirmar asignación"}
            </button>

          </div>

        </form>

      </section>

      {/* Historial de asignaciones */}
      <section className="asignaciones-card">

        <div className="asignaciones-card-heading">
          <div>
            <h3>Asignaciones realizadas</h3>
            <p>
              Consulta los documentos enviados y sus destinatarios.
            </p>
          </div>
        </div>

        <div className="asignaciones-filters">

          <input
            type="text"
            placeholder="Buscar documento o trabajador..."
            value={busquedaAsignacion}
            onChange={e => setBusquedaAsignacion(e.target.value)}
          />

          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="VISUALIZADO">Visualizados</option>
            <option value="FIRMADO">Firmados</option>
          </select>

        </div>

        <div className="asignaciones-table-container">

          <table className="asignaciones-table">

            <thead>
              <tr>
                <th>Documento</th>
                <th>Trabajador</th>
                <th>Fecha de envío</th>
                <th>Visualización</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>

              {cargando ? (

                <tr>
                  <td colSpan={5}>Cargando asignaciones...</td>
                </tr>

              ) : asignacionesFiltradas.length === 0 ? (

                <tr>
                  <td colSpan={5}>
                    No hay asignaciones que mostrar.
                  </td>
                </tr>

              ) : (

                asignacionesFiltradas.map(asignacion => {

                  const estado = obtenerEstado(asignacion);

                  return (
                    <tr key={asignacion.id_asignacion}>

                      <td>
                        <strong>{asignacion.documento.nombre}</strong>
                      </td>

                      <td>
                        <div className="asignacion-trabajador">
                          <strong>{asignacion.receptor.nombre}</strong>
                          <small>{asignacion.receptor.rut}</small>
                        </div>
                      </td>

                      <td>
                        {formatearFecha(asignacion.fecha_envio)}
                      </td>

                      <td>
                        {formatearFecha(asignacion.fecha_visualizacion)}
                      </td>

                      <td>
                        <span className={`estado-badge estado-${estado.toLowerCase()}`}>
                          {estado === "PENDIENTE"
                            ? "Pendiente"
                            : estado === "VISUALIZADO"
                            ? "Visualizado"
                            : "Completado"}
                        </span>
                      </td>

                    </tr>
                  );

                })

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
};

export default Asignaciones;
