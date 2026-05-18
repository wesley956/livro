import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

export interface PdfReaderHandle {
  previousPage: () => void;
  nextPage: () => void;
  goToPage: (pageNumber: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
}

interface PdfReaderProps {
  fileUrl: string;
  bookId: string;
  scale?: number;
  theme?: "light" | "dark" | string;
  annotations?: unknown[];
  onTextSelected?: (text: string, x: number, y: number) => void;
  onPageChange?: (pageNumber: number, progress: number) => void;
  onHighlight?: (text: string, pageNumber: number) => void;
}

type ViewMode = "reflow" | "page";

type TextItemLike = {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
};

type TextLine = {
  y: number;
  x: number;
  text: string;
};

function useMobileDefault() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeExtractedText(items: TextItemLike[]): string {
  const positioned: TextLine[] = [];

  for (const item of items) {
    const raw = item.str?.trim();

    if (!raw) continue;

    const transform = item.transform ?? [];
    const x = Number(transform[4] ?? 0);
    const y = Number(transform[5] ?? 0);

    positioned.push({ x, y, text: raw });
  }

  if (positioned.length === 0) return "";

  positioned.sort((a, b) => {
    const dy = Math.abs(b.y - a.y);

    if (dy > 4) return b.y - a.y;

    return a.x - b.x;
  });

  const lines: { y: number; parts: string[] }[] = [];

  for (const item of positioned) {
    const last = lines[lines.length - 1];

    if (!last || Math.abs(last.y - item.y) > 5) {
      lines.push({ y: item.y, parts: [item.text] });
    } else {
      last.parts.push(item.text);
    }
  }

  const paragraphs: string[] = [];
  let current = "";
  let previousY: number | null = null;

  for (const line of lines) {
    const lineText = line.parts.join(" ").replace(/\s+/g, " ").trim();

    if (!lineText) continue;

    const verticalGap = previousY === null ? 0 : Math.abs(previousY - line.y);
    const startsLikeNewParagraph = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9“"—-]/.test(lineText);
    const previousEndsSentence = /[.!?…:]$/.test(current.trim());

    if (
      current &&
      (verticalGap > 16 || (previousEndsSentence && startsLikeNewParagraph))
    ) {
      paragraphs.push(current.trim());
      current = lineText;
    } else {
      current = current ? `${current} ${lineText}` : lineText;
    }

    previousY = line.y;
  }

  if (current.trim()) paragraphs.push(current.trim());

  return paragraphs.join("\n\n");
}

export const PdfReader = forwardRef<PdfReaderHandle, PdfReaderProps>(function PdfReader({
  fileUrl,
  bookId,
  scale: initialScale = 1,
  theme = "light",
  onTextSelected,
  onPageChange,
}: PdfReaderProps, ref) {
  const isMobile = useMobileDefault();
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? "reflow"
      : "page",
  );
  const [fontSize, setFontSize] = useState(isMobile ? 20 : 22);
  const [lineHeight] = useState(1.72);
  const [pageText, setPageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(360);
  const [zoom, setZoom] = useState(initialScale);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTokenRef = useRef(0);

  const progress = useMemo(() => {
    if (!totalPages) return 0;
    return Math.round((pageNumber / totalPages) * 100);
  }, [pageNumber, totalPages]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const task = pdfjs.getDocument({
          url: fileUrl,
          useWorkerFetch: false,
          isEvalSupported: false,
          stopAtErrors: false,
          disableFontFace: false,
          useSystemFonts: true,
        });

        const loadedPdf = await task.promise;

        if (cancelled) return;

        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages || 1);
        setPageNumber(1);
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "Não foi possível abrir este PDF.";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  useEffect(() => {
    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      setContainerWidth(Math.max(260, Math.floor(rect?.width ?? window.innerWidth)));
    };

    update();

    const observer =
      typeof ResizeObserver !== "undefined" && containerRef.current
        ? new ResizeObserver(update)
        : null;

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    if (!pdf) return;

    onPageChange?.(pageNumber, progress);
  }, [pdf, pageNumber, progress, onPageChange]);

  useEffect(() => {
    if (!pdf) return;

    const activePdf = pdf;
    let cancelled = false;

    async function extract() {
      try {
        const page = await activePdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items as TextItemLike[];
        const text = normalizeExtractedText(items);

        if (!cancelled) {
          setPageText(text);
        }
      } catch {
        if (!cancelled) {
          setPageText("");
        }
      }
    }

    void extract();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || viewMode !== "page") return;

    const activePdf = pdf;
    let cancelled = false;
    const token = renderTokenRef.current + 1;
    renderTokenRef.current = token;

    async function render() {
      try {
        setRendering(true);

        const page = await activePdf.getPage(pageNumber);

        if (cancelled || renderTokenRef.current !== token) return;

        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas indisponível.");
        }

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(260, containerWidth - (isMobile ? 24 : 80));
        const fitScale = availableWidth / baseViewport.width;
        const cssScale = clamp(fitScale * zoom, 0.45, 3);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: cssScale * pixelRatio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: context,
          viewport,
          canvas,
        });

        await renderTask.promise;
      } catch (unknownError) {
        if (!cancelled) {
          const message =
            unknownError instanceof Error
              ? unknownError.message
              : "Não foi possível renderizar esta página.";
          setError(message);
        }
      } finally {
        if (!cancelled && renderTokenRef.current === token) {
          setRendering(false);
        }
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, viewMode, containerWidth, zoom, isMobile]);

  const goToPage = useCallback(
    (next: number) => {
      setPageNumber(current => clamp(next, 1, totalPages || current));
    },
    [totalPages],
  );

  const previousPage = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [goToPage, pageNumber]);

  const nextPage = useCallback(() => {
    goToPage(pageNumber + 1);
  }, [goToPage, pageNumber]);

  useImperativeHandle(
    ref,
    () => ({
      previousPage,
      nextPage,
      goToPage,
      zoomIn: () => setZoom(value => clamp(value + 0.15, 0.5, 2.8)),
      zoomOut: () => setZoom(value => clamp(value - 0.15, 0.5, 2.8)),
      zoomFit: () => setZoom(1),
    }),
    [previousPage, nextPage, goToPage],
  );

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();

    if (selected) {
      const rect = selection?.rangeCount
        ? selection.getRangeAt(0).getBoundingClientRect()
        : null;

      onTextSelected?.(selected, rect?.left ?? 0, rect?.top ?? 0);
    }
  }, [onTextSelected]);

  const increaseFont = () => setFontSize(value => clamp(value + 2, 14, 34));
  const decreaseFont = () => setFontSize(value => clamp(value - 2, 14, 34));
  const increaseZoom = () => setZoom(value => clamp(value + 0.15, 0.5, 2.8));
  const decreaseZoom = () => setZoom(value => clamp(value - 0.15, 0.5, 2.8));

  if (loading) {
    return (
      <div className="pdf-adaptive-shell" data-book-id={bookId}>
        <div className="pdf-adaptive-loading">
          <div className="spinner" />
          <span>Carregando PDF...</span>
        </div>
      </div>
    );
  }

  if (error && !pdf) {
    return (
      <div className="pdf-adaptive-shell" data-book-id={bookId}>
        <div className="pdf-adaptive-error">
          <strong>Não foi possível abrir este PDF</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pdf-adaptive-shell pdf-adaptive-${theme}`}
      data-book-id={bookId}
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
    >
      <div className="pdf-adaptive-toolbar">
        <div className="pdf-adaptive-mode">
          <button
            type="button"
            className={viewMode === "reflow" ? "active" : ""}
            onClick={() => setViewMode("reflow")}
          >
            Modo leitura
          </button>

          <button
            type="button"
            className={viewMode === "page" ? "active" : ""}
            onClick={() => setViewMode("page")}
          >
            Página original
          </button>
        </div>

        <div className="pdf-adaptive-tools">
          {viewMode === "reflow" ? (
            <>
              <button type="button" onClick={decreaseFont}>A-</button>
              <button type="button" onClick={increaseFont}>A+</button>
            </>
          ) : (
            <>
              <button type="button" onClick={decreaseZoom}>−</button>
              <button type="button" onClick={increaseZoom}>+</button>
            </>
          )}
        </div>
      </div>

      <div className="pdf-adaptive-content">
        {viewMode === "reflow" ? (
          <article
            className="pdf-reflow-page"
            style={{
              fontSize,
              lineHeight,
            }}
          >
            {pageText ? (
              pageText.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${pageNumber}-${index}`}>{paragraph}</p>
              ))
            ) : (
              <div className="pdf-reflow-empty">
                <strong>Esta página não possui texto selecionável.</strong>
                <span>
                  Ela pode ser escaneada como imagem. Use “Página original” para visualizar.
                </span>
                <button type="button" onClick={() => setViewMode("page")}>
                  Ver página original
                </button>
              </div>
            )}
          </article>
        ) : (
          <div className="pdf-page-mode">
            {rendering && (
              <div className="pdf-page-rendering">
                <div className="spinner" />
              </div>
            )}
            <canvas ref={canvasRef} className="pdf-adaptive-canvas" />
          </div>
        )}
      </div>

      <div className="pdf-adaptive-footer">
        <button
          type="button"
          onClick={previousPage}
          disabled={pageNumber <= 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <div className="pdf-adaptive-progress">
          <div>
            <span>Página {pageNumber} / {totalPages}</span>
            <span>{progress}%</span>
          </div>
          <div className="pdf-adaptive-track">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button
          type="button"
          onClick={nextPage}
          disabled={pageNumber >= totalPages}
          aria-label="Próxima página"
        >
          ›
        </button>
      </div>
    </div>
  );
});
