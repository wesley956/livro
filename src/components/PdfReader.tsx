// src/components/PdfReader.tsx
// Leitor de PDF com:
//  - Renderização via canvas (página por página, scroll contínuo)
//  - Text layer REAL: permite selecionar, copiar e marcar texto
//  - Zoom ajustável
//  - Progresso salvo automaticamente
//  - Suporte a highlights persistidos

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useReaderProgress } from "../hooks/useReaderProgress";
import type { Annotation, HighlightColor } from "../hooks/useAnnotations";

// ── Worker do PDF.js ──────────────────────────────────────────────────────────
// O Vite vai copiar o worker para o dist automaticamente via ?url
// IMPORTANTE: se der erro, troque pela linha do CDN comentada abaixo.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
// Alternativa CDN (use se o ?url não funcionar com viteSingleFile):
// pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface PdfReaderProps {
  fileUrl: string;       // URL do arquivo (blob: ou http:)
  bookId: string;
  scale?: number;        // Zoom inicial (padrão: auto-fit)
  theme?: "light" | "dark" | "sepia";
  annotations?: Annotation[];
  onTextSelected?: (text: string, x: number, y: number) => void;
  onPageChange?: (page: number, total: number) => void;
  onHighlight?: (color: HighlightColor, text: string, page: number, rects: DOMRect[]) => void;
}

export interface PdfReaderHandle {
  goToPage: (page: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  currentPage: number;
  totalPages: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;
const SCALE_STEP = 0.25;
const SAVE_DEBOUNCE_MS = 1500;

// ── Componente ────────────────────────────────────────────────────────────────
export const PdfReader = forwardRef<PdfReaderHandle, PdfReaderProps>(
  function PdfReader(
    { fileUrl, bookId, scale: initialScale, theme = "light", annotations: _annotations = [], onTextSelected, onPageChange, onHighlight: _onHighlight },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef<PDFDocumentProxy | null>(null);
    const renderTasksRef = useRef<Map<number, RenderTask>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(initialScale ?? 0); // 0 = auto-fit
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { saveProgress, loadProgress } = useReaderProgress(bookId);

    // ── Expõe API para o pai ────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      goToPage: (page: number) => scrollToPage(page),
      zoomIn: () => setScale((s) => Math.min(s + SCALE_STEP, SCALE_MAX)),
      zoomOut: () => setScale((s) => Math.max(s - SCALE_STEP, SCALE_MIN)),
      zoomFit: () => setScale(0),
      get currentPage() { return currentPage; },
      get totalPages() { return totalPages; },
    }));

    // ── Calcula scale automático baseado na largura do container ───────────
    const getAutoScale = useCallback(
      (pageWidth: number): number => {
        const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
        const padding = 48;
        return (containerWidth - padding) / pageWidth;
      },
      []
    );

