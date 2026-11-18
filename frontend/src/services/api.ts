import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para incorporar automáticamente el JWT
api.interceptors.request.use((config) => {

  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor para detectar sesiones expiradas o inválidas
api.interceptors.response.use(

  (respuesta) => respuesta,

  (error) => {

    const estado = error.response?.status;

    const esLogin = error.config?.url?.includes("/auth/login");

    if (estado === 401 && !esLogin) {

      sessionStorage.removeItem("token");

      window.dispatchEvent(
        new Event("auth:unauthorized")
      );
    }

    return Promise.reject(error);
  }
);

export default api;
