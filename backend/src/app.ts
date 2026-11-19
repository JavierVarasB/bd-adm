import express from "express";
import cors from "cors";

import asignacionRoutes, {
  documentoAsignacionRoutes
} from "./routes/asignacion.routes.js";
import documentoRoutes from "./routes/documento.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import authRoutes from "./routes/auth.routes.js";

import camposRoutes, {
  documentoCamposRoutes
} from "./routes/campos.routes.js";

import auditoriaRoutes from "./routes/auditoria.routes.js";

import valoresRoutes from "./routes/valores.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import helmet from "helmet";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(helmet());
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

// Documentos
app.use("/api/documentos", documentoRoutes);

//Asignacion de documento
app.use("/api/documentos", documentoAsignacionRoutes);

//Asignacion de documento
app.use("/api/asignaciones", asignacionRoutes);

//Campos
app.use("/api/documentos", documentoCamposRoutes);

//Campos
app.use("/api/campos", camposRoutes);

//Valores de campo
app.use("/api/asignaciones", valoresRoutes);

//PDF
app.use("/api/asignaciones", pdfRoutes);

// Auditoría del sistema
app.use("/api/auditoria", auditoriaRoutes);

export default app;