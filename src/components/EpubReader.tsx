// src/components/EpubReader.tsx
// Leitor de EPUB usando epub.js.
// O epub.js renderiza em HTML real → seleção, cópia e highlight nativos.

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import ePub, { Book, Rendition } from "epubjs";
import { useReaderProgress } from "../hooks/useReaderProgress";
import type { HighlightColor } from "../hooks/useAnnotations";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface EpubReaderProps {
  fileUrl: string;
  bookId: string;
  fontSize?: number;     // em px, padrão: 18
  fontFamily?: string;   // padrão: "Georgia, serif"
  lineHeight?: number;   // padrão: 1.75
  theme?: "light" | "dark" | "sepia";
  onTextSelected?: (text: string, x: number, y: number, cfi: string) => void;
  onPageChange?: (currentCfi: string, progress: number) => void;
  onHighlight?: (color: HighlightColor, text: string, cfi: string) => void;
}

export interface EpubReaderHandle {
  next: () => void;
  prev: () => void;
  goToCfi: (cfi: string) => void;
  addHighlight: (cfi: string, color: HighlightColor) => void;
  removeHighlight: (cfi: string) => void;
}

// ── Temas de renderização do epub.js ─────────────────────────────────────────
const EPUB_THEMES = {
  light: {
    body: {
      background: "#ffffff",
      color: "#1a1a1a",
      "font-size": "18px",
      "line-height": "1.75",
      padding: "20px 40px",
      "max-width": "680px",
      margin: "0 auto",
    },
    "a:link": { color: "#7c6ef2" },
    "::selection": { background: "rgba(100, 160, 255, 0.35)" },
  },
  dark: {
    body: {
      background: "#0d0d0f",
      color: "#d4d4d8",
      "font-size": "18px",
      "line-height": "1.75",
      padding: "20px 40px",
      "max-width": "680px",
      margin: "0 auto",
    },
    "a:link": { color: "#a78bfa" },
    "::selection": { background: "rgba(100, 160, 255, 0.35)" },
  },
  sepia: {
    body: {
      background: "#f4ecd8",
      color: "#3d2b1f",
      "font-size": "18px",
      "line-height": "1.75",
      padding: "20px 40px",
      "max-width": "680px",
      margin: "0 auto",
    },
    "a:link": { color: "#8b5e3c" },
    "::selection": { background: "rgba(180, 140, 60, 0.4)" },
  },
};