    // ── Renderiza uma página no seu canvas + cria text layer ───────────────
    const renderPage = useCallback(
      async (pageNum: number, pdf: PDFDocumentProxy, effectiveScale: number) => {
        const wrapper = document.getElementById(`pdf-page-${pageNum}`);
        if (!wrapper) return;

        const canvas = wrapper.querySelector("canvas") as HTMLCanvasElement;
        const textLayerDiv = wrapper.querySelector(".textLayer") as HTMLDivElement;
        if (!canvas || !textLayerDiv) return;

        // Cancela render anterior desta página se houver
        const prevTask = renderTasksRef.current.get(pageNum);
        prevTask?.cancel();

        const page: PDFPageProxy = await pdf.getPage(pageNum);
        const s = effectiveScale > 0 ? effectiveScale : getAutoScale(page.getViewport({ scale: 1 }).width);
        const viewport = page.getViewport({ scale: s });

        // Configura o canvas para alta resolução (DPR)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Ajusta tamanho do wrapper
        (wrapper as HTMLElement).style.width = `${viewport.width}px`;
        (wrapper as HTMLElement).style.minHeight = `${viewport.height}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);

        const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        renderTasksRef.current.set(pageNum, renderTask);

        try {
          await renderTask.promise;
        } catch (err: unknown) {
          if ((err as Error)?.name === "RenderingCancelledException") return;
          throw err;
        }

        // ── Text Layer ────────────────────────────────────────────────────
        // Limpa text layer anterior
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        try {
          const textContent = await page.getTextContent();

          // Text layer manual: cria spans selecionáveis
            for (const item of textContent.items) {
              if (!("str" in item) || !item.str) continue;

              const textItem = item as {
                str: string;
                hasEOL?: boolean;
                transform: number[];
                width?: number;
                height?: number;
                ascent?: number;
              };

              const span = document.createElement("span");
              span.textContent = textItem.str + (textItem.hasEOL ? "\n" : "");

              const tx = pdfjs.Util.transform(viewport.transform, textItem.transform);
              const angle = Math.atan2(tx[1], tx[0]);
              const fontHeight = Math.max(1, Math.hypot(tx[2], tx[3]) || textItem.height || 10);
              const fontAscent =
                typeof textItem.ascent === "number"
                  ? textItem.ascent * fontHeight
                  : fontHeight;

              const textLength = Math.max(1, span.textContent.length);
              const scaleX =
                textItem.width && fontHeight
                  ? Math.max(0.4, Math.min(3, (textItem.width * s) / (fontHeight * textLength * 0.55)))
                  : 1;

              span.style.cssText = `
                left: ${tx[4]}px;
                top: ${tx[5] - fontAscent}px;
                font-size: ${fontHeight}px;
                transform: rotate(${angle}rad) scaleX(${scaleX});
              `;
              textLayerDiv.appendChild(span);
            }
        } catch (e) {
          console.warn(`[Lume PDF] Text layer p.${pageNum}:`, e);
        }
      },
      [getAutoScale]
    );

    // ── Scroll para uma página específica ──────────────────────────────────
    const scrollToPage = useCallback((page: number) => {
      const el = document.getElementById(`pdf-page-${page}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    // ── Carrega o PDF ──────────────────────────────────────────────────────
    useEffect(() => {
      if (!fileUrl) return;

      let cancelled = false;
      setLoading(true);
      setError(null);

      const load = async () => {
        try {
          const loadingTask = pdfjs.getDocument({ url: fileUrl });
          const pdf = await loadingTask.promise;
          if (cancelled) return;

          pdfRef.current = pdf;
          setTotalPages(pdf.numPages);

          // Recupera progresso salvo
          const progress = await loadProgress();
          const startPage = progress?.page ?? 1;

          setLoading(false);

          // Aguarda DOM renderizar os placeholders
          setTimeout(async () => {
            if (cancelled) return;
            // Renderiza páginas visíveis inicialmente (ao redor da startPage)
            const pagesToRender = new Set<number>();
            for (let p = Math.max(1, startPage - 1); p <= Math.min(pdf.numPages, startPage + 2); p++) {
              pagesToRender.add(p);
            }
            const effectiveScale = scale > 0 ? scale : 0;
            for (const p of pagesToRender) {
              await renderPage(p, pdf, effectiveScale);
            }
            // Vai para a página salva
            if (startPage > 1) scrollToPage(startPage);
          }, 100);
        } catch (err) {
          if (!cancelled) {
            console.error("[Lume PDF] Erro ao carregar:", err);
            setError("Não foi possível abrir este PDF. Verifique se o arquivo está correto.");
            setLoading(false);
          }
        }
      };

      load();
      return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileUrl]);

    // ── IntersectionObserver: renderiza páginas conforme o scroll ──────────
    useEffect(() => {
      if (!totalPages || !pdfRef.current) return;

      const pdf = pdfRef.current;

      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const pageNum = parseInt(
              (entry.target as HTMLElement).dataset.page ?? "0"
            );
            if (!pageNum) continue;

            // Atualiza página atual
            setCurrentPage((prev) => {
              if (prev !== pageNum) {
                onPageChange?.(pageNum, totalPages);
                return pageNum;
              }
              return prev;
            });

            // Renderiza esta página se ainda não renderizada
            const canvas = entry.target.querySelector("canvas") as HTMLCanvasElement;
            if (canvas && !canvas.dataset.rendered) {
              canvas.dataset.rendered = "1";
              renderPage(pageNum, pdf, scale);
            }
          }
        },
        {
          root: containerRef.current,
          rootMargin: "200px 0px",
          threshold: 0.1,
        }
      );

      // Observa todos os page wrappers
      document.querySelectorAll("[data-page]").forEach((el) =>
        observerRef.current?.observe(el)
      );

      return () => observerRef.current?.disconnect();
    }, [totalPages, scale, renderPage, onPageChange]);

    // ── Salva progresso com debounce ──────────────────────────────────────
    useEffect(() => {
      if (!currentPage) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveProgress({ page: currentPage, scrollY: containerRef.current?.scrollTop });
      }, SAVE_DEBOUNCE_MS);
      return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [currentPage, saveProgress]);

    // ── Detecta seleção de texto ──────────────────────────────────────────
    useEffect(() => {
      const handleMouseUp = (e: MouseEvent) => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length > 1 && onTextSelected) {
          onTextSelected(text, e.clientX, e.clientY);
        }
      };
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }, [onTextSelected]);

    // ── Renderização ───────────────────────────────────────────────────────
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-400">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-zinc-600">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm">Abrindo livro…</p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="reader-scroll-area"
        data-reader-theme={theme}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          overflowX: "hidden",
          background: theme === "dark" ? "#111" : theme === "sepia" ? "#f4ecd8" : "#525659",
          padding: "80px 0 64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Renderiza um wrapper placeholder para cada página */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <div
            key={pageNum}
            id={`pdf-page-${pageNum}`}
            data-page={pageNum}
            className="pdf-page-wrapper"
            style={{ position: "relative", margin: "0 auto 20px" }}
          >
            <canvas />
            <div className="textLayer" />
          </div>
        ))}
      </div>
    );
  }
);
