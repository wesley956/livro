// src/components/ReaderView.tsx
// ============================================================
// SUBSTITUA completamente o arquivo src/components/ReaderView.tsx
// existente por este.
//
// Esta versão inclui:
//  - Leitor real de PDF (texto selecionável, copiável, marcável)
//  - Leitor real de EPUB (paginado, texto nativo)
//  - Toolbar que some/aparece ao tocar a tela
//  - Painel de configurações (tema, fonte, tamanho)
//  - Menu de seleção de texto (copiar, destacar, anotar)
//  - Progresso salvo automaticamente
// ============================================================

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

import { PdfReader, type PdfReaderHandle } from "./PdfReader";
import { EpubReader, type EpubReaderHandle } from "./EpubReader";
import { SelectionMenu } from "./SelectionMenu";
import { useAnnotations, type HighlightColor } from "../hooks/useAnnotations";

// Importa o CSS do leitor (text layer, toolbar, etc.)
import "../styles/reader.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author?: string;
  /** "pdf" | "epub" — detectado a partir da extensão se omitido */
  type?: "pdf" | "epub";
  /** URL do arquivo: pode ser blob:, data:, ou http: */
  fileUrl: string;
  cover?: string;
}

interface ReaderViewProps {
  book: Book;
  onClose: () => void;
}

type Theme      = "light" | "dark" | "sepia";
type FontFamily = "serif" | "sans" | "mono";

const FONT_MAP: Record<FontFamily, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  sans:  "'Inter', 'Helvetica Neue', sans-serif",
  mono:  "'Courier New', Courier, monospace",
};

const THEME_BG: Record<Theme, string> = {
  light: "#525659",
  dark:  "#0d0d0f",
  sepia: "#bfaa88",
};