// ── Componente ────────────────────────────────────────────────────────────────
export const EpubReader = forwardRef<EpubReaderHandle, EpubReaderProps>(
  function EpubReader(
    {
      fileUrl,
      bookId,
      fontSize = 18,
      fontFamily = "Georgia, 'Times New Roman', serif",
      lineHeight = 1.75,
      theme = "light",
      onTextSelected,
      onPageChange,
      onHighlight: _onHighlight,
    },
    ref
  ) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { saveProgress, loadProgress } = useReaderProgress(bookId);

    // ── Expõe API para o pai ──────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      next: () => renditionRef.current?.next(),
      prev: () => renditionRef.current?.prev(),
      goToCfi: (cfi: string) => renditionRef.current?.display(cfi),
      addHighlight: (cfi: string, color: HighlightColor) => {
        const colorMap: Record<HighlightColor, string> = {
          yellow: "rgba(250, 204, 21, 0.4)",
          green:  "rgba(74, 222, 128, 0.4)",
          blue:   "rgba(96, 165, 250, 0.4)",
          red:    "rgba(248, 113, 113, 0.4)",
        };
        renditionRef.current?.annotations.add(
          "highlight",
          cfi,
          {},
          undefined,
          "lume-epub-hl",
          { fill: colorMap[color], "fill-opacity": "0.5" }
        );
      },
      removeHighlight: (cfi: string) => {
        renditionRef.current?.annotations.remove(cfi, "highlight");
      },
    }));

    // ── Aplica tema e fonte na rendition ──────────────────────────────────
    const applyTheme = useCallback(
      (rendition: Rendition) => {
        const themeConfig = {
          ...EPUB_THEMES[theme],
          body: {
            ...EPUB_THEMES[theme].body,
            "font-size": `${fontSize}px`,
            "font-family": fontFamily,
            "line-height": String(lineHeight),
          },
        };
        rendition.themes.register("lume", themeConfig);
        rendition.themes.select("lume");
      },
      [theme, fontSize, fontFamily, lineHeight]
    );

    // ── Carrega o EPUB ────────────────────────────────────────────────────
    useEffect(() => {
      if (!fileUrl || !viewerRef.current) return;

      let cancelled = false;

      const load = async () => {
        // Destrói instância anterior
        bookRef.current?.destroy();
        if (viewerRef.current) viewerRef.current.innerHTML = "";

        setLoading(true);
        setError(null);

        try {
          const book = ePub(fileUrl);
          bookRef.current = book;

          const rendition = book.renderTo(viewerRef.current!, {
            flow: "paginated",
            width: "100%",
            height: "100%",
            allowScriptedContent: false,
          });
          renditionRef.current = rendition;

          // Aplica tema
          applyTheme(rendition);

          // Recupera progresso salvo
          const progress = await loadProgress();
          await rendition.display(progress?.cfi ?? undefined);

          if (cancelled) return;
          setLoading(false);

          // ── Detecta seleção de texto ──────────────────────────────────
          rendition.on("selected", (cfi: string, contents: any) => {
            const selection = contents?.window?.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 1 && onTextSelected) {
              const range = selection?.getRangeAt(0);
              const rect = range?.getBoundingClientRect();
              if (rect) {
                // Converte coordenadas do iframe para a janela principal
                const iframe = viewerRef.current?.querySelector("iframe");
                const iframeRect = iframe?.getBoundingClientRect();
                onTextSelected(
                  text,
                  (iframeRect?.left ?? 0) + rect.x + rect.width / 2,
                  (iframeRect?.top ?? 0) + rect.y,
                  cfi
                );
              }
            }
          });

          // ── Salva progresso conforme navega ───────────────────────────
          rendition.on("locationChanged", (loc: any) => {
            const cfi = loc?.start?.cfi;
            if (cfi) {
              saveProgress({ page: loc?.start?.location ?? 1, cfi });
              onPageChange?.(cfi, loc?.start?.percentage ?? 0);
            }
          });
        } catch (err) {
          if (!cancelled) {
            console.error("[Lume EPUB] Erro ao carregar:", err);
            setError("Não foi possível abrir este EPUB. O arquivo pode estar corrompido.");
            setLoading(false);
          }
        }
      };

      load();
      return () => {
        cancelled = true;
        bookRef.current?.destroy();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileUrl]);

    // ── Atualiza tema/fonte sem recarregar o livro ────────────────────────
    useEffect(() => {
      if (renditionRef.current) applyTheme(renditionRef.current);
    }, [applyTheme]);

    // ── Navegação por teclado ─────────────────────────────────────────────
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "PageDown") renditionRef.current?.next();
        if (e.key === "ArrowLeft"  || e.key === "PageUp")   renditionRef.current?.prev();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, []);

    const bgColor =
      theme === "dark" ? "#0d0d0f" : theme === "sepia" ? "#f4ecd8" : "#ffffff";

    return (
      <div style={{ position: "absolute", inset: 0, background: bgColor }}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-sm">Abrindo livro…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-zinc-600">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Container do epub.js */}
        <div
          ref={viewerRef}
          className="epub-viewer-wrap"
          style={{
            position: "absolute",
            inset: 0,
            display: loading || error ? "none" : "block",
          }}
        />

        {/* Áreas de toque para virar página (mobile) */}
        {!loading && !error && (
          <>
            <button
              onClick={() => renditionRef.current?.prev()}
              aria-label="Página anterior"
              style={{
                position: "absolute",
                left: 0,
                top: "10%",
                bottom: "10%",
                width: "15%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                zIndex: 10,
              }}
            />
            <button
              onClick={() => renditionRef.current?.next()}
              aria-label="Próxima página"
              style={{
                position: "absolute",
                right: 0,
                top: "10%",
                bottom: "10%",
                width: "15%",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                zIndex: 10,
              }}
            />
          </>
        )}
      </div>
    );
  }
);
