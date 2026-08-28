-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('JEFE', 'TRABAJADOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Usuario" (
    "rut" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "clave" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "firma" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("rut")
);

-- CreateTable
CREATE TABLE "Documentos" (
    "id_documento" SERIAL NOT NULL,
    "rut_emisor" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Documentos_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "AsignacionDocumento" (
    "id_asignacion" SERIAL NOT NULL,
    "id_documento" INTEGER NOT NULL,
    "rut_receptor" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(3),
    "fecha_visualizacion" TIMESTAMP(3),
    "archivo_firmado" TEXT,

    CONSTRAINT "AsignacionDocumento_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "ValoresCampo" (
    "id_valor" SERIAL NOT NULL,
    "id_campo" INTEGER NOT NULL,
    "id_asignacion" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "ValoresCampo_pkey" PRIMARY KEY ("id_valor")
);

-- CreateTable
CREATE TABLE "CamposDocumento" (
    "id_campo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL,

    CONSTRAINT "CamposDocumento_pkey" PRIMARY KEY ("id_campo")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- AddForeignKey
ALTER TABLE "Documentos" ADD CONSTRAINT "Documentos_rut_emisor_fkey" FOREIGN KEY ("rut_emisor") REFERENCES "Usuario"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionDocumento" ADD CONSTRAINT "AsignacionDocumento_id_documento_fkey" FOREIGN KEY ("id_documento") REFERENCES "Documentos"("id_documento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionDocumento" ADD CONSTRAINT "AsignacionDocumento_rut_receptor_fkey" FOREIGN KEY ("rut_receptor") REFERENCES "Usuario"("rut") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValoresCampo" ADD CONSTRAINT "ValoresCampo_id_campo_fkey" FOREIGN KEY ("id_campo") REFERENCES "CamposDocumento"("id_campo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValoresCampo" ADD CONSTRAINT "ValoresCampo_id_asignacion_fkey" FOREIGN KEY ("id_asignacion") REFERENCES "AsignacionDocumento"("id_asignacion") ON DELETE RESTRICT ON UPDATE CASCADE;
