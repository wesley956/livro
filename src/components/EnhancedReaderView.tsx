import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PdfReader, type PdfReaderHandle } from "./PdfReader";
import { EpubReader, type EpubReaderHandle } from "./EpubReader";
import { SelectionMenu } from "./SelectionMenu";
import { useAnnotations, type HighlightColor } from "../hooks/useAnnotations";

import "../styles/reader.css";

export interface Book {
  id: string;
  title: string;
  author?: string;
  type?: "pdf" | "epub";
  fileUrl: string;
  cover?: string;
}

interface ReaderViewProps {
  book: Book;
  onClose: () => void;
}

type Theme = "light" | "dark" | "sepia" | "jade";
type FontFamily = "serif" | "sans" | "mono";

type ReaderPrefs = {
  theme: Theme;
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: number;
  readerWidth: number;
  pageMargin: number;
};

const FONT_MAP: Record<FontFamily, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  mono: "'Courier New', Courier, monospace",
};

const THEME_BG: Record<Theme, string> = {
  light: "#f5f0e8",
  dark: "#0d0d0f",
  sepia: "#1e1a12",
  jade: "#0d1713",
};

const DEFAULT_PREFS: ReaderPrefs = {
  theme: "dark",
  fontSize: 20,
  fontFamily: "serif",
  lineHeight: 1.78,
  readerWidth: 760,
  pageMargin: 28,
};

