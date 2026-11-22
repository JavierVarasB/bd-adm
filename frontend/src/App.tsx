
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import JefeDashboard from "./pages/JefeDashBoard";
import TrabajadorDashboard from "./pages/TrabajadorDashboard";
import Usuarios from "./pages/Usuarios";
import Documentos from "./pages/Documentos";
import Asignaciones from "./pages/Asignaciones";
import Auditoria from "./pages/Auditoria";
import EditorDocumento from "./pages/EditorDocumento";

// Redirección según el rol autenticado
const DashboardRedirect = () => {
  const { usuario, autenticado, cargando } = useAuth();

  if (cargando) {
    return <p>Verificando sesión...</p>;
  }

  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace />;
  }

  const rutas = {
    ADMIN: "/admin",
    JEFE: "/jefe",
    TRABAJADOR: "/trabajador"
  };

  return <Navigate to={rutas[usuario.rol]} replace />;
};

const AppRoutes = () => {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return <p>Verificando sesión...</p>;
  }

  return (
    <Routes>
      {/* Inicio y redirección general */}
      <Route
        path="/"
        element={<DashboardRedirect />}
      />

      <Route
        path="/dashboard"
        element={<DashboardRedirect />}
      />

      {/* Login público */}
      <Route
        path="/login"
        element={
          autenticado
            ? <DashboardRedirect />
            : <Login />
        }
      />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Layout compartido */}
        <Route element={<DashboardLayout />}>

          {/* ADMIN */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]} />
            }
          >
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/usuarios"
              element={<Usuarios />}
            />

            <Route
              path="/admin/documentos"
              element={<Documentos />}
            />

            <Route
              path="/admin/auditoria"
              element={<Auditoria />}
            />
          </Route>

          {/* JEFE */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["JEFE"]} />
            }
          >
            <Route
              path="/jefe"
              element={<JefeDashboard />}
            />

            <Route
              path="/jefe/documentos"
              element={<Documentos />}
            />

            <Route
              path="/jefe/asignaciones"
              element={<Asignaciones />}
            />

            <Route
              path="/jefe/documentos/:id/editar"
              element={<EditorDocumento />}
            />
          </Route>

          {/* TRABAJADOR */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["TRABAJADOR"]} />
            }
          >
            <Route
              path="/trabajador"
              element={<TrabajadorDashboard />}
            />
          </Route>

        </Route>
      </Route>

      {/* Rutas inexistentes */}
      <Route
        path="*"
        element={<DashboardRedirect />}
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


