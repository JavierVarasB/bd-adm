/*
  Warnings:

  - Added the required column `id_documento` to the `CamposDocumento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CamposDocumento" ADD COLUMN     "id_documento" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "CamposDocumento" ADD CONSTRAINT "CamposDocumento_id_documento_fkey" FOREIGN KEY ("id_documento") REFERENCES "Documentos"("id_documento") ON DELETE RESTRICT ON UPDATE CASCADE;
