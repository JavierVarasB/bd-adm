import express from "express";

import usuarioRoutes from "./routes/usuario.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    message: "Servidor funcionando correctamente"
  });
});

// Autenticación
app.use("/api/auth", authRoutes);

// Usuarios
app.use("/api/usuarios", usuarioRoutes);

export default app;