
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";

const probarFuente = async () => {
  try {
    const fuenteBuffer = await readFile(
      "src/assets/fonts/DejaVuSans.ttf"
    );

    console.log("Tamaño de fuente:", fuenteBuffer.length);

    const fuente = fontkit.create(fuenteBuffer);

    console.log("Fuente reconocida correctamente");
    console.log("Familia:", fuente.familyName);
    console.log("Estilo:", fuente.subfamilyName);

  } catch (error) {
    console.error("Error al reconocer la fuente:", error);
  }
};

probarFuente();
