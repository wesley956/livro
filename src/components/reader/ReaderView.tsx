import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties, TouchEvent } from 'react';
import { useApp } from '../../stores/AppContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import type { ThemeName } from '../../types';
import type { PDFDoc } from '../../utils/pdfLoader';
import type { EpubBook, EpubChapter } from '../../utils/epubLoader';

type ReaderTheme = { bg: string; text: string; panel: string; card: string; border: string };
type PanelTab = 'chapters' | 'bookmarks' | 'notes';
type EpubRendition = { display: (target?: string) => Promise<unknown> | void; destroy?: () => void };

const THEME_STYLES: Record<ThemeName, ReaderTheme> = {
  jade: { bg: '#0d1a14', text: '#f0e8d8', panel: '#141a16', card: '#101712', border: 'rgba(200,169,110,0.18)' },
  paper: { bg: '#f5f0e8', text: '#1a1a1a', panel: '#ede5d5', card: '#fff8ec', border: 'rgba(139,105,20,0.24)' },
  'dark-paper': { bg: '#2a2520', text: '#d4c9b0', panel: '#221f1a', card: '#302920', border: 'rgba(200,169,110,0.18)' },
  night: { bg: '#000000', text: '#ffffff', panel: '#0a0a0a', card: '#050505', border: 'rgba(255,255,255,0.12)' },
};

const FONT_FAMILIES: Record<string, string> = {
  garamond: "'Cormorant Garamond', Georgia, serif",
  inter: "'Inter', sans-serif",
  noto: "'Noto Serif SC', serif",
};