function loadPrefs(): ReaderPrefs {
  try {
    const raw = localStorage.getItem("lume-reader-preferences-v3");
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;

    return {
      theme:
        parsed.theme === "light" ||
        parsed.theme === "dark" ||
        parsed.theme === "sepia" ||
        parsed.theme === "jade"
          ? parsed.theme
          : DEFAULT_PREFS.theme,
      fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULT_PREFS.fontSize,
      fontFamily:
        parsed.fontFamily === "serif" ||
        parsed.fontFamily === "sans" ||
        parsed.fontFamily === "mono"
          ? parsed.fontFamily
          : DEFAULT_PREFS.fontFamily,
      lineHeight: typeof parsed.lineHeight === "number" ? parsed.lineHeight : DEFAULT_PREFS.lineHeight,
      readerWidth: typeof parsed.readerWidth === "number" ? parsed.readerWidth : DEFAULT_PREFS.readerWidth,
      pageMargin: typeof parsed.pageMargin === "number" ? parsed.pageMargin : DEFAULT_PREFS.pageMargin,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: ReaderPrefs) {
  try {
    localStorage.setItem("lume-reader-preferences-v3", JSON.stringify(prefs));
  } catch {
    // Não quebrar leitura caso localStorage falhe.
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const ReaderView: React.FC<ReaderViewProps> = ({ book, onClose }) => {
  const bookType: "pdf" | "epub" =
    book.type ??
    (book.fileUrl.toLowerCase().includes(".epub") ? "epub" : "pdf");

  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadPrefs());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);

  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
    cfi?: string;
  } | null>(null);

  const [noteDialog, setNoteDialog] = useState<{
    text: string;
    color: HighlightColor;
  } | null>(null);

  const [noteText, setNoteText] = useState("");

  const pdfRef = useRef<PdfReaderHandle>(null);
  const epubRef = useRef<EpubReaderHandle>(null);

  const { annotations, addAnnotation } = useAnnotations(book.id);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    const handler = () => {
      const selected = window.getSelection()?.toString().trim();
      if (!selected) setSelection(null);
    };

    document.addEventListener("selectionchange", handler);

    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const updatePrefs = (patch: Partial<ReaderPrefs>) => {
    setPrefs(current => ({
      ...current,
      ...patch,
    }));
  };

  const handleTextSelected = useCallback((text: string, x: number, y: number, cfi?: string) => {
    setSelection({ text, x, y, cfi });
  }, []);

  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      if (!selection) return;

      await addAnnotation({
        page: currentPage,
        cfi: selection.cfi,
        selectedText: selection.text,
        color,
      });

      if (bookType === "epub" && selection.cfi) {
        epubRef.current?.addHighlight(selection.cfi, color);
      }
    },
    [selection, addAnnotation, currentPage, bookType],
  );

  const handleAnnotate = useCallback(() => {
    if (!selection) return;
    setNoteDialog({ text: selection.text, color: "yellow" });
    setNoteText("");
  }, [selection]);

  const handleSaveNote = useCallback(async () => {
    if (!selection || !noteDialog) return;

    await addAnnotation({
      page: currentPage,
      cfi: selection.cfi,
      selectedText: noteDialog.text,
      color: noteDialog.color,
      note: noteText,
    });

    setNoteDialog(null);
    setNoteText("");
  }, [selection, noteDialog, noteText, addAnnotation, currentPage]);

  return (
    <div
      className="lume-reader-unified"
      data-reader-theme={prefs.theme}
      style={{
        background: THEME_BG[prefs.theme],
      }}
    >
      <header className="lume-reader-unified-toolbar">
        <button type="button" onClick={onClose} aria-label="Voltar à biblioteca">
          ‹
        </button>

        <div className="lume-reader-unified-title">
          <strong>{book.title}</strong>
          <span>
            {bookType === "pdf" ? "PDF" : "EPUB"} • {progress > 0 ? `${progress}%` : "Leitura"}
          </span>
        </div>

        <button
          type="button"
          className={annotations.length ? "has-notes" : ""}
          onClick={() => setSettingsOpen(false)}
          title={`${annotations.length} anotações`}
          aria-label="Anotações"
        >
          ✎
          {annotations.length > 0 && <small>{annotations.length}</small>}
        </button>

        <button
          type="button"
          className={settingsOpen ? "active" : ""}
          onClick={() => setSettingsOpen(value => !value)}
          aria-label="Configurações de leitura"
        >
          ⚙
        </button>
      </header>

      {settingsOpen && (
        <aside className="lume-reader-settings-panel">
          <div className="lume-reader-settings-header">
            <strong>Configurações</strong>
            <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fechar">
              ×
            </button>
          </div>

          <section>
            <label>Tema</label>
            <div className="lume-reader-segment four">
              {(["dark", "sepia", "light", "jade"] as Theme[]).map(theme => (
                <button
                  key={theme}
                  type="button"
                  className={prefs.theme === theme ? "active" : ""}
                  onClick={() => updatePrefs({ theme })}
                >
                  {theme === "dark" ? "Noite" : theme === "sepia" ? "Sépia" : theme === "light" ? "Claro" : "Jade"}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label>Fonte</label>
            <div className="lume-reader-segment">
              {(["serif", "sans", "mono"] as FontFamily[]).map(font => (
                <button
                  key={font}
                  type="button"
                  className={prefs.fontFamily === font ? "active" : ""}
                  onClick={() => updatePrefs({ fontFamily: font })}
                  style={{ fontFamily: FONT_MAP[font] }}
                >
                  {font === "serif" ? "Serif" : font === "sans" ? "Sans" : "Mono"}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label>Tamanho do texto — {prefs.fontSize}px</label>
            <div className="lume-reader-control-row">
              <button type="button" onClick={() => updatePrefs({ fontSize: clamp(prefs.fontSize - 2, 12, 40) })}>
                A-
              </button>
              <input
                type="range"
                min="12"
                max="40"
                step="1"
                value={prefs.fontSize}
                onChange={event => updatePrefs({ fontSize: Number(event.target.value) })}
              />
              <button type="button" onClick={() => updatePrefs({ fontSize: clamp(prefs.fontSize + 2, 12, 40) })}>
                A+
              </button>
            </div>
          </section>

          <section>
            <label>Espaçamento — {prefs.lineHeight.toFixed(2)}</label>
            <div className="lume-reader-control-row">
              <button
                type="button"
                onClick={() => updatePrefs({ lineHeight: clamp(Number((prefs.lineHeight - 0.08).toFixed(2)), 1.25, 2.4) })}
              >
                −
              </button>
              <input
                type="range"
                min="1.25"
                max="2.4"
                step="0.05"
                value={prefs.lineHeight}
                onChange={event => updatePrefs({ lineHeight: Number(event.target.value) })}
              />
              <button
                type="button"
                onClick={() => updatePrefs({ lineHeight: clamp(Number((prefs.lineHeight + 0.08).toFixed(2)), 1.25, 2.4) })}
              >
                +
              </button>
            </div>
          </section>

          <section>
            <label>Largura do texto — {prefs.readerWidth}px</label>
            <div className="lume-reader-control-row">
              <button type="button" onClick={() => updatePrefs({ readerWidth: clamp(prefs.readerWidth - 40, 320, 980) })}>
                −
              </button>
              <input
                type="range"
                min="320"
                max="980"
                step="20"
                value={prefs.readerWidth}
                onChange={event => updatePrefs({ readerWidth: Number(event.target.value) })}
              />
              <button type="button" onClick={() => updatePrefs({ readerWidth: clamp(prefs.readerWidth + 40, 320, 980) })}>
                +
              </button>
            </div>
          </section>

          <section>
            <label>Margem — {prefs.pageMargin}px</label>
            <div className="lume-reader-control-row">
              <button type="button" onClick={() => updatePrefs({ pageMargin: clamp(prefs.pageMargin - 4, 8, 80) })}>
                −
              </button>
              <input
                type="range"
                min="8"
                max="80"
                step="2"
                value={prefs.pageMargin}
                onChange={event => updatePrefs({ pageMargin: Number(event.target.value) })}
              />
              <button type="button" onClick={() => updatePrefs({ pageMargin: clamp(prefs.pageMargin + 4, 8, 80) })}>
                +
              </button>
            </div>
          </section>

          {bookType === "pdf" && (
            <section>
              <label>Zoom da página original</label>
              <div className="lume-reader-zoom-row">
                <button type="button" onClick={() => pdfRef.current?.zoomOut()}>
                  −
                </button>
                <button type="button" onClick={() => pdfRef.current?.zoomFit()}>
                  Ajustar tela
                </button>
                <button type="button" onClick={() => pdfRef.current?.zoomIn()}>
                  +
                </button>
              </div>
            </section>
          )}
        </aside>
      )}

      <main className="lume-reader-unified-content">
        {bookType === "pdf" ? (
          <PdfReader
            ref={pdfRef}
            fileUrl={book.fileUrl}
            bookId={book.id}
            theme={prefs.theme}
            fontSize={prefs.fontSize}
            fontFamily={FONT_MAP[prefs.fontFamily]}
            lineHeight={prefs.lineHeight}
            readerWidth={prefs.readerWidth}
            pageMargin={prefs.pageMargin}
            annotations={annotations}
            onTextSelected={(text: string, x: number, y: number) => handleTextSelected(text, x, y)}
            onPageChange={(page, nextProgress) => {
              setCurrentPage(page);
              setProgress(nextProgress);
            }}
          />
        ) : (
          <EpubReader
            ref={epubRef}
            fileUrl={book.fileUrl}
            bookId={book.id}
            theme={prefs.theme}
            fontSize={prefs.fontSize}
            fontFamily={FONT_MAP[prefs.fontFamily]}
            lineHeight={prefs.lineHeight}
            readerWidth={prefs.readerWidth}
            pageMargin={prefs.pageMargin}
            annotations={annotations}
            onTextSelected={(text, x, y, cfi) => handleTextSelected(text, x, y, cfi)}
            onPageChange={(_cfi, nextProgress) => {
              setProgress(nextProgress);
            }}
          />
        )}
      </main>

      {bookType === "epub" && (
        <footer className="lume-reader-unified-footer">
          <button type="button" onClick={() => epubRef.current?.prev()} aria-label="Voltar">
            ‹
          </button>
          <span>{progress > 0 ? `${progress}%` : "EPUB contínuo"}</span>
          <button type="button" onClick={() => epubRef.current?.next()} aria-label="Avançar">
            ›
          </button>
        </footer>
      )}

      {selection && (
        <SelectionMenu
          x={selection.x}
          y={selection.y}
          selectedText={selection.text}
          onCopy={() => navigator.clipboard?.writeText(selection.text)}
          onHighlight={handleHighlight}
          onAnnotate={handleAnnotate}
          onClose={() => setSelection(null)}
        />
      )}

      {noteDialog && (
        <div
          className="lume-reader-note-backdrop"
          onClick={event => {
            if (event.target === event.currentTarget) setNoteDialog(null);
          }}
        >
          <div className="lume-reader-note-dialog">
            <p>Trecho selecionado:</p>
            <blockquote>
              “{noteDialog.text.slice(0, 200)}{noteDialog.text.length > 200 ? "…" : ""}”
            </blockquote>

            <textarea
              value={noteText}
              onChange={event => setNoteText(event.target.value)}
              placeholder="Escreva sua nota aqui…"
              autoFocus
            />

            <div>
              <button type="button" onClick={() => setNoteDialog(null)}>
                Cancelar
              </button>
              <button type="button" onClick={handleSaveNote}>
                Salvar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
