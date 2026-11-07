
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";

const Dashboard = () => {

  const { usuario, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>

      <h1>Bienvenido, {usuario?.nombre}</h1>

      <p>Rol: {usuario?.rol}</p>

      <p>RUT: {usuario?.rut}</p>

      <button onClick={logout}>
        Cerrar sesión
      </button>

    </div>
  );
};

const AppRoutes = () => {

  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return <p>Verificando sesión...</p>;
  }

  return (
    <Routes>

      <Route
        path="/login"
        element={
          autenticado
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      <Route
        path="/dashboard"
        element={
          autenticado
            ? <Dashboard />
            : <Navigate to="/login" replace />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={autenticado ? "/dashboard" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
};

const App = () => {

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