const THEMES: ThemeName[] = ['jade', 'paper', 'dark-paper', 'night'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function ReaderView() {
  const {
    navigate,
    setProgress,
    addBookmark,
    deleteBookmark,
    addSession,
    addNote,
    updatePrefs,
    state,
  } = useApp();
  const { currentBookId, books, bookmarks, prefs, notes } = state;
  const book = books.find(b => b.id === currentBookId);
  const isMobile = useIsMobile();

  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [epub, setEpub] = useState<EpubBook | null>(null);
  const [epubChapters, setEpubChapters] = useState<EpubChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPageState] = useState(book?.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(book?.totalPages ?? 1);
  const [rendering, setRendering] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('chapters');
  const [panelOpen, setPanelOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [readerWidth, setReaderWidth] = useState(900);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const epubRef = useRef<HTMLDivElement>(null);
  const readerAreaRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const sessionStartRef = useRef<{ page: number; time: number }>({ page: book?.currentPage ?? 1, time: Date.now() });
  const touchStartX = useRef(0);

  const themeStyle = THEME_STYLES[prefs.theme] ?? THEME_STYLES.jade;
  const bookBookmarks = bookmarks.filter(b => b.bookId === currentBookId);
  const bookNotes = notes.filter(n => n.bookId === currentBookId);

  useEffect(() => {
    setPanelOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const updateWidth = () => {
      const width = readerAreaRef.current?.clientWidth ?? window.innerWidth;
      setReaderWidth(width);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = typeof ResizeObserver !== 'undefined' && readerAreaRef.current
      ? new ResizeObserver(updateWidth)
      : null;
    if (observer && readerAreaRef.current) observer.observe(readerAreaRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!book) return;
    setLoading(true);
    setLoadError(null);
    setPdf(null);
    setEpub(null);
    setEpubChapters([]);
    setPageState(book.currentPage || 1);
    sessionStartRef.current = { page: book.currentPage || 1, time: Date.now() };

    async function load() {
      try {
        const { dbGetFile } = await import('../../utils/db');
        const buffer = await dbGetFile(book!.id);
        if (!buffer) throw new Error('Arquivo não encontrado no aparelho. Importe o livro novamente uma vez.');

        if (book!.format === 'PDF') {
          const { loadPDF } = await import('../../utils/pdfLoader');
          const pdfDoc = await loadPDF(buffer);
          setPdf(pdfDoc);
          setTotalPages(pdfDoc.numPages);
        } else {
          const { loadEpub, getEpubChapters } = await import('../../utils/epubLoader');
          const epubDoc = await loadEpub(buffer.slice(0));
          const chapters = await getEpubChapters(epubDoc);
          setEpub(epubDoc);
          setEpubChapters(chapters);
          setTotalPages(Math.max(chapters.length, 1));
        }
        setLoading(false);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erro ao carregar o arquivo.';
        setLoadError(`${message} Se esse PDF foi importado antes desta correção, remova e importe novamente.`);
        setLoading(false);
      }
    }

    void load();
  }, [book?.id, book?.currentPage, book?.format]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || loading) return;
    let cancelled = false;
    setRendering(true);
    const maxWidth = Math.max(260, Math.min(readerWidth - (isMobile ? 24 : 56), isMobile ? 720 : 920));

    import('../../utils/pdfLoader')
      .then(({ renderPage }) => renderPage(pdf, page, canvasRef.current!, { maxWidth }))
      .catch(() => {
        if (!cancelled) setLoadError('Não consegui renderizar esta página do PDF. Tente reimportar o arquivo.');
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => { cancelled = true; };
  }, [pdf, page, loading, readerWidth, isMobile]);

  useEffect(() => {
    if (!epub || !epubRef.current || loading) return;
    epubRef.current.innerHTML = '';
    try {
      const rendition = epub.renderTo(epubRef.current, { width: '100%', height: '100%' }) as unknown as EpubRendition;
      renditionRef.current = rendition;
      const href = epubChapters[page - 1]?.href;
      void rendition.display(href);
    } catch {
      setLoadError('Não consegui abrir este EPUB. Tente importar o arquivo novamente.');
    }

    return () => {
      renditionRef.current?.destroy?.();
      renditionRef.current = null;
    };
  }, [epub, epubChapters, loading]);

  useEffect(() => {
    if (!renditionRef.current || !epubChapters.length) return;
    const href = epubChapters[page - 1]?.href;
    void renditionRef.current.display(href);
  }, [page, epubChapters]);

  const goToPage = useCallback((newPage: number) => {
    if (!book || Number.isNaN(newPage)) return;
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setPageState(clamped);
    setProgress(book.id, clamped);
  }, [book, totalPages, setProgress]);

  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);
  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);

  const goBack = useCallback(() => {
    if (book && sessionStartRef.current) {
      const { page: startPage, time } = sessionStartRef.current;
      addSession({
        bookId: book.id,
        startPage,
        endPage: page,
        durationMs: Math.max(1000, Date.now() - time),
        date: new Date().toISOString(),
      });
    }
    navigate('library');
  }, [book, page, addSession, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
      else if (e.key === 'Escape') {
        if (isMobile && panelOpen) setPanelOpen(false);
        else goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextPage, prevPage, goBack, isMobile, panelOpen]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) prevPage();
      else nextPage();
    }
  };

  const handleAddBookmark = useCallback(() => {
    if (!book) return;
    const existing = bookBookmarks.find(b => b.page === page);
    if (existing) deleteBookmark(existing.id);
    else addBookmark({ bookId: book.id, page, text: `Página ${page}` });
  }, [book, page, bookBookmarks, addBookmark, deleteBookmark]);

  const handleAddNote = useCallback(() => {
    if (!book || !noteText.trim()) return;
    addNote({ bookId: book.id, pageNumber: page, text: noteText.trim(), tag: 'Nova nota', color: '#c8a96e' });
    setNoteText('');
    setShowNoteForm(false);
  }, [book, page, noteText, addNote]);

  const increaseFont = () => updatePrefs({ fontSize: Math.min(30, prefs.fontSize + 1) });
  const decreaseFont = () => updatePrefs({ fontSize: Math.max(12, prefs.fontSize - 1) });
  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(prefs.theme);
    updatePrefs({ theme: THEMES[(currentIndex + 1) % THEMES.length] ?? 'jade' });
  };

  const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0;
  const isBookmarked = bookBookmarks.some(b => b.page === page);

  const renderPanel = () => (
    <aside className={isMobile ? 'reader-mobile-panel' : 'reader-side-panel'} style={{ background: themeStyle.panel, borderColor: themeStyle.border }}>
      <div className="reader-panel-tabs">
        {(['chapters', 'bookmarks', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setPanelTab(tab)}
            aria-selected={panelTab === tab}
            className={panelTab === tab ? 'reader-panel-tab active' : 'reader-panel-tab'}
          >
            {tab === 'chapters' ? '☰ Caps.' : tab === 'bookmarks' ? '🔖 Marcad.' : '✎ Notas'}
          </button>
        ))}
        {isMobile && (
          <button className="reader-panel-close" onClick={() => setPanelOpen(false)} aria-label="Fechar painel">×</button>
        )}
      </div>

      <div className="reader-panel-content">
        {panelTab === 'chapters' && (
          <div>
            {book?.format === 'EPUB' && epubChapters.length > 0 ? (
              epubChapters.map((ch, i) => (
                <button key={ch.id} onClick={() => { goToPage(i + 1); if (isMobile) setPanelOpen(false); }} className={page === i + 1 ? 'reader-list-button active' : 'reader-list-button'}>
                  {ch.label}
                </button>
              ))
            ) : (
              <div className="reader-empty-small">{book?.format === 'PDF' ? `PDF · ${totalPages} páginas` : 'Sem capítulos'}</div>
            )}
          </div>
        )}

        {panelTab === 'bookmarks' && (
          <div>
            <button onClick={handleAddBookmark} className="reader-action-button">
              {isBookmarked ? '🔖 Remover marcador' : '+ Adicionar marcador'}
            </button>
            {bookBookmarks.length === 0 && <div className="reader-empty-small">Nenhum marcador</div>}
            {bookBookmarks.slice().sort((a, b) => a.page - b.page).map(bm => (
              <div key={bm.id} className="reader-bookmark-row">
                <button onClick={() => { goToPage(bm.page); if (isMobile) setPanelOpen(false); }}>
                  p. {bm.page}
                </button>
                <button onClick={() => deleteBookmark(bm.id)} aria-label="Remover marcador">×</button>
              </div>
            ))}
          </div>
        )}

        {panelTab === 'notes' && (
          <div>
            <button onClick={() => setShowNoteForm(v => !v)} className="reader-action-button">
              + Nova nota (p. {page})
            </button>
            {showNoteForm && (
              <div className="reader-note-form">
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Sua anotação..." autoFocus />
                <div>
                  <button onClick={handleAddNote}>Salvar</button>
                  <button onClick={() => setShowNoteForm(false)}>Cancelar</button>
                </div>
              </div>
            )}
            {bookNotes.length === 0 && !showNoteForm && <div className="reader-empty-small">Sem anotações</div>}
            {bookNotes.slice().sort((a, b) => a.pageNumber - b.pageNumber).map(n => (
              <div key={n.id} className="reader-note-card">
                <div>p. {n.pageNumber}</div>
                {n.text.slice(0, 120)}{n.text.length > 120 ? '…' : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  if (!book) {
    return (
      <div className="reader-empty-state">
        <div style={{ fontSize: 48 }}>📭</div>
        <div>Nenhum livro selecionado</div>
        <button onClick={() => navigate('library')}>Ir para a Biblioteca</button>
      </div>
    );
  }

  return (
    <ErrorBoundary label="Erro no leitor">
      <div
        className="reader-enter reader-shell"
        style={{ background: themeStyle.bg, color: themeStyle.text }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <header className="reader-topbar" style={{ background: `${themeStyle.panel}ee`, borderColor: themeStyle.border }}>
          <button onClick={goBack} aria-label="Voltar à biblioteca" className="reader-top-button">
            ← <span>Biblioteca</span>
          </button>

          <div className="reader-title-block">
            <div>{book.title}</div>
            <span>{book.author}</span>
          </div>

          <div className="reader-top-actions">
            <button onClick={decreaseFont} aria-label="Diminuir fonte" className="reader-top-button">A-</button>
            <button aria-label="Tamanho da fonte atual" className="reader-font-chip">{prefs.fontSize}</button>
            <button onClick={increaseFont} aria-label="Aumentar fonte" className="reader-top-button">A+</button>
            <button onClick={cycleTheme} aria-label="Trocar tema" className="reader-top-button">Tema</button>
            <button onClick={() => setPanelOpen(v => !v)} aria-label="Painel lateral" className="reader-top-button">
              {panelOpen ? '×' : '☰'}
            </button>
          </div>
        </header>

        <div className="reader-main">
          <section ref={readerAreaRef} className="reader-area">
            <div className="reader-ornament reader-ornament-left" />
            <div className="reader-ornament reader-ornament-right" />

            {loading && (
              <div className="reader-loading">
                <div className="spinner" style={{ width: 36, height: 36 }} />
                <div>Carregando livro...</div>
              </div>
            )}

            {loadError && (
              <div className="reader-error-card">
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>Erro ao carregar o livro</div>
                <p>{loadError}</p>
                <button onClick={() => navigate('library')}>Voltar para biblioteca</button>
              </div>
            )}

            {!loading && !loadError && book.format === 'PDF' && (
              <div className="reader-page-frame" style={{ background: themeStyle.card, borderColor: themeStyle.border }}>
                {rendering && <div className="reader-rendering"><div className="spinner" /></div>}
                <canvas ref={canvasRef} className="pdf-canvas reader-pdf-canvas" />
              </div>
            )}

            {!loading && !loadError && book.format === 'EPUB' && (
              <div className="reader-page-frame reader-epub-frame" style={{ background: themeStyle.card, borderColor: themeStyle.border }}>
                <div
                  ref={epubRef}
                  style={{
                    width: '100%',
                    minHeight: isMobile ? '66dvh' : 640,
                    fontFamily: FONT_FAMILIES[prefs.fontFamily] ?? FONT_FAMILIES['garamond'],
                    fontSize: prefs.fontSize,
                    lineHeight: prefs.lineHeight,
                    color: themeStyle.text,
                  }}
                />
              </div>
            )}
          </section>

          {!isMobile && panelOpen && renderPanel()}
          {isMobile && panelOpen && (
            <>
              <button className="reader-panel-backdrop" aria-label="Fechar painel" onClick={() => setPanelOpen(false)} />
              {renderPanel()}
            </>
          )}
        </div>

        <footer className="reader-bottombar" style={{ background: `${themeStyle.panel}f2`, borderColor: themeStyle.border }}>
          <button onClick={prevPage} disabled={page <= 1} aria-label="Página anterior" className="reader-bottom-button">←</button>
          <div className="reader-progress-wrap">
            <div className="reader-progress-track"><div style={{ width: `${progress}%` }} /></div>
            <div className="reader-progress-labels"><span>Página {page} / {totalPages}</span><span>{progress}%</span></div>
          </div>
          <input
            type="number"
            value={page}
            min={1}
            max={totalPages}
            onChange={e => goToPage(Number(e.target.value))}
            aria-label="Ir para página"
            className="reader-page-input"
          />
          <button onClick={nextPage} disabled={page >= totalPages} aria-label="Próxima página" className="reader-bottom-button">→</button>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export const topBtnStyle: CSSProperties = {
  background: 'rgba(200,169,110,0.08)',
  border: '1px solid rgba(200,169,110,0.15)',
  borderRadius: 6,
  padding: '5px 10px',
  color: 'rgba(240,232,216,0.7)',
  cursor: 'pointer',
  fontSize: 12,
  transition: 'all 0.2s',
  flexShrink: 0,
};
