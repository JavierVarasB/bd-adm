import express, { type Application } from "express";
import usuarioRoutes from "./routes/usuario.routes.js";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get("/ruta", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de firma de contratos funcionando"
  });
});

// Ruta de usuarios
app.use("/api/usuarios", usuarioRoutes);


export default app;