
import { useEffect, useMemo, useState } from "react";

import {
  obtenerDocumentos,
  subirDocumento,
  descargarDocumento
} from "../services/documento.service";

import type { Documento } from "../types/documento.types";

import "../styles/Documentos.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Documentos = () => {

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [nombre, setNombre] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Cargar documentos
  const cargarDocumentos = async () => {

    try {

      setCargando(true);
      setError("");

      const datos = await obtenerDocumentos();

      setDocumentos(datos);

    } catch (error: any) {

      console.error("Error al cargar documentos:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible cargar los documentos"
      );

    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
  }, []);

  // Filtrar documentos
  const documentosFiltrados = useMemo(() => {

    const termino = busqueda.toLowerCase().trim();

    return documentos.filter((documento) =>
      documento.nombre.toLowerCase().includes(termino)
    );

  }, [documentos, busqueda]);

  // Validar archivo seleccionado
  const manejarArchivo = (file: File | null) => {

    setError("");
    setMensaje("");

    if (!file) {
      setArchivo(null);
      return;
    }

    const esPDF =
      file.type === "application/pdf" &&
      file.name.toLowerCase().endsWith(".pdf");

    if (!esPDF) {
      setError("Solamente se permiten archivos PDF.");
      setArchivo(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("El archivo supera el límite permitido de 20 MB.");
      setArchivo(null);
      return;
    }

    setArchivo(file);
  };

  // Subir documento
  const manejarSubida = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError("");
    setMensaje("");

    if (!archivo) {
      setError("Debes seleccionar un archivo PDF.");
      return;
    }

    if (!nombre.trim()) {
      setError("Debes ingresar el nombre del documento.");
      return;
    }

    try {

      setSubiendo(true);

      await subirDocumento(nombre.trim(), archivo);

      setMensaje("Documento subido y registrado correctamente.");

      setNombre("");
      setArchivo(null);

      const input = document.getElementById(
        "archivo-documento"
      ) as HTMLInputElement | null;

      if (input) input.value = "";

      await cargarDocumentos();

    } catch (error: any) {

      console.error("Error al subir documento:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible subir el documento."
      );

    } finally {
      setSubiendo(false);
    }
  };

  // Abrir PDF en una pestaña nueva
  const visualizarDocumento = async (id: number) => {

    setError("");

    try {

      const respuesta = await descargarDocumento(id, false);

      window.open(
        respuesta.url,
        "_blank",
        "noopener,noreferrer"
      );

    } catch (error: any) {

      console.error("Error al visualizar documento:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible visualizar el documento."
      );
    }
  };

  // Descargar PDF
  const manejarDescarga = async (id: number) => {

    setError("");

    try {

      const respuesta = await descargarDocumento(id, true);

      const enlace = document.createElement("a");

      enlace.href = respuesta.url;
      enlace.style.display = "none";

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

    } catch (error: any) {

      console.error("Error al descargar documento:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible descargar el documento."
      );
    }
  };


  return (
    <div className="documentos-page">

      {/* Encabezado */}
      <div className="documentos-header">

        <div>
          <h2>Gestión de documentos</h2>

          <p>
            Administra y consulta los documentos registrados.
          </p>
        </div>

      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="mensaje-exito">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mensaje-error">
          {error}
        </div>
      )}

      {/* Formulario de subida */}
      <section className="documentos-upload">

        <div className="upload-heading">
          <h3>Subir nuevo documento</h3>

          <p>
            Selecciona un archivo PDF para incorporarlo al sistema.
          </p>
        </div>

        <form onSubmit={manejarSubida}>

          <div className="campo-formulario">

            <label htmlFor="nombre-documento">
              Nombre del documento
            </label>

            <input
              id="nombre-documento"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ejemplo: Contrato de trabajo"
              maxLength={200}
              required
            />

          </div>

          <div className="campo-formulario">

            <label htmlFor="archivo-documento">
              Archivo PDF
            </label>

            <input
              id="archivo-documento"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                manejarArchivo(e.target.files?.[0] ?? null)
              }
              required
            />

            <span className="ayuda-archivo">
              PDF únicamente. Tamaño máximo: 20 MB.
            </span>

            {archivo && (
              <span className="archivo-seleccionado">
                {archivo.name}
                {" · "}
                {(archivo.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}

          </div>

          <button
            type="submit"
            className="btn-subir-documento"
            disabled={subiendo}
          >
            {subiendo
              ? "Subiendo documento..."
              : "Subir documento"}
          </button>

        </form>

      </section>

      {/* Listado */}
      <section className="documentos-listado">

        <div className="documentos-listado-header">

          <div>
            <h3>Documentos registrados</h3>

            <p>
              Consulta los archivos almacenados en el sistema.
            </p>
          </div>

          <button
            className="btn-actualizar"
            onClick={cargarDocumentos}
            disabled={cargando}
          >
            Actualizar
          </button>

        </div>

        <div className="documentos-toolbar">

          <input
            type="text"
            placeholder="Buscar documento por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <span>
            {documentosFiltrados.length} documentos
          </span>

        </div>

        <div className="documentos-table-container">

          {cargando ? (

            <p className="estado-documentos">
              Cargando documentos...
            </p>

          ) : documentosFiltrados.length === 0 ? (

            <p className="estado-documentos">
              No se encontraron documentos.
            </p>

          ) : (

            <table className="documentos-table">

              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Fecha de creación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>

                {documentosFiltrados.map((documento) => (

                  <tr key={documento.id_documento}>

                    <td>
                      <div className="documento-nombre">

                        <span className="documento-icono">
                          PDF
                        </span>

                        <div>
                          <strong>{documento.nombre}</strong>

                          <span>
                            ID: {documento.id_documento}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      {new Date(
                        documento.fecha_creacion
                      ).toLocaleDateString("es-CL")}
                    </td>

                    <td>
                      <span className="documento-estado">
                        {documento.estado}
                      </span>
                    </td>

                    <td>
                      <div className="documento-acciones">

                        <button
                          className="btn-visualizar"
                          onClick={() =>
                            visualizarDocumento(
                              documento.id_documento
                            )
                          }
                        >
                          Visualizar
                        </button>

                        <button
                          className="btn-descargar"
                          onClick={() =>
                            manejarDescarga(
                              documento.id_documento
                            )
                          }
                        >
                          Descargar
                        </button>

                        {usuario?.rol === "JEFE" && (
                          <button
                            type="button"
                            className="btn-editar-documento"
                            onClick={() =>
                              navigate(
                                `/jefe/documentos/${documento.id_documento}/editar`
                              )
                            }
                          >
                            Editar documento
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </section>

    </div>
  );
};

export default Documentos;
