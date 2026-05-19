import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TouchEvent } from "react";
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
  theme?: "light" | "dark" | "sepia" | "jade" | string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  readerWidth?: number;
  pageMargin?: number;
  annotations?: unknown[];
  initialPage?: number;
  onTextSelected?: (text: string, x: number, y: number) => void;
  onPageChange?: (pageNumber: number, progress: number) => void;
  onHighlight?: (text: string, pageNumber: number) => void;
}

type ViewMode = "text" | "page" | "continuous";
type ReaderTheme = "dark" | "sepia" | "light" | "jade";

type TextItemLike = {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
  width?: number;
  height?: number;
};

type ExtractedPageText = {
  page: number;
  text: string;
  hasText: boolean;
  loading: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function getSavedPage(bookId: string, fallback = 1) {
  try {
    const raw = localStorage.getItem(`lume-reader-page:${bookId}`);
    const page = raw ? Number(raw) : fallback;
    return Number.isFinite(page) && page > 0 ? Math.round(page) : fallback;
  } catch {
    return fallback;
  }
}

function saveReaderPosition(bookId: string, page: number, progress: number) {
  try {
    localStorage.setItem(`lume-reader-page:${bookId}`, String(page));
    localStorage.setItem(
      `lume-reader-progress:${bookId}`,
      JSON.stringify({
        page,
        progress,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // localStorage pode falhar em alguns WebViews privados; não deve quebrar leitura.
  }
}

function getThemeName(theme: string | undefined): ReaderTheme {
  if (theme === "light" || theme === "sepia" || theme === "jade") return theme;
  return "dark";
}

function normalizePdfText(items: TextItemLike[]): string {
  const positioned: Array<{ x: number; y: number; text: string }> = [];

  for (const item of items) {
    const raw = item.str?.trim();
    if (!raw) continue;

    const transform = item.transform ?? [];
    positioned.push({
      text: raw,
      x: Number(transform[4] ?? 0),
      y: Number(transform[5] ?? 0),
    });
  }

  if (positioned.length === 0) return "";

  positioned.sort((a, b) => {
    const yGap = Math.abs(b.y - a.y);
    if (yGap > 4) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: Array<{ y: number; parts: string[] }> = [];

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
    const currentEndsSentence = /[.!?…:;]$/.test(current.trim());
    const looksLikeNewParagraph = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9“"—-]/.test(lineText);

    if (current && (verticalGap > 16 || (currentEndsSentence && looksLikeNewParagraph))) {
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

export const PdfReader = forwardRef<PdfReaderHandle, PdfReaderProps>(function PdfReader(
  {
    fileUrl,
    bookId,
    scale: initialScale = 1,
    theme = "dark",
    fontSize: controlledFontSize,
    fontFamily: controlledFontFamily,
    lineHeight: controlledLineHeight,
    readerWidth: controlledReaderWidth,
    pageMargin: controlledPageMargin,
    annotations: _annotations = [],
    initialPage = 1,
    onTextSelected,
    onPageChange,
    onHighlight: _onHighlight,
  },
  ref,
) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(() => getSavedPage(bookId, initialPage || 1));
  const [totalPages, setTotalPages] = useState(1);

  const [viewMode, setViewMode] = useState<ViewMode>(() => (isMobileDevice() ? "text" : "page"));
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => getThemeName(theme));
  const [fontSize, setFontSize] = useState(() => controlledFontSize ?? (isMobileDevice() ? 20 : 22));
  const [fontFamily, setFontFamily] = useState(controlledFontFamily ?? 'Georgia, serif');
  const [lineHeight, setLineHeight] = useState(controlledLineHeight ?? 1.72);
  const [readerWidth, setReaderWidth] = useState(controlledReaderWidth ?? 760);
  const [pageMargin, setPageMargin] = useState(controlledPageMargin ?? 28);
  const [zoom, setZoom] = useState(initialScale);

  const [continuousTextPages, setContinuousTextPages] = useState<ExtractedPageText[]>([]);
  const [containerWidth, setContainerWidth] = useState(360);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToValue, setGoToValue] = useState(() => String(getSavedPage(bookId, initialPage || 1)));
  const [orientationTick, setOrientationTick] = useState(0);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTokenRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastReportedPageRef = useRef(pageNumber);

  const progress = useMemo(() => {
    if (!totalPages) return 0;
    return Math.round((pageNumber / totalPages) * 100);
  }, [pageNumber, totalPages]);

  useEffect(() => {
    setReaderTheme(getThemeName(theme));
  }, [theme]);

  useEffect(() => {
    if (typeof controlledFontSize === 'number') setFontSize(controlledFontSize);
  }, [controlledFontSize]);

  useEffect(() => {
    if (controlledFontFamily) setFontFamily(controlledFontFamily);
  }, [controlledFontFamily]);

  useEffect(() => {
    if (typeof controlledLineHeight === 'number') setLineHeight(controlledLineHeight);
  }, [controlledLineHeight]);

  useEffect(() => {
    if (typeof controlledReaderWidth === 'number') setReaderWidth(controlledReaderWidth);
  }, [controlledReaderWidth]);

  useEffect(() => {
    if (typeof controlledPageMargin === 'number') setPageMargin(controlledPageMargin);
  }, [controlledPageMargin]);


  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
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

        const loaded = await task.promise;
        if (cancelled) return;

        const savedPage = clamp(getSavedPage(bookId, initialPage || 1), 1, loaded.numPages || 1);

        setPdf(loaded);
        setTotalPages(Math.max(1, loaded.numPages || 1));
        setPageNumber(savedPage);
        setGoToValue(String(savedPage));
        setLoading(false);

        window.setTimeout(() => {
          contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
        }, 80);
      } catch (unknownError) {
        const message =
          unknownError instanceof Error ? unknownError.message : "Não foi possível abrir este PDF.";

        if (!cancelled) {
          setError(message);
          setLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
    };
  }, [bookId, fileUrl, initialPage]);

  useEffect(() => {
    const updateSize = () => {
      const rect = shellRef.current?.getBoundingClientRect();
      setContainerWidth(Math.max(260, Math.floor(rect?.width ?? window.innerWidth)));
    };

    updateSize();

    const observer =
      typeof ResizeObserver !== "undefined" && shellRef.current
        ? new ResizeObserver(updateSize)
        : null;

    if (observer && shellRef.current) {
      observer.observe(shellRef.current);
    }

    const onOrientation = () => {
      window.setTimeout(() => {
        updateSize();
        setOrientationTick(value => value + 1);
      }, 250);
    };

    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);

  useEffect(() => {
    if (!pdf) return;

    saveReaderPosition(bookId, pageNumber, progress);
    onPageChange?.(pageNumber, progress);
  }, [bookId, pdf, pageNumber, progress, onPageChange]);

  useEffect(() => {
    if (!pdf || viewMode !== "text") return;

    const activePdf = pdf;
    let cancelled = false;

    const start = clamp(pageNumber, 1, activePdf.numPages);
    const end = clamp(pageNumber + 7, 1, activePdf.numPages);

    const initialPages: ExtractedPageText[] = [];

    for (let page = start; page <= end; page += 1) {
      initialPages.push({
        page,
        text: "",
        hasText: true,
        loading: true,
      });
    }

    setContinuousTextPages(initialPages);

    async function extractRange() {
      for (let pageNum = start; pageNum <= end; pageNum += 1) {
        if (cancelled) return;

        try {
          const page = await activePdf.getPage(pageNum);
          const content = await page.getTextContent();
          const text = normalizePdfText(content.items as TextItemLike[]);

          if (cancelled) return;

          setContinuousTextPages(current =>
            current.map(item =>
              item.page === pageNum
                ? {
                    page: pageNum,
                    text,
                    hasText: text.trim().length > 24,
                    loading: false,
                  }
                : item,
            ),
          );
        } catch {
          if (cancelled) return;

          setContinuousTextPages(current =>
            current.map(item =>
              item.page === pageNum
                ? {
                    page: pageNum,
                    text: "",
                    hasText: false,
                    loading: false,
                  }
                : item,
            ),
          );
        }
      }
    }

    void extractRange();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, viewMode]);

  useEffect(() => {
    if (!pdf || viewMode !== "page" || !canvasRef.current) return;

    const activePdf = pdf;
    let cancelled = false;
    const token = renderTokenRef.current + 1;
    renderTokenRef.current = token;

    async function renderPage() {
      try {
        setRendering(true);
        setError(null);

        const page = await activePdf.getPage(pageNumber);
        if (cancelled || renderTokenRef.current !== token) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas indisponível.");

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(260, containerWidth - 22);
        const fitScale = availableWidth / baseViewport.width;
        const cssScale = clamp(fitScale * zoom, 0.45, 3.2);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: cssScale * pixelRatio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : "Não foi possível renderizar esta página.";

        if (!cancelled) setError(message);
      } finally {
        if (!cancelled && renderTokenRef.current === token) {
          setRendering(false);
        }
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdf, viewMode, pageNumber, containerWidth, zoom, orientationTick]);

  const goToPage = useCallback(
    (next: number) => {
      const target = clamp(Math.round(next), 1, totalPages);
      setPageNumber(target);
      setGoToValue(String(target));
      contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
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
      zoomIn: () => setZoom(value => clamp(value + 0.15, 0.5, 3.2)),
      zoomOut: () => setZoom(value => clamp(value - 0.15, 0.5, 3.2)),
      zoomFit: () => setZoom(1),
    }),
    [previousPage, nextPage, goToPage],
  );

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();

    if (!selected) return;

    const rect = selection?.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    onTextSelected?.(selected, rect?.left ?? 0, rect?.top ?? 0);
  }, [onTextSelected]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
    touchStartY.current = event.touches[0]?.clientY ?? 0;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const x = event.changedTouches[0]?.clientX ?? 0;
    const y = event.changedTouches[0]?.clientY ?? 0;
    const dx = x - touchStartX.current;
    const dy = y - touchStartY.current;

    if (Math.abs(dx) > 70 && Math.abs(dy) < 70) {
      if (dx < 0) nextPage();
      else previousPage();
    }
  };

  const changeMode = (mode: ViewMode) => {
    setViewMode(mode);
    setSettingsOpen(false);
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  const submitGoTo = () => {
    const target = Number(goToValue);
    if (!Number.isFinite(target)) return;

    goToPage(target);
    setGoToOpen(false);
  };

  const updateVisibleTextPage = (page: number) => {
    if (page === lastReportedPageRef.current) return;

    lastReportedPageRef.current = page;
    setPageNumber(page);
    setGoToValue(String(page));
  };

  if (loading) {
    return (
      <div className="lume-r4-shell" data-reader-theme={readerTheme} data-book-id={bookId}>
        <div className="lume-r4-loading">
          <div className="spinner" />
          <strong>Carregando PDF...</strong>
          <span>Restaurando sua última posição</span>
        </div>
      </div>
    );
  }

  if (error && !pdf) {
    return (
      <div className="lume-r4-shell" data-reader-theme={readerTheme} data-book-id={bookId}>
        <div className="lume-r4-error">
          <strong>Não foi possível abrir este PDF</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="lume-r4-shell" data-reader-theme={readerTheme} data-book-id={bookId}>
      <header className="lume-r4-topbar always-visible">
        <div className="lume-r4-brand">
          <span>LUME</span>
          <small>{viewMode === "text" ? "Texto contínuo" : viewMode === "page" ? "Página original" : "PDF contínuo"}</small>
        </div>

        <div className="lume-r4-tabs" role="tablist" aria-label="Modo de leitura">
          <button
            type="button"
            className={viewMode === "text" ? "active" : ""}
            onClick={() => changeMode("text")}
          >
            Texto
          </button>
          <button
            type="button"
            className={viewMode === "page" ? "active" : ""}
            onClick={() => changeMode("page")}
          >
            Página
          </button>
          <button
            type="button"
            className={viewMode === "continuous" ? "active" : ""}
            onClick={() => changeMode("continuous")}
          >
            Contínuo
          </button>
        </div>

        <button
          type="button"
          className="lume-r4-icon-button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Configurações de leitura"
        >
          ⚙
        </button>
      </header>

      <main
        ref={contentRef}
        className="lume-r4-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleSelection}
      >
        {error && pdf && <div className="lume-r4-warning">{error}</div>}

        {viewMode === "text" && (
          <TextContinuousView
            pages={continuousTextPages}
            currentPage={pageNumber}
            totalPages={totalPages}
            fontSize={fontSize}
            fontFamily={fontFamily}
            lineHeight={lineHeight}
            readerWidth={readerWidth}
            pageMargin={pageMargin}
            onVisiblePage={updateVisibleTextPage}
            onOpenOriginalPage={page => {
              goToPage(page);
              changeMode("page");
            }}
          />
        )}

        {viewMode === "page" && (
          <div className="lume-r4-page-mode">
            {rendering && (
              <div className="lume-r4-rendering">
                <div className="spinner" />
              </div>
            )}
            <canvas ref={canvasRef} className="lume-r4-canvas" />
          </div>
        )}

        {viewMode === "continuous" && (
          <PdfContinuousPages
            pdf={pdf}
            currentPage={pageNumber}
            containerWidth={containerWidth}
            zoom={zoom}
            onVisiblePage={page => {
              setPageNumber(page);
              setGoToValue(String(page));
            }}
          />
        )}
      </main>

      <footer className="lume-r4-footer always-visible">
        <button type="button" onClick={previousPage} disabled={pageNumber <= 1} aria-label="Página anterior">
          ‹
        </button>

        <button type="button" className="lume-r4-page-pill" onClick={() => setGoToOpen(true)}>
          <span>{pageNumber} / {totalPages}</span>
          <small>{progress}%</small>
        </button>

        <button type="button" onClick={nextPage} disabled={pageNumber >= totalPages} aria-label="Próxima página">
          ›
        </button>

        <div className="lume-r4-track" aria-hidden="true">
          <div style={{ width: `${progress}%` }} />
        </div>
      </footer>

      {settingsOpen && (
        <>
          <button
            type="button"
            className="lume-r4-backdrop"
            onClick={() => setSettingsOpen(false)}
            aria-label="Fechar configurações"
          />

          <section className="lume-r4-sheet" aria-label="Configurações de leitura">
            <div className="lume-r4-sheet-handle" />
            <h2>Configurações de leitura</h2>

            <div className="lume-r4-sheet-group">
              <label>Tema</label>
              <div className="lume-r4-segment">
                <button type="button" className={readerTheme === "dark" ? "active" : ""} onClick={() => setReaderTheme("dark")}>Noite</button>
                <button type="button" className={readerTheme === "sepia" ? "active" : ""} onClick={() => setReaderTheme("sepia")}>Sépia</button>
                <button type="button" className={readerTheme === "light" ? "active" : ""} onClick={() => setReaderTheme("light")}>Claro</button>
                <button type="button" className={readerTheme === "jade" ? "active" : ""} onClick={() => setReaderTheme("jade")}>Jade</button>
              </div>
            </div>

            {viewMode === "text" ? (
              <>
                <div className="lume-r4-sheet-group">
                  <label>Tamanho da fonte</label>
                  <div className="lume-r4-row-controls">
                    <button type="button" onClick={() => setFontSize(value => clamp(value - 2, 14, 38))}>A-</button>
                    <strong>{fontSize}px</strong>
                    <button type="button" onClick={() => setFontSize(value => clamp(value + 2, 14, 38))}>A+</button>
                  </div>
                </div>

                <div className="lume-r4-sheet-group">
                  <label>Espaçamento</label>
                  <div className="lume-r4-row-controls">
                    <button type="button" onClick={() => setLineHeight(value => clamp(value - 0.08, 1.3, 2.25))}>−</button>
                    <strong>{lineHeight.toFixed(2)}</strong>
                    <button type="button" onClick={() => setLineHeight(value => clamp(value + 0.08, 1.3, 2.25))}>+</button>
                  </div>
                </div>

                <div className="lume-r4-sheet-group">
                  <label>Largura do texto</label>
                  <div className="lume-r4-row-controls">
                    <button type="button" onClick={() => setReaderWidth(value => clamp(value - 40, 360, 960))}>−</button>
                    <strong>{readerWidth}px</strong>
                    <button type="button" onClick={() => setReaderWidth(value => clamp(value + 40, 360, 960))}>+</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="lume-r4-sheet-group">
                <label>Zoom da página</label>
                <div className="lume-r4-row-controls">
                  <button type="button" onClick={() => setZoom(value => clamp(value - 0.15, 0.5, 3.2))}>−</button>
                  <strong>{Math.round(zoom * 100)}%</strong>
                  <button type="button" onClick={() => setZoom(value => clamp(value + 0.15, 0.5, 3.2))}>+</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {goToOpen && (
        <>
          <button type="button" className="lume-r4-backdrop" onClick={() => setGoToOpen(false)} aria-label="Fechar ir para página" />

          <section className="lume-r4-goto" aria-label="Ir para página">
            <h2>Ir para página</h2>
            <p>Digite um número entre 1 e {totalPages}.</p>

            <input
              type="number"
              min={1}
              max={totalPages}
              value={goToValue}
              onChange={event => setGoToValue(event.target.value)}
              autoFocus
            />

            <div>
              <button type="button" onClick={() => setGoToOpen(false)}>Cancelar</button>
              <button type="button" onClick={submitGoTo}>Abrir</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
});

function TextContinuousView({
  pages,
  currentPage,
  totalPages,
  fontSize,
  fontFamily,
  lineHeight,
  readerWidth,
  pageMargin,
  onVisiblePage,
  onOpenOriginalPage,
}: {
  pages: ExtractedPageText[];
  currentPage: number;
  totalPages: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  readerWidth: number;
  pageMargin: number;
  onVisiblePage: (page: number) => void;
  onOpenOriginalPage: (page: number) => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const page = Number((visible?.target as HTMLElement | undefined)?.dataset.page ?? 0);
        if (page > 0) onVisiblePage(page);
      },
      { root: root.parentElement, threshold: [0.45, 0.65] },
    );

    root.querySelectorAll("[data-page]").forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [pages, onVisiblePage]);

  if (pages.length === 0) {
    return (
      <article className="lume-r4-text-page" style={{ fontSize, fontFamily, lineHeight, maxWidth: `${readerWidth}px`, padding: `${pageMargin}px 22px` }}>
        <div className="lume-r4-text-loading">
          <div className="spinner" />
          <strong>Extraindo texto...</strong>
          <span>Preparando páginas próximas de {currentPage} / {totalPages}</span>
        </div>
      </article>
    );
  }

  return (
    <div ref={listRef} className="lume-r4-text-continuous">
      {pages.map(item => (
        <article
          key={item.page}
          className="lume-r4-text-page"
          data-page={item.page}
          style={{ fontSize, fontFamily, lineHeight, maxWidth: `${readerWidth}px`, padding: `${pageMargin}px 22px` }}
        >
          <div className="lume-r4-page-marker">Página {item.page}</div>

          {item.loading ? (
            <div className="lume-r4-text-loading">
              <div className="spinner" />
              <span>Extraindo texto desta página...</span>
            </div>
          ) : item.hasText ? (
            item.text.split(/\n{2,}/).map((paragraph, index) => (
              <p key={`${item.page}-${index}`}>{paragraph}</p>
            ))
          ) : (
            <div className="lume-r4-no-text">
              <strong>Página em imagem</strong>
              <span>
                Esta página não tem texto selecionável. Ela pode ser capa, foto, scan ou ilustração.
              </span>
              <button type="button" onClick={() => onOpenOriginalPage(item.page)}>
                Ver página original
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function PdfContinuousPages({
  pdf,
  currentPage,
  containerWidth,
  zoom,
  onVisiblePage,
}: {
  pdf: pdfjs.PDFDocumentProxy | null;
  currentPage: number;
  containerWidth: number;
  zoom: number;
  onVisiblePage: (page: number) => void;
}) {
  const pages = useMemo(() => {
    if (!pdf) return [];
    return Array.from({ length: pdf.numPages }, (_, index) => index + 1);
  }, [pdf]);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const page = Number((visible?.target as HTMLElement | undefined)?.dataset.page ?? 0);
        if (page > 0) onVisiblePage(page);
      },
      { root: root.parentElement, threshold: [0.45, 0.65, 0.85] },
    );

    root.querySelectorAll("[data-page]").forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [pages, onVisiblePage]);

  useEffect(() => {
    window.setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-page="${currentPage}"]`);
      el?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 80);
  }, []);

  return (
    <div ref={listRef} className="lume-r4-continuous-list">
      {pages.map(page => (
        <PdfContinuousPage key={page} pdf={pdf} pageNumber={page} containerWidth={containerWidth} zoom={zoom} />
      ))}
    </div>
  );
}

function PdfContinuousPage({
  pdf,
  pageNumber,
  containerWidth,
  zoom,
}: {
  pdf: pdfjs.PDFDocumentProxy | null;
  pageNumber: number;
  containerWidth: number;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldRender(true);
        }
      },
      { root: wrapper.parentElement?.parentElement ?? null, rootMargin: "900px" },
    );

    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !shouldRender) return;

    const activePdf = pdf;
    let cancelled = false;

    async function render() {
      try {
        const page = await activePdf.getPage(pageNumber);
        const canvas = canvasRef.current;

        if (!canvas || cancelled) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(260, containerWidth - 24);
        const fitScale = availableWidth / baseViewport.width;
        const cssScale = clamp(fitScale * zoom, 0.45, 3.2);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: cssScale * pixelRatio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
        canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch {
        // Página específica não deve quebrar o leitor inteiro.
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, containerWidth, zoom, shouldRender]);

  return (
    <div ref={wrapperRef} className="lume-r4-continuous-page" data-page={pageNumber}>
      <div className="lume-r4-continuous-label">Página {pageNumber}</div>
      <canvas ref={canvasRef} className="lume-r4-canvas" />
    </div>
  );
}