// ── Componente ────────────────────────────────────────────────────────────────
export const ReaderView: React.FC<ReaderViewProps> = ({ book, onClose }) => {
  // Detecta tipo do arquivo
  const bookType: "pdf" | "epub" =
    book.type ??
    (book.fileUrl.toLowerCase().includes(".epub") ? "epub" : "pdf");

  // ── Estado ──────────────────────────────────────────────────────────────
  const [theme, setTheme]         = useState<Theme>("dark");
  const [fontSize, setFontSize]   = useState(18);
  const [fontFamily, setFont]     = useState<FontFamily>("serif");
  const [toolbarVisible, showToolbar] = useState(true);
  const [settingsOpen, openSettings] = useState(false);

  // Para PDF: página atual / total
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(0);

  // Seleção de texto
  const [selection, setSelection] = useState<{
    text: string; x: number; y: number; cfi?: string;
  } | null>(null);

  // Note dialog
  const [noteDialog, setNoteDialog] = useState<{ text: string; color: HighlightColor } | null>(null);
  const [noteText, setNoteText] = useState("");

  const pdfRef  = useRef<PdfReaderHandle>(null);
  const epubRef = useRef<EpubReaderHandle>(null);

  const { annotations, addAnnotation } = useAnnotations(book.id);

  // ── Toolbar auto-hide ────────────────────────────────────────────────────
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showToolbar(true);
    hideTimer.current = setTimeout(() => {
      if (!settingsOpen) showToolbar(false);
    }, 3500);
  }, [settingsOpen]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fecha selection menu ao tocar em outro lugar
  useEffect(() => {
    const handler = () => setSelection(null);
    document.addEventListener("selectionchange", () => {
      const sel = window.getSelection();
      if (!sel?.toString().trim()) setSelection(null);
    });
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  // ── Callbacks ────────────────────────────────────────────────────────────
  const handleTextSelected = useCallback(
    (text: string, x: number, y: number, cfi?: string) => {
      setSelection({ text, x, y, cfi });
    },
    []
  );

  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      if (!selection) return;
      await addAnnotation({
        page: currentPage,
        cfi: selection.cfi,
        selectedText: selection.text,
        color,
      });
      // Aplica no EPUB via rendition
      if (bookType === "epub" && selection.cfi) {
        epubRef.current?.addHighlight(selection.cfi, color);
      }
    },
    [selection, addAnnotation, currentPage, bookType]
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: THEME_BG[theme],
        zIndex: 100,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* ── Toolbar Superior ─────────────────────────────────────────── */}
      <div className={`reader-toolbar ${toolbarVisible ? "" : "hidden"}`}>
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          title="Voltar à biblioteca"
          style={{
            background: "transparent",
            border: "none",
            color: "#a1a1aa",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Título */}
        <span
          style={{
            flex: 1,
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 8px",
          }}
        >
          {book.title}
        </span>

        {/* Anotações */}
        <button
          onClick={() => { openSettings(false); }}
          title={`${annotations.length} anotações`}
          style={{
            background: "transparent",
            border: "none",
            color: annotations.length ? "#f59e0b" : "#52525b",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            borderRadius: "8px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          {annotations.length > 0 && <span>{annotations.length}</span>}
        </button>

        {/* Configurações */}
        <button
          onClick={() => openSettings((v) => !v)}
          title="Configurações de leitura"
          style={{
            background: settingsOpen ? "#27272a" : "transparent",
            border: "none",
            color: "#a1a1aa",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* ── Painel de Configurações ───────────────────────────────────── */}
      {settingsOpen && (
        <div className="reader-settings-panel">
          {/* Tema */}
          <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Tema</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["light", "dark", "sepia"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: theme === t ? "2px solid #f59e0b" : "2px solid #3f3f46",
                  background: t === "light" ? "#fff" : t === "dark" ? "#0d0d0f" : "#f4ecd8",
                  color: t === "light" ? "#1a1a1a" : t === "dark" ? "#e4e4e7" : "#3d2b1f",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Sépia"}
              </button>
            ))}
          </div>

          {/* Fonte */}
          <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Fonte</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["serif", "sans", "mono"] as FontFamily[]).map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: fontFamily === f ? "2px solid #f59e0b" : "2px solid #3f3f46",
                  background: "#27272a",
                  color: "#e4e4e7",
                  cursor: "pointer",
                  fontSize: f === "serif" ? 14 : f === "sans" ? 12 : 11,
                  fontFamily: FONT_MAP[f],
                }}
              >
                {f === "serif" ? "Serif" : f === "sans" ? "Sans" : "Mono"}
              </button>
            ))}
          </div>

          {/* Tamanho da fonte */}
          <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Tamanho do texto — {fontSize}px
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7", cursor: "pointer", fontSize: 18 }}
            >−</button>
            <div style={{ flex: 1, height: 4, background: "#3f3f46", borderRadius: 2, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  borderRadius: 2,
                  background: "#f59e0b",
                  width: `${((fontSize - 12) / (32 - 12)) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={() => setFontSize((s) => Math.min(32, s + 2))}
              style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7", cursor: "pointer", fontSize: 18 }}
            >+</button>
          </div>

          {/* Zoom (só para PDF) */}
          {bookType === "pdf" && (
            <>
              <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 10 }}>Zoom (PDF)</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => pdfRef.current?.zoomOut()} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7", cursor: "pointer" }}>−</button>
                <button onClick={() => pdfRef.current?.zoomFit()} style={{ flex: 2, padding: "8px", borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7", cursor: "pointer", fontSize: 12 }}>Ajustar tela</button>
                <button onClick={() => pdfRef.current?.zoomIn()} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #3f3f46", background: "#27272a", color: "#e4e4e7", cursor: "pointer" }}>+</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Área de Leitura ───────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {bookType === "pdf" ? (
          <PdfReader
            ref={pdfRef}
            fileUrl={book.fileUrl}
            bookId={book.id}
            theme={theme}
            annotations={annotations}
            onTextSelected={(text: string, x: number, y: number) => handleTextSelected(text, x, y)}
            onPageChange={(page, total) => {
              setCurrentPage(page);
              setTotalPages(total);
            }}
          />
        ) : (
          <EpubReader
            ref={epubRef}
            fileUrl={book.fileUrl}
            bookId={book.id}
            theme={theme}
            fontSize={fontSize}
            fontFamily={FONT_MAP[fontFamily]}
            lineHeight={1.75}
            onTextSelected={(text, x, y, cfi) => handleTextSelected(text, x, y, cfi)}
            onPageChange={(_cfi, progress) => {
              setCurrentPage(Math.round(progress * 100));
            }}
          />
        )}
      </div>

      {/* ── Barra Inferior ────────────────────────────────────────────── */}
      <div className={`reader-bottom-bar ${toolbarVisible ? "" : "hidden"}`}>
        {bookType === "pdf" && totalPages > 0 ? (
          <>
            <button
              onClick={() => pdfRef.current?.goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              style={{ background: "transparent", border: "none", color: currentPage <= 1 ? "#3f3f46" : "#a1a1aa", cursor: currentPage <= 1 ? "default" : "pointer", padding: "8px", display: "flex" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <span style={{ color: "#71717a", fontSize: 13 }}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => pdfRef.current?.goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              style={{ background: "transparent", border: "none", color: currentPage >= totalPages ? "#3f3f46" : "#a1a1aa", cursor: currentPage >= totalPages ? "default" : "pointer", padding: "8px", display: "flex" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        ) : bookType === "epub" ? (
          <>
            <button
              onClick={() => epubRef.current?.prev()}
              style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", padding: "8px", display: "flex" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <span style={{ color: "#71717a", fontSize: 13 }}>
              {currentPage > 0 ? `${currentPage}%` : ""}
            </span>

            <button
              onClick={() => epubRef.current?.next()}
              style={{ background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", padding: "8px", display: "flex" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        ) : null}
      </div>

      {/* ── Menu de Seleção de Texto ──────────────────────────────────── */}
      {selection && (
        <SelectionMenu
          x={selection.x}
          y={selection.y}
          selectedText={selection.text}
          onCopy={() => {}}
          onHighlight={handleHighlight}
          onAnnotate={handleAnnotate}
          onClose={() => setSelection(null)}
        />
      )}

      {/* ── Dialog de Anotação ────────────────────────────────────────── */}
      {noteDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setNoteDialog(null); }}
        >
          <div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}>
            <p style={{ color: "#71717a", fontSize: 12, marginBottom: 8 }}>Trecho selecionado:</p>
            <p style={{ color: "#a1a1aa", fontSize: 13, fontStyle: "italic", marginBottom: 16, lineHeight: 1.5, background: "#27272a", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid #f59e0b" }}>
              "{noteDialog.text.slice(0, 200)}{noteDialog.text.length > 200 ? "…" : ""}"
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua nota aqui…"
              autoFocus
              style={{
                width: "100%",
                minHeight: 100,
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 10,
                color: "#e4e4e7",
                fontSize: 14,
                padding: "12px",
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setNoteDialog(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #3f3f46", background: "transparent", color: "#a1a1aa", cursor: "pointer" }}
              >Cancelar</button>
              <button
                onClick={handleSaveNote}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#f59e0b", color: "#0d0d0f", cursor: "pointer", fontWeight: 600 }}
              >Salvar nota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
