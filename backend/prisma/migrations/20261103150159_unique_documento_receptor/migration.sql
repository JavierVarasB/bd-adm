/*
  Warnings:

  - A unique constraint covering the columns `[id_documento,rut_receptor]` on the table `AsignacionDocumento` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AsignacionDocumento_id_documento_rut_receptor_key" ON "AsignacionDocumento"("id_documento", "rut_receptor");
