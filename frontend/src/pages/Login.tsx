
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/Login.css";

const Login = () => {

  const { login } = useAuth();

  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError("");
    setCargando(true);

    
    try {
      await login(correo, clave);

      navigate("/dashboard");

    } catch (error: any) {

      console.error("Error de autenticación:", error);

      console.error(
        "Respuesta del servidor:",
        error.response?.data
      );

      console.error(
        "Código HTTP:",
        error.response?.status
      );

      setError(
        error.response?.data?.message ??
        error.message ??
        "No fue posible iniciar sesión"
      );

    } finally {
      setCargando(false);
    }

  };

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="login-header">

          <h1>Gestión Documental</h1>

          <p>
            Sistema de administración y firma de contratos
          </p>

        </div>

        <form onSubmit={manejarLogin}>

          <div className="form-group">

            <label htmlFor="correo">Correo</label>

            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo"
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="clave">Contraseña</label>

            <input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />

          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;
