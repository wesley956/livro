import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../stores/AppContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import type { ThemeName } from '../../types';
import type { PDFDoc } from '../../utils/pdfLoader';
import type { EpubBook, EpubChapter } from '../../utils/epubLoader';

const THEME_STYLES: Record<ThemeName, { bg: string; text: string; panel: string }> = {
  jade: { bg: '#0d1a14', text: '#f0e8d8', panel: '#141a16' },
  paper: { bg: '#f5f0e8', text: '#1a1a1a', panel: '#ede5d5' },
  'dark-paper': { bg: '#2a2520', text: '#d4c9b0', panel: '#221f1a' },
  night: { bg: '#000000', text: '#ffffff', panel: '#0a0a0a' },
};

const FONT_FAMILIES: Record<string, string> = {
  garamond: "'Cormorant Garamond', Georgia, serif",
  inter: "'Inter', sans-serif",
  noto: "'Noto Serif SC', serif",
};

export function ReaderView() {
  const { navigate, setProgress, addBookmark, deleteBookmark, addSession, addNote, state } = useApp();
  const { currentBookId, books, bookmarks, prefs, notes } = state;
  const book = books.find(b => b.id === currentBookId);

  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [epub, setEpub] = useState<EpubBook | null>(null);
  const [epubChapters, setEpubChapters] = useState<EpubChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPageState] = useState(book?.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(book?.totalPages ?? 1);
  const [rendering, setRendering] = useState(false);
  const [panelTab, setPanelTab] = useState<'chapters' | 'bookmarks' | 'notes'>('chapters');
  const [panelOpen, setPanelOpen] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const epubRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<{ page: number; time: number }>({ page: book?.currentPage ?? 1, time: Date.now() });

  const themeStyle = THEME_STYLES[prefs.theme] ?? THEME_STYLES.jade;
  const bookBookmarks = bookmarks.filter(b => b.bookId === currentBookId);
  const bookNotes = notes.filter(n => n.bookId === currentBookId);

  // Load file
  useEffect(() => {
    if (!book) return;
    setLoading(true);
    setLoadError(null);
    setPageState(book.currentPage || 1);

    async function load() {
      try {
        const { dbGetFile } = await import('../../utils/db');
        const buffer = await dbGetFile(book!.id);
        if (!buffer) throw new Error('Arquivo não encontrado. Reimporte o livro.');

        if (book!.format === 'PDF') {
          const { loadPDF } = await import('../../utils/pdfLoader');
          const pdfDoc = await loadPDF(buffer.slice(0));
          setPdf(pdfDoc);
          setTotalPages(pdfDoc.numPages);
          setLoading(false);
        } else {
          const { loadEpub, getEpubChapters } = await import('../../utils/epubLoader');
          const epubDoc = await loadEpub(buffer.slice(0));
          const chapters = await getEpubChapters(epubDoc);
          setEpub(epubDoc);
          setEpubChapters(chapters);
          setTotalPages(chapters.length || 1);
          setLoading(false);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erro ao carregar o arquivo.');
        setLoading(false);
      }
    }

    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id]);

  // Render PDF page
  useEffect(() => {
    if (!pdf || !canvasRef.current || loading) return;
    setRendering(true);
    import('../../utils/pdfLoader').then(({ renderPage }) => {
      renderPage(pdf, page, canvasRef.current!, 1.5).then(() => setRendering(false));
    });
  }, [pdf, page, loading]);

  // Render EPUB
  useEffect(() => {
    if (!epub || !epubRef.current || loading) return;
      try {
        epub.renderTo(epubRef.current, { width: '100%', height: '100%' });
        const href = epubChapters[page - 1]?.href;
        if (href) (epub as unknown as { display: (h: string) => void }).display(href);
      } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epub, page, loading]);

  const goToPage = useCallback((newPage: number) => {
    if (!book) return;
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPageState(clamped);
    setProgress(book.id, clamped);
  }, [book, totalPages, setProgress]);

  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);
  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
      else if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPage, prevPage]);

  // Touch swipe
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? 0; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(diff) > 50) { if (diff > 0) prevPage(); else nextPage(); }
  };

  const goBack = useCallback(() => {
    // Save session
    if (book && sessionStartRef.current) {
      const { page: startPage, time } = sessionStartRef.current;
      addSession({
        bookId: book.id,
        startPage,
        endPage: page,
        durationMs: Date.now() - time,
        date: new Date().toISOString(),
      });
    }
    navigate('library');
  }, [book, page, addSession, navigate]);

  const handleAddBookmark = useCallback(() => {
    if (!book) return;
    const existing = bookBookmarks.find(b => b.page === page);
    if (existing) {
      deleteBookmark(existing.id);
    } else {
      addBookmark({ bookId: book.id, page, text: `Página ${page}` });
    }
  }, [book, page, bookBookmarks, addBookmark, deleteBookmark]);

  const handleAddNote = useCallback(() => {
    if (!book || !noteText.trim()) return;
    addNote({ bookId: book.id, pageNumber: page, text: noteText.trim(), tag: 'Nova nota', color: '#c8a96e' });
    setNoteText('');
    setShowNoteForm(false);
  }, [book, page, noteText, addNote]);

  const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;
  const isBookmarked = bookBookmarks.some(b => b.page === page);

  if (!book) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d1a14', color: '#f0e8d8', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>📭</div>
        <div>Nenhum livro selecionado</div>
        <button onClick={() => navigate('library')} style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.25)', color: '#c8a96e', cursor: 'pointer', fontSize: 13 }}>
          Ir para a Biblioteca
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary label="Erro no leitor">
      <div
        className="reader-enter"
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          background: themeStyle.bg, color: themeStyle.text, overflow: 'hidden',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Bar */}
        <div style={{
          height: 52, background: `${themeStyle.panel}cc`, backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(200,169,110,0.1)',
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexShrink: 0,
        }}>
          <button onClick={goBack} aria-label="Voltar à biblioteca" style={topBtnStyle}>
            ← Biblioteca
          </button>
          <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {book.title}
            </div>
            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>{book.author}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Font size */}
            <button onClick={() => { if (prefs.fontSize > 12) { const { updatePrefs } = useApp as unknown as { updatePrefs: (p: object) => void }; void updatePrefs; } }} aria-label="Diminuir fonte" style={topBtnStyle}>A-</button>
            <button aria-label="Tamanho da fonte atual" style={{ ...topBtnStyle, minWidth: 28, cursor: 'default', fontSize: 10 }}>{prefs.fontSize}</button>
            <button onClick={() => { if (prefs.fontSize < 28) { const { updatePrefs } = useApp as unknown as { updatePrefs: (p: object) => void }; void updatePrefs; } }} aria-label="Aumentar fonte" style={topBtnStyle}>A+</button>
            {/* Panel toggle */}
            <button onClick={() => setPanelOpen(v => !v)} aria-label="Painel lateral" style={topBtnStyle}>
              {panelOpen ? '⊞' : '☰'}
            </button>
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Reading area */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 80 }}>
                <div className="spinner" style={{ width: 36, height: 36 }} />
                <div style={{ fontSize: 14, opacity: 0.6 }}>Carregando...</div>
              </div>
            )}
            {loadError && (
              <div style={{ textAlign: 'center', padding: 32, maxWidth: 400 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, marginBottom: 8 }}>Erro ao carregar</div>
                <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>{loadError}</div>
                <button onClick={() => navigate('library')} style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.25)', color: '#c8a96e', cursor: 'pointer', fontSize: 13 }}>
                  Reimportar
                </button>
              </div>
            )}

            {/* PDF Canvas */}
            {!loading && !loadError && book.format === 'PDF' && (
              <div style={{ position: 'relative' }}>
                {rendering && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 4, zIndex: 10 }}>
                    <div className="spinner" />
                  </div>
                )}
                <canvas ref={canvasRef} className="pdf-canvas" style={{ maxWidth: '100%' }} />
              </div>
            )}

            {/* EPUB */}
            {!loading && !loadError && book.format === 'EPUB' && (
              <div
                ref={epubRef}
                style={{
                  width: '100%', maxWidth: 720, minHeight: 600,
                  background: themeStyle.bg,
                  fontFamily: FONT_FAMILIES[prefs.fontFamily] ?? FONT_FAMILIES['garamond'],
                  fontSize: prefs.fontSize,
                  lineHeight: prefs.lineHeight,
                  color: themeStyle.text,
                  borderRadius: 8,
                }}
              />
            )}
          </div>

          {/* Side panel */}
          {panelOpen && (
            <div style={{
              width: 280, background: themeStyle.panel,
              borderLeft: '1px solid rgba(200,169,110,0.1)',
              display: 'flex', flexDirection: 'column',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
                {(['chapters', 'bookmarks', 'notes'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPanelTab(tab)}
                    aria-selected={panelTab === tab}
                    style={{
                      flex: 1, padding: '10px 4px', border: 'none', background: 'none',
                      fontSize: 11, cursor: 'pointer', textAlign: 'center',
                      color: panelTab === tab ? 'var(--color-gold)' : 'rgba(240,232,216,0.4)',
                      borderBottom: panelTab === tab ? '2px solid var(--color-gold)' : '2px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab === 'chapters' ? '☰ Caps.' : tab === 'bookmarks' ? '🔖 Marcad.' : '✎ Notas'}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {panelTab === 'chapters' && (
                  <div>
                    {book.format === 'EPUB' && epubChapters.length > 0 ? (
                      epubChapters.map((ch, i) => (
                        <button
                          key={ch.id}
                          onClick={() => goToPage(i + 1)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '8px 10px', marginBottom: 2, borderRadius: 6,
                            background: page === i + 1 ? 'rgba(200,169,110,0.12)' : 'none',
                            border: 'none', cursor: 'pointer', fontSize: 12,
                            color: page === i + 1 ? 'var(--color-gold)' : 'rgba(240,232,216,0.6)',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.08)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = page === i + 1 ? 'rgba(200,169,110,0.12)' : 'none'}
                        >
                          {ch.label}
                        </button>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.4)', padding: '12px 0' }}>
                        {book.format === 'PDF' ? `PDF · ${totalPages} páginas` : 'Sem capítulos'}
                      </div>
                    )}
                  </div>
                )}

                {panelTab === 'bookmarks' && (
                  <div>
                    <button
                      onClick={handleAddBookmark}
                      style={{
                        width: '100%', padding: '8px', marginBottom: 12, borderRadius: 8,
                        background: isBookmarked ? 'rgba(200,169,110,0.2)' : 'rgba(200,169,110,0.08)',
                        border: '1px solid rgba(200,169,110,0.2)', cursor: 'pointer',
                        color: 'var(--color-gold)', fontSize: 12,
                      }}
                    >
                      {isBookmarked ? '🔖 Remover marcador' : '+ Adicionar marcador'}
                    </button>
                    {bookBookmarks.length === 0 && (
                      <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.4)', textAlign: 'center', padding: 12 }}>
                        Nenhum marcador
                      </div>
                    )}
                    {bookBookmarks.sort((a, b) => a.page - b.page).map(bm => (
                      <div
                        key={bm.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 6, marginBottom: 4,
                          background: bm.page === page ? 'rgba(200,169,110,0.12)' : 'none',
                        }}
                      >
                        <button
                          onClick={() => goToPage(bm.page)}
                          style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 12, color: 'rgba(240,232,216,0.7)' }}
                        >
                          🔖 p. {bm.page}
                        </button>
                        <button
                          onClick={() => deleteBookmark(bm.id)}
                          aria-label="Remover marcador"
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 13 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {panelTab === 'notes' && (
                  <div>
                    <button
                      onClick={() => setShowNoteForm(v => !v)}
                      style={{
                        width: '100%', padding: '8px', marginBottom: 12, borderRadius: 8,
                        background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
                        cursor: 'pointer', color: 'var(--color-gold)', fontSize: 12,
                      }}
                    >
                      + Nova nota (p. {page})
                    </button>
                    {showNoteForm && (
                      <div style={{ marginBottom: 12 }}>
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Sua anotação..."
                          autoFocus
                          style={{
                            width: '100%', minHeight: 80, resize: 'vertical',
                            background: 'rgba(200,169,110,0.04)',
                            border: '1px solid rgba(200,169,110,0.2)',
                            borderRadius: 6, padding: '6px 8px',
                            color: 'rgba(240,232,216,0.9)', fontSize: 12,
                            outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button onClick={handleAddNote} style={{ flex: 2, padding: '6px 0', borderRadius: 6, background: 'rgba(46,204,138,0.15)', border: '1px solid rgba(46,204,138,0.3)', color: '#2ecc8a', cursor: 'pointer', fontSize: 11 }}>
                            Salvar
                          </button>
                          <button onClick={() => setShowNoteForm(false)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, background: 'none', border: '1px solid rgba(200,169,110,0.15)', color: 'rgba(240,232,216,0.4)', cursor: 'pointer', fontSize: 11 }}>
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                    {bookNotes.length === 0 && !showNoteForm && (
                      <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.4)', textAlign: 'center', padding: 12 }}>Sem anotações</div>
                    )}
                    {bookNotes.sort((a, b) => a.pageNumber - b.pageNumber).map(n => (
                      <div key={n.id} style={{
                        padding: '8px 10px', borderRadius: 6, marginBottom: 6,
                        background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.1)',
                        fontSize: 12, color: 'rgba(240,232,216,0.7)',
                      }}>
                        <div style={{ color: 'var(--color-gold)', fontSize: 10, marginBottom: 4 }}>p. {n.pageNumber}</div>
                        {n.text.slice(0, 80)}{n.text.length > 80 ? '…' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          height: 56, background: `${themeStyle.panel}cc`, backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(200,169,110,0.1)',
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexShrink: 0,
        }}>
          <button onClick={prevPage} disabled={page <= 1} aria-label="Página anterior" style={{ ...topBtnStyle, opacity: page <= 1 ? 0.3 : 1 }}>
            ←
          </button>

          {/* Progress */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ height: 3, background: 'rgba(200,169,110,0.15)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, var(--color-jade-bright), var(--color-gold))',
                width: `${progress}%`, transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.5 }}>
              <span>Página {page} / {totalPages}</span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Page input */}
          <input
            type="number"
            value={page}
            min={1} max={totalPages}
            onChange={e => goToPage(Number(e.target.value))}
            aria-label="Ir para página"
            style={{
              width: 54, textAlign: 'center',
              background: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: 6, padding: '4px 6px',
              color: 'rgba(240,232,216,0.8)', fontSize: 12, outline: 'none',
            }}
          />

          <button onClick={nextPage} disabled={page >= totalPages} aria-label="Próxima página" style={{ ...topBtnStyle, opacity: page >= totalPages ? 0.3 : 1 }}>
            →
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

const topBtnStyle: React.CSSProperties = {
  background: 'rgba(200,169,110,0.08)',
  border: '1px solid rgba(200,169,110,0.15)',
  borderRadius: 6, padding: '5px 10px',
  color: 'rgba(240,232,216,0.7)',
  cursor: 'pointer', fontSize: 12,
  transition: 'all 0.2s',
  flexShrink: 0,
};
