import express, { type Application } from "express";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API de firma de contratos funcionando"
  });
});

export default app;