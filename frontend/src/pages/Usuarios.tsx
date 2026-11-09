
import { useEffect, useMemo, useState } from "react";
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "../services/usuario.service";

import type { Usuario } from "../types/auth.types";

import type {
  CrearUsuarioDTO,
  ActualizarUsuarioDTO
} from "../services/usuario.service";

import "../styles/Usuarios.css";

const Usuarios = () => {

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] =
    useState<Usuario | null>(null);

  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Cargar usuarios desde el backend
  const cargarUsuarios = async () => {

    try {
      setCargando(true);
      setError("");

      const datos = await obtenerUsuarios();

      setUsuarios(datos);

    } catch (error: any) {

      console.error("Error al obtener usuarios:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible cargar los usuarios"
      );

    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = useMemo(() => {

    const termino = busqueda.toLowerCase().trim();

    return usuarios.filter((usuario) =>
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.correo.toLowerCase().includes(termino) ||
      String(usuario.rut).includes(termino)
    );

  }, [usuarios, busqueda]);

  // Limpiar formulario
  const limpiarFormulario = () => {
    setNombre("");
    setRut("");
    setCorreo("");
    setClave("");
    setUsuarioEditar(null);
    setError("");
  };

  // Abrir formulario de creación
  const abrirCrear = () => {
    limpiarFormulario();
    setModalAbierto(true);
  };

  // Abrir formulario de edición
  const abrirEditar = (usuario: Usuario) => {

    limpiarFormulario();

    setUsuarioEditar(usuario);
    setNombre(usuario.nombre);
    setCorreo(usuario.correo);

    setModalAbierto(true);
  };

  // Guardar usuario
  const manejarGuardar = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError("");
    setMensaje("");
    setGuardando(true);

    try {

      if (usuarioEditar) {

        const datos: ActualizarUsuarioDTO = {
          nombre: nombre.trim(),
          correo: correo.trim()
        };

        await actualizarUsuario(
          usuarioEditar.rut,
          datos
        );

        setMensaje("Usuario actualizado correctamente");

      } else {

        const datos: CrearUsuarioDTO = {
          rut: Number(rut),
          nombre: nombre.trim(),
          correo: correo.trim(),
          clave
        };

        await crearUsuario(datos);

        setMensaje("Usuario creado correctamente");
      }

      setModalAbierto(false);
      limpiarFormulario();

      await cargarUsuarios();

    } catch (error: any) {

      console.error("Error al guardar usuario:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible guardar el usuario"
      );

    } finally {
      setGuardando(false);
    }
  };

  // Eliminar usuario
  const manejarEliminar = async (usuario: Usuario) => {

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar al usuario ${usuario.nombre}?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {

      await eliminarUsuario(usuario.rut);

      setMensaje("Usuario eliminado correctamente");

      await cargarUsuarios();

    } catch (error: any) {

      console.error("Error al eliminar usuario:", error);

      setError(
        error.response?.data?.message ??
        "No fue posible eliminar el usuario"
      );
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    limpiarFormulario();
  };

  return (
    <div className="usuarios-page">

      {/* Encabezado */}
      <div className="usuarios-header">

        <div>
          <h2>Gestión de usuarios</h2>

          <p>
            Administra los usuarios registrados en la plataforma.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={abrirCrear}
        >
          + Nuevo usuario
        </button>

      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="mensaje-exito">
          {mensaje}
        </div>
      )}

      {error && !modalAbierto && (
        <div className="mensaje-error">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="usuarios-toolbar">

        <input
          type="text"
          placeholder="Buscar por nombre, RUT o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <span>
          {usuariosFiltrados.length} usuarios
        </span>

      </div>

      {/* Tabla */}
      <div className="usuarios-table-container">

        {cargando ? (

          <p className="estado-tabla">
            Cargando usuarios...
          </p>

        ) : error && usuarios.length === 0 ? (

          <p className="estado-tabla">
            No se pudieron cargar los usuarios.
          </p>

        ) : usuariosFiltrados.length === 0 ? (

          <p className="estado-tabla">
            No se encontraron usuarios.
          </p>

        ) : (

          <table className="usuarios-table">

            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Correo electrónico</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {usuariosFiltrados.map((usuario) => (

                <tr key={usuario.rut}>

                  <td>{usuario.rut}</td>

                  <td>{usuario.nombre}</td>

                  <td>{usuario.correo}</td>

                  <td>
                    <span
                      className={`rol-badge rol-${usuario.rol.toLowerCase()}`}
                    >
                      {usuario.rol}
                    </span>
                  </td>

                  <td>
                    <div className="acciones-usuario">

                      <button
                        className="btn-editar"
                        onClick={() => abrirEditar(usuario)}
                        title="Editar usuario"
                      >
                        Editar
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={() => manejarEliminar(usuario)}
                        title="Eliminar usuario"
                      >
                        Eliminar
                      </button>

                    </div>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* Modal de creación y edición */}
      {modalAbierto && (

        <div className="modal-overlay">

          <div className="modal-usuario">

            <div className="modal-header">

              <h3>
                {usuarioEditar
                  ? "Editar usuario"
                  : "Registrar usuario"}
              </h3>

              <button
                type="button"
                onClick={cerrarModal}
                className="modal-cerrar"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            <form onSubmit={manejarGuardar}>

              <div className="campo-formulario">

                <label>RUT</label>

                <input
                  type="text"
                  value={
                    usuarioEditar
                      ? usuarioEditar.rut
                      : rut
                  }
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="Ejemplo: 206436115"
                  disabled={!!usuarioEditar}
                  required
                />

              </div>

              <div className="campo-formulario">

                <label>Nombre completo</label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del usuario"
                  required
                />

              </div>

              <div className="campo-formulario">

                <label>Correo electrónico</label>

                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@correo.com"
                  required
                />

              </div>

              {!usuarioEditar && (

                <div className="campo-formulario">

                  <label>Contraseña</label>

                  <input
                    type="password"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="Contraseña inicial"
                    minLength={8}
                    required
                  />

                </div>

              )}

              {!usuarioEditar && (
                <p className="nota-rol">
                  El usuario se registrará con el rol TRABAJADOR.
                </p>
              )}

              {error && (
                <div className="mensaje-error">
                  {error}
                </div>
              )}

              <div className="modal-acciones">

                <button
                  type="button"
                  className="btn-secundario"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : usuarioEditar
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Usuarios;
