import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { useApp } from '../../stores/AppContext';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import type { ThemeName } from '../../types';
import type { PDFDoc } from '../../utils/pdfLoader';
import type { EpubBook, EpubChapter } from '../../utils/epubLoader';

type ReaderTheme = {
  bg: string;
  text: string;
  panel: string;
  card: string;
  border: string;
};

type PanelTab = 'chapters' | 'bookmarks' | 'notes';
type ReaderMode = 'canvas' | 'compat';

type EpubRendition = {
  display: (target?: string) => Promise<unknown> | void;
  resize?: (width?: number | string, height?: number | string) => void;
  destroy?: () => void;
};

const THEME_STYLES: Record<ThemeName, ReaderTheme> = {
  jade: {
    bg: '#0d1a14',
    text: '#f0e8d8',
    panel: '#141a16',
    card: '#101712',
    border: 'rgba(200,169,110,0.18)',
  },
  paper: {
    bg: '#f5f0e8',
    text: '#1a1a1a',
    panel: '#ede5d5',
    card: '#fff8ec',
    border: 'rgba(139,105,20,0.24)',
  },
  'dark-paper': {
    bg: '#2a2520',
    text: '#d4c9b0',
    panel: '#221f1a',
    card: '#302920',
    border: 'rgba(200,169,110,0.18)',
  },
  night: {
    bg: '#000000',
    text: '#ffffff',
    panel: '#0a0a0a',
    card: '#050505',
    border: 'rgba(255,255,255,0.12)',
  },
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

function isPasswordError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === 'PDFPasswordError' || /senha|password/i.test(error.message);
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
    getFile,
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
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordNonce, setPasswordNonce] = useState(0);
  const [mode, setMode] = useState<ReaderMode>('canvas');
  const [page, setPageState] = useState(book?.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(book?.totalPages ?? 1);
  const [rendering, setRendering] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>('chapters');
  const [panelOpen, setPanelOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [readerWidth, setReaderWidth] = useState(900);
  const [readerHeight, setReaderHeight] = useState(700);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [orientationKey, setOrientationKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const epubRef = useRef<HTMLDivElement | null>(null);
  const readerAreaRef = useRef<HTMLElement | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const renderIdRef = useRef(0);
  const touchStartX = useRef(0);
  const sessionStartRef = useRef<{ page: number; time: number }>({
    page: book?.currentPage ?? 1,
    time: Date.now(),
  });

  const themeStyle = THEME_STYLES[prefs.theme] ?? THEME_STYLES.jade;
  const bookBookmarks = useMemo(
    () => bookmarks.filter(b => b.bookId === currentBookId),
    [bookmarks, currentBookId],
  );
  const bookNotes = useMemo(
    () => notes.filter(n => n.bookId === currentBookId),
    [notes, currentBookId],
  );

  useEffect(() => {
    setPanelOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const updateSize = () => {
      const rect = readerAreaRef.current?.getBoundingClientRect();
      const width = rect?.width ?? window.innerWidth;
      const height = rect?.height ?? window.innerHeight;

      setReaderWidth(Math.max(280, Math.floor(width)));
      setReaderHeight(Math.max(360, Math.floor(height)));
    };

    updateSize();

    const observer =
      typeof ResizeObserver !== 'undefined' && readerAreaRef.current
        ? new ResizeObserver(updateSize)
        : null;

    if (observer && readerAreaRef.current) {
      observer.observe(readerAreaRef.current);
    }

    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  useEffect(() => {
    const handleOrientation = () => {
      window.setTimeout(() => {
        setOrientationKey(v => v + 1);
        const rect = readerAreaRef.current?.getBoundingClientRect();
        if (rect) {
          setReaderWidth(Math.max(280, Math.floor(rect.width)));
          setReaderHeight(Math.max(360, Math.floor(rect.height)));
        }
      }, 250);
    };

    window.addEventListener('orientationchange', handleOrientation);
    window.addEventListener('resize', handleOrientation);

    return () => {
      window.removeEventListener('orientationchange', handleOrientation);
      window.removeEventListener('resize', handleOrientation);
    };
  }, []);

  useEffect(() => {
    if (!book) return undefined;

    const activeBook = book;
    let cancelled = false;
    let localUrl: string | null = null;

    setLoading(true);
    setLoadError(null);
    setNeedsPassword(false);
    setPdf(null);
    setEpub(null);
    setEpubChapters([]);
    setMode('canvas');
    setPageState(Math.max(1, book.currentPage || 1));
    setTotalPages(Math.max(1, book.totalPages || 1));
    sessionStartRef.current = { page: book.currentPage || 1, time: Date.now() };

    async function loadBook() {
      try {
        const buffer = await getFile(activeBook.id);

        if (!buffer || buffer.byteLength === 0) {
          throw new Error('Arquivo não encontrado no aparelho. Importe o livro novamente uma vez.');
        }

        localUrl = URL.createObjectURL(
          new Blob([buffer.slice(0)], {
            type: activeBook.format === 'PDF' ? 'application/pdf' : 'application/epub+zip',
          }),
        );

        if (!cancelled) {
          setBlobUrl(localUrl);
        }

        if (activeBook.format === 'PDF') {
          const { loadPDF } = await import('../../utils/pdfLoader');

          try {
            const pdfDoc = await loadPDF(buffer.slice(0), password || undefined);
            if (cancelled) return;

            setPdf(pdfDoc);
            setTotalPages(pdfDoc.numPages);
            setLoading(false);
            return;
          } catch (error) {
            if (cancelled) return;

            if (isPasswordError(error) && !password) {
              setNeedsPassword(true);
              setLoading(false);
              setLoadError('Este PDF está protegido por senha.');
              return;
            }

            if (isPasswordError(error) && password) {
              setNeedsPassword(true);
              setLoading(false);
              setLoadError('Senha incorreta. Tente novamente.');
              return;
            }

            setMode('compat');
            setLoading(false);
            setLoadError(
              'Não consegui abrir este PDF no modo avançado. Ativei o modo compatibilidade para tentar exibir o arquivo.',
            );
            return;
          }
        }

        const { loadEpub, getEpubChapters } = await import('../../utils/epubLoader');
        const epubDoc = await loadEpub(buffer.slice(0));
        const chapters = await getEpubChapters(epubDoc).catch(() => []);

        if (cancelled) return;

        setEpub(epubDoc);
        setEpubChapters(chapters);
        setTotalPages(Math.max(chapters.length, activeBook.totalPages || 1, 1));
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        const message = error instanceof Error ? error.message : 'Erro ao carregar o arquivo.';
        setLoadError(message);
        setLoading(false);
      }
    }

    void loadBook();

    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [book?.id, book?.format, getFile, passwordNonce]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || loading || mode !== 'canvas') return;

    let cancelled = false;
    const id = renderIdRef.current + 1;
    renderIdRef.current = id;

    setRendering(true);

    const maxWidth = Math.max(
      260,
      Math.min(readerWidth - (isMobile ? 20 : 72), isMobile ? 920 : 980),
    );

    import('../../utils/pdfLoader')
      .then(({ renderPage }) => {
        if (cancelled || renderIdRef.current !== id || !canvasRef.current) return Promise.resolve();

        return renderPage(pdf, page, canvasRef.current, { maxWidth });
      })
      .catch(() => {
        if (!cancelled && renderIdRef.current === id) {
          setMode('compat');
          setLoadError(
            'Não consegui renderizar esta página no modo avançado. Use o modo compatibilidade.',
          );
        }
      })
      .finally(() => {
        if (!cancelled && renderIdRef.current === id) {
          setRendering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdf, page, loading, readerWidth, readerHeight, isMobile, mode, orientationKey]);

  useEffect(() => {
    if (!epub || !epubRef.current || loading) return undefined;

    epubRef.current.innerHTML = '';

    try {
      const rendition = epub.renderTo(epubRef.current, {
        width: '100%',
        height: '100%',
      }) as unknown as EpubRendition;

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
  }, [epub, loading]);

  useEffect(() => {
    if (!renditionRef.current) return;

    const href = epubChapters[page - 1]?.href;
    renditionRef.current.resize?.('100%', '100%');
    void renditionRef.current.display(href);
  }, [page, epubChapters, readerWidth, readerHeight, orientationKey]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (!book || Number.isNaN(newPage)) return;

      const clamped = Math.max(1, Math.min(newPage, totalPages));
      setPageState(clamped);
      setProgress(book.id, clamped);
    },
    [book, totalPages, setProgress],
  );

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
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextPage();
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') prevPage();
      else if (event.key === 'Escape') {
        if (isMobile && panelOpen) setPanelOpen(false);
        else goBack();
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [nextPage, prevPage, goBack, isMobile, panelOpen]);

  const handleTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const diff = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;

    if (Math.abs(diff) > 70) {
      if (diff > 0) prevPage();
      else nextPage();
    }
  };

  const handleAddBookmark = useCallback(() => {
    if (!book) return;

    const existing = bookBookmarks.find(b => b.page === page);

    if (existing) {
      deleteBookmark(existing.id);
    } else {
      addBookmark({
        bookId: book.id,
        page,
        text: `Página ${page}`,
      });
    }
  }, [book, page, bookBookmarks, addBookmark, deleteBookmark]);

  const handleAddNote = useCallback(() => {
    if (!book || !noteText.trim()) return;

    addNote({
      bookId: book.id,
      pageNumber: page,
      text: noteText.trim(),
      tag: 'Nova nota',
      color: '#c8a96e',
    });

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

  const submitPassword = () => {
    if (!password.trim()) return;

    setNeedsPassword(false);
    setLoadError(null);
    setPasswordNonce(v => v + 1);
  };

  const renderPanel = () => (
    <aside
      className={isMobile ? 'reader-side-panel mobile-sheet' : 'reader-side-panel'}
      style={{ background: `${themeStyle.panel}f2`, borderColor: themeStyle.border }}
      role="complementary"
      aria-label="Painel do leitor"
    >
      <div className="reader-panel-header">
        {(['chapters', 'bookmarks', 'notes'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setPanelTab(tab)}
            aria-selected={panelTab === tab}
            className={panelTab === tab ? 'reader-panel-tab active' : 'reader-panel-tab'}
          >
            {tab === 'chapters' ? '☰ Caps.' : tab === 'bookmarks' ? '🔖 Marcad.' : '✎ Notas'}
          </button>
        ))}

        {isMobile && (
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Fechar painel"
            className="reader-panel-close"
          >
            ×
          </button>
        )}
      </div>

      {panelTab === 'chapters' && (
        <div className="reader-panel-list">
          {book?.format === 'EPUB' && epubChapters.length > 0 ? (
            epubChapters.map((chapter, index) => (
              <button
                type="button"
                key={chapter.id}
                onClick={() => {
                  goToPage(index + 1);
                  if (isMobile) setPanelOpen(false);
                }}
                className={page === index + 1 ? 'reader-list-button active' : 'reader-list-button'}
              >
                {chapter.label}
              </button>
            ))
          ) : (
            <div className="reader-empty-small">
              {book?.format === 'PDF' ? `PDF · ${totalPages} páginas` : 'Sem capítulos'}
            </div>
          )}

          {book?.format === 'PDF' && blobUrl && (
            <button
              type="button"
              onClick={() => setMode(mode === 'compat' ? 'canvas' : 'compat')}
              className="reader-action-button"
            >
              {mode === 'compat' ? 'Usar modo avançado' : 'Abrir em modo compatibilidade'}
            </button>
          )}
        </div>
      )}

      {panelTab === 'bookmarks' && (
        <div className="reader-panel-list">
          <button type="button" onClick={handleAddBookmark} className="reader-action-button">
            {isBookmarked ? 'Remover marcador' : '+ Adicionar marcador'}
          </button>

          {bookBookmarks.length === 0 && <div className="reader-empty-small">Nenhum marcador</div>}

          {bookBookmarks
            .slice()
            .sort((a, b) => a.page - b.page)
            .map(bookmark => (
              <div key={bookmark.id} className="reader-bookmark-row">
                <button
                  type="button"
                  onClick={() => {
                    goToPage(bookmark.page);
                    if (isMobile) setPanelOpen(false);
                  }}
                >
                  p. {bookmark.page}
                </button>

                <button
                  type="button"
                  onClick={() => deleteBookmark(bookmark.id)}
                  aria-label="Remover marcador"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}

      {panelTab === 'notes' && (
        <div className="reader-panel-list">
          <button
            type="button"
            onClick={() => setShowNoteForm(value => !value)}
            className="reader-action-button"
          >
            + Nova nota (p. {page})
          </button>

          {showNoteForm && (
            <div className="reader-note-form">
              <textarea
                value={noteText}
                onChange={event => setNoteText(event.target.value)}
                placeholder="Sua anotação..."
                autoFocus
              />

              <div>
                <button type="button" onClick={handleAddNote}>
                  Salvar
                </button>
                <button type="button" onClick={() => setShowNoteForm(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {bookNotes.length === 0 && !showNoteForm && (
            <div className="reader-empty-small">Sem anotações</div>
          )}

          {bookNotes
            .slice()
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map(note => (
              <div key={note.id} className="reader-note-card">
                <div>p. {note.pageNumber}</div>
                {note.text.slice(0, 120)}
                {note.text.length > 120 ? '…' : ''}
              </div>
            ))}
        </div>
      )}
    </aside>
  );

  if (!book) {
    return (
      <div className="reader-empty-state">
        <div style={{ fontSize: 48 }}>📚</div>
        <div>Nenhum livro selecionado</div>
        <button type="button" onClick={() => navigate('library')}>
          Ir para a Biblioteca
        </button>
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
        <header
          className="reader-topbar"
          style={{ background: `${themeStyle.panel}ee`, borderColor: themeStyle.border }}
        >
          <button type="button" onClick={goBack} aria-label="Voltar à biblioteca" className="reader-top-button">
            ← <span>Biblioteca</span>
          </button>

          <div className="reader-title-block">
            <div>{book.title}</div>
            <span>{book.author}</span>
          </div>

          <div className="reader-top-actions">
            <button type="button" onClick={decreaseFont} aria-label="Diminuir fonte" className="reader-top-button">
              A-
            </button>
            <button type="button" aria-label="Tamanho da fonte atual" className="reader-font-chip">
              {prefs.fontSize}
            </button>
            <button type="button" onClick={increaseFont} aria-label="Aumentar fonte" className="reader-top-button">
              A+
            </button>
            <button type="button" onClick={cycleTheme} aria-label="Trocar tema" className="reader-top-button">
              Tema
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(value => !value)}
              aria-label="Painel lateral"
              className="reader-top-button"
            >
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

            {!loading && loadError && !needsPassword && mode !== 'compat' && (
              <div className="reader-error-card">
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>
                  Erro ao carregar o livro
                </div>
                <p>{loadError}</p>

                {blobUrl && book.format === 'PDF' && (
                  <button type="button" onClick={() => setMode('compat')}>
                    Abrir em modo compatibilidade
                  </button>
                )}

                <button type="button" onClick={() => navigate('library')}>
                  Voltar para biblioteca
                </button>
              </div>
            )}

            {!loading && needsPassword && (
              <div className="reader-error-card">
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>
                  PDF protegido por senha
                </div>
                <p>{loadError ?? 'Digite a senha para abrir este PDF.'}</p>

                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Senha do PDF"
                  className="reader-page-input"
                  style={{ width: '100%', maxWidth: 260, marginBottom: 12 }}
                />

                <button type="button" onClick={submitPassword}>
                  Abrir PDF
                </button>
              </div>
            )}

            {!loading && !needsPassword && book.format === 'PDF' && mode === 'canvas' && (
              <div
                className="reader-page-frame"
                style={{ background: themeStyle.card, borderColor: themeStyle.border }}
              >
                {rendering && (
                  <div className="reader-rendering">
                    <div className="spinner" />
                  </div>
                )}

                <canvas ref={canvasRef} className="pdf-canvas reader-pdf-canvas" />
              </div>
            )}

            {!loading && !needsPassword && book.format === 'PDF' && mode === 'compat' && blobUrl && (
              <div
                className="reader-page-frame reader-compat-frame"
                style={{ background: themeStyle.card, borderColor: themeStyle.border }}
              >
                {loadError && (
                  <div className="reader-compat-warning">
                    {loadError}
                  </div>
                )}

                <object data={blobUrl} type="application/pdf" className="reader-compat-object">
                  <iframe title={book.title} src={blobUrl} className="reader-compat-object" />
                </object>
              </div>
            )}

            {!loading && !loadError && book.format === 'EPUB' && (
              <div
                className="reader-page-frame reader-epub-frame"
                style={{ background: themeStyle.card, borderColor: themeStyle.border }}
              >
                <div
                  ref={epubRef}
                  style={{
                    width: '100%',
                    minHeight: isMobile ? '66dvh' : 640,
                    height: isMobile ? '66dvh' : '70vh',
                    fontFamily: FONT_FAMILIES[prefs.fontFamily] ?? FONT_FAMILIES.garamond,
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
              <button
                type="button"
                className="reader-panel-backdrop"
                aria-label="Fechar painel"
                onClick={() => setPanelOpen(false)}
              />
              {renderPanel()}
            </>
          )}
        </div>

        <footer
          className="reader-bottombar"
          style={{ background: `${themeStyle.panel}f2`, borderColor: themeStyle.border }}
        >
          <button
            type="button"
            onClick={prevPage}
            disabled={page <= 1 || mode === 'compat'}
            aria-label="Página anterior"
            className="reader-bottom-button"
          >
            ←
          </button>

          <div className="reader-progress-wrap">
            <div className="reader-progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>

            <div className="reader-progress-labels">
              <span>
                {mode === 'compat' ? 'Modo compatibilidade' : `Página ${page} / ${totalPages}`}
              </span>
              <span>{mode === 'compat' ? 'PDF nativo' : `${progress}%`}</span>
            </div>
          </div>

          {mode === 'canvas' && (
            <input
              type="number"
              value={page}
              min={1}
              max={totalPages}
              onChange={event => goToPage(Number(event.target.value))}
              aria-label="Ir para página"
              className="reader-page-input"
            />
          )}

          {book.format === 'PDF' && blobUrl && (
            <button
              type="button"
              onClick={() => setMode(mode === 'compat' ? 'canvas' : 'compat')}
              aria-label="Alternar modo de leitura"
              className="reader-bottom-button"
            >
              {mode === 'compat' ? 'PDF.js' : 'Compat.'}
            </button>
          )}

          <button
            type="button"
            onClick={nextPage}
            disabled={page >= totalPages || mode === 'compat'}
            aria-label="Próxima página"
            className="reader-bottom-button"
          >
            →
          </button>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
