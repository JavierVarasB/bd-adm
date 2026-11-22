
import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import axios from "axios";

import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy
} from "pdfjs-dist";

import {
  obtenerDocumento,
  descargarDocumento
} from "../services/documento.service";

import { obtenerCampos } from "../services/campos.service";

import type { Documento } from "../types/documento.types";
import type { CampoDocumento } from "../types/campos.types";

import "../styles/EditorDocumento.css";

// Configurar worker de PDF.js
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const EditorDocumento = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  const idDocumento = Number(id);

  const [documento, setDocumento] =
    useState<Documento | null>(null);

  const [pdf, setPdf] =
    useState<PDFDocumentProxy | null>(null);

  const [campos, setCampos] =
    useState<CampoDocumento[]>([]);

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const [anchoDisponible, setAnchoDisponible] =
    useState(700);

  // Obtener ancho disponible para ajustar el PDF
  useEffect(() => {

    const contenedor = contenedorRef.current;

    if (!contenedor) return;

    const observer = new ResizeObserver(() => {
      setAnchoDisponible(
        Math.max(100, contenedor.clientWidth - 32)
      );
    });

    observer.observe(contenedor);

    return () => observer.disconnect();

  }, []);

  // Cargar información del documento y PDF
  useEffect(() => {

    if (
      !Number.isSafeInteger(idDocumento) ||
      idDocumento <= 0
    ) {
      setError("ID de documento inválido.");
      setCargando(false);
      return;
    }

    let cancelado = false;

    const tareaCarga = {
      actual: null as ReturnType<typeof getDocument> | null
    };

    const cargar = async () => {

      try {
        setCargando(true);
        setError("");
        setPdf(null);
        setPagina(1);
        setTotalPaginas(0);

        // Consultar metadatos y campos
        const [datosDocumento, datosCampos, descarga] =
          await Promise.all([
            obtenerDocumento(idDocumento),
            obtenerCampos(idDocumento),
            descargarDocumento(idDocumento, false)
          ]);

        if (cancelado) return;

        setDocumento(datosDocumento);
        setCampos(datosCampos);

        // Descargar y procesar PDF mediante PDF.js
        const tarea = getDocument({
          url: descarga.url
        });

        tareaCarga.actual = tarea;

        const pdfCargado = await tarea.promise;

        if (cancelado) {
          await tarea.destroy();
          return;
        }

        setPdf(pdfCargado);
        setTotalPaginas(pdfCargado.numPages);

      } catch (err: unknown) {

        if (cancelado) return;

        console.error("Error al cargar el editor:", err);

        const mensaje = axios.isAxiosError(err)
          ? err.response?.data?.message
          : undefined;

        setError(
          typeof mensaje === "string"
            ? mensaje
            : "No fue posible cargar el documento PDF."
        );

      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargar();

    return () => {
      cancelado = true;

      if (tareaCarga.actual) {
        void tareaCarga.actual.destroy();
      }
    };

  }, [idDocumento]);

  // Renderizar página seleccionada
  useEffect(() => {

    if (!pdf || !canvasRef.current) return;

    let cancelado = false;
    let tareaRender: ReturnType<
      Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]
    > | null = null;

    const renderizar = async () => {

      try {

        const paginaPDF = await pdf.getPage(pagina);

        if (cancelado) return;

        const escalaBase = paginaPDF.getViewport({
          scale: 1
        });

        const escala =
          Math.min(850, anchoDisponible) /
          escalaBase.width;

        const viewport = paginaPDF.getViewport({
          scale: escala
        });

        const canvas = canvasRef.current;

        if (!canvas || cancelado) return;

        const contexto = canvas.getContext("2d");

        if (!contexto) return;

        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(
          viewport.width * pixelRatio
        );

        canvas.height = Math.floor(
          viewport.height * pixelRatio
        );

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        contexto.setTransform(
          pixelRatio, 0, 0, pixelRatio, 0, 0
        );

        tareaRender = paginaPDF.render({
          canvas,
          canvasContext: contexto,
          viewport
        });

        await tareaRender.promise;

      } catch (err: unknown) {

        if (
          cancelado ||
          (err instanceof Error &&
            err.name === "RenderingCancelledException")
        ) {
          return;
        }

        console.error("Error renderizando PDF:", err);

        setError(
          "No fue posible visualizar esta página del PDF."
        );
      }
    };

    void renderizar();

    return () => {
      cancelado = true;
      tareaRender?.cancel();
    };

  }, [pdf, pagina, anchoDisponible]);

  return (
    <div className="editor-documento">

      <header className="editor-header">

        <div>
          <span className="editor-etiqueta">
            EDICIÓN DE DOCUMENTOS
          </span>

          <h2>
            {documento?.nombre ?? "Editor de PDF"}
          </h2>

          <p>
            Prepara los campos que deberán completar
            los trabajadores.
          </p>
        </div>

        <button
          type="button"
          className="editor-volver"
          onClick={() => navigate("/jefe/documentos")}
        >
          ← Volver a documentos
        </button>

      </header>

      {error && (
        <div className="editor-error" role="alert">
          {error}
        </div>
      )}

      <section className="editor-resumen">

        <div>
          <span>Páginas del documento</span>
          <strong>{totalPaginas || "—"}</strong>
        </div>

        <div>
          <span>Campos configurados</span>
          <strong>{campos.length}</strong>
        </div>

      </section>

      <section className="editor-panel">

        <div className="editor-panel-header">
          <h3>Vista previa del documento</h3>
          <span>PDF original</span>
        </div>

        <div className="editor-navegacion">

          <button
            type="button"
            onClick={() =>
              setPagina(actual => Math.max(1, actual - 1))
            }
            disabled={cargando || pagina <= 1}
          >
            ← Anterior
          </button>

          <span>
            Página {pagina} de {totalPaginas || "—"}
          </span>

          <button
            type="button"
            onClick={() =>
              setPagina(actual =>
                Math.min(totalPaginas, actual + 1)
              )
            }
            disabled={
              cargando ||
              totalPaginas === 0 ||
              pagina >= totalPaginas
            }
          >
            Siguiente →
          </button>

        </div>

        <div
          className="editor-visor"
          ref={contenedorRef}
        >

          {cargando && (
            <p className="editor-cargando">
              Cargando documento PDF...
            </p>
          )}

          <canvas
            ref={canvasRef}
            className="editor-canvas"
            style={{
              display: pdf ? "block" : "none"
            }}
          />

        </div>

      </section>

    </div>
  );
};

export default EditorDocumento;
