-- CreateTable
CREATE TABLE "Auditoria" (
    "id_auditoria" SERIAL NOT NULL,
    "rut_usuario" INTEGER,
    "nombre_usuario" TEXT NOT NULL,
    "rol_usuario" "Rol" NOT NULL,
    "accion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "id_registro" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE INDEX "Auditoria_rut_usuario_idx" ON "Auditoria"("rut_usuario");

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_modulo_accion_idx" ON "Auditoria"("modulo", "accion");

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_rut_usuario_fkey" FOREIGN KEY ("rut_usuario") REFERENCES "Usuario"("rut") ON DELETE SET NULL ON UPDATE CASCADE;
