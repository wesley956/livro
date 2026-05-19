import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

interface EpubReaderProps {
  fileUrl: string;
  bookId: string;
  theme?: 'light' | 'dark' | 'sepia' | 'jade' | string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  readerWidth?: number;
  pageMargin?: number;
  annotations?: unknown[];
  initialCfi?: string;
  onTextSelected?: (text: string, x: number, y: number, cfi: string) => void;
  onPageChange?: (cfi: string, progress: number) => void;
  onHighlight?: (text: string, cfi: string) => void;
}

export interface EpubReaderHandle {
  previousPage: () => void;
  nextPage: () => void;
  prev: () => void;
  next: () => void;
  goToCfi: (cfi: string) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  addHighlight: (cfi: string, color?: string) => void;
}

type RenditionLike = {
  display: (target?: string) => Promise<unknown> | void;
  next: () => Promise<unknown> | void;
  prev: () => Promise<unknown> | void;
  resize?: (width?: number | string, height?: number | string) => void;
  destroy?: () => void;
  on?: (event: string, callback: (payload: unknown) => void) => void;
  themes?: {
    register?: (name: string, rules: Record<string, Record<string, string>>) => void;
    select?: (name: string) => void;
    fontSize?: (value: string) => void;
    override?: (property: string, value: string) => void;
  };
  annotations?: {
    highlight?: (
      cfiRange: string,
      data?: unknown,
      callback?: unknown,
      className?: string,
      styles?: Record<string, string>,
    ) => void;
  };
};

type EpubBookLike = {
  ready?: Promise<unknown>;
  renderTo: (element: HTMLElement, options: Record<string, unknown>) => RenditionLike;
  locations?: {
    generate?: (chars?: number) => Promise<unknown>;
    percentageFromCfi?: (cfi: string) => number;
  };
  destroy?: () => void;
};

type RelocatedPayload = {
  start?: {
    cfi?: string;
  };
};

function getThemeName(theme?: string) {
  if (theme === 'light' || theme === 'sepia' || theme === 'jade') return theme;
  return 'dark';
}

function getSavedCfi(bookId: string, fallback?: string) {
  try {
    return localStorage.getItem(`lume-epub-cfi:${bookId}`) || fallback || undefined;
  } catch {
    return fallback;
  }
}

function saveEpubPosition(bookId: string, cfi: string, progress: number) {
  try {
    localStorage.setItem(`lume-epub-cfi:${bookId}`, cfi);
    localStorage.setItem(
      `lume-epub-progress:${bookId}`,
      JSON.stringify({
        cfi,
        progress,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Não quebrar leitura se localStorage falhar.
  }
}

async function waitWithTimeout<T>(promise: Promise<T> | void, ms: number): Promise<T | undefined> {
  if (!promise) return undefined;

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const EpubReader = forwardRef<EpubReaderHandle, EpubReaderProps>(function EpubReader(
  {
    fileUrl,
    bookId,
    theme = 'dark',
    fontSize = 20,
    fontFamily = 'Georgia, serif',
    lineHeight = 1.78,
    readerWidth = 780,
    pageMargin = 30,
    initialCfi,
    onTextSelected,
    onPageChange,
    onHighlight: _onHighlight,
    annotations: _annotations = [],
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renditionRef = useRef<RenditionLike | null>(null);
  const bookRef = useRef<EpubBookLike | null>(null);
  const currentCfiRef = useRef('');
  const onPageChangeRef = useRef(onPageChange);

  const [loading, setLoading] = useState(true);
  const [softMessage, setSoftMessage] = useState('Preparando EPUB...');
  const [error, setError] = useState<string | null>(null);

  const readerTheme = getThemeName(theme);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const applyTheme = useCallback((rendition: RenditionLike | null = renditionRef.current) => {
    if (!rendition?.themes) return;

    const baseBody = {
      margin: '0 auto',
      padding: `${pageMargin}px 24px 92px`,
      'max-width': `${readerWidth}px`,
      'box-sizing': 'border-box',
      'font-family': fontFamily,
      'font-size': `${fontSize}px`,
      'line-height': String(lineHeight),
      'word-break': 'normal',
      'overflow-wrap': 'break-word',
    };

    const baseRules = {
      p: {
        'margin-top': '0',
        'margin-bottom': '1.05em',
        'text-align': 'left',
      },
      img: {
        'max-width': '100%',
        height: 'auto',
        display: 'block',
        margin: '18px auto',
      },
      a: {
        color: '#c9a96e',
      },
    };

    rendition.themes.register?.('lume-dark', {
      ...baseRules,
      body: {
        ...baseBody,
        background: '#11130f',
        color: '#e9dfc8',
      },
    });

    rendition.themes.register?.('lume-sepia', {
      ...baseRules,
      body: {
        ...baseBody,
        background: '#241d13',
        color: '#d6c8a8',
      },
    });

    rendition.themes.register?.('lume-light', {
      ...baseRules,
      body: {
        ...baseBody,
        background: '#fff8ec',
        color: '#1d1a16',
      },
    });

    rendition.themes.register?.('lume-jade', {
      ...baseRules,
      body: {
        ...baseBody,
        background: '#0d1a14',
        color: '#e9f2e8',
      },
      a: {
        color: '#7bd6a3',
      },
    });

    rendition.themes.select?.(`lume-${readerTheme}`);
    rendition.themes.fontSize?.(`${fontSize}px`);
    rendition.themes.override?.('font-size', `${fontSize}px`);
    rendition.themes.override?.('line-height', String(lineHeight));
  }, [fontFamily, fontSize, lineHeight, pageMargin, readerTheme, readerWidth]);

  useEffect(() => {
    let cancelled = false;

    async function openEpub() {
      try {
        setLoading(true);
        setError(null);
        setSoftMessage('Lendo arquivo EPUB...');

        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();

        if (!buffer || buffer.byteLength < 4) {
          throw new Error('EPUB vazio ou incompleto.');
        }

        const epubModule = await import('epubjs');
        const ePubFactory = (epubModule.default || epubModule) as unknown as (
          input: ArrayBuffer,
        ) => EpubBookLike;

        const book = ePubFactory(buffer.slice(0));
        bookRef.current = book;

        await waitWithTimeout(book.ready, 1800);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = '';

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'scrolled-doc',
          spread: 'none',
          manager: 'default',
          allowScriptedContent: false,
        });

        renditionRef.current = rendition;
        applyTheme(rendition);

        rendition.on?.('relocated', payload => {
          const location = payload as RelocatedPayload;
          const cfi = location.start?.cfi || '';

          if (!cfi) return;

          currentCfiRef.current = cfi;

          let progress = 0;

          try {
            progress = book.locations?.percentageFromCfi
              ? Math.round(book.locations.percentageFromCfi(cfi) * 100)
              : 0;
          } catch {
            progress = 0;
          }

          saveEpubPosition(bookId, cfi, progress);
          onPageChangeRef.current?.(cfi, progress);
        });

        void waitWithTimeout(book.locations?.generate?.(1000), 2500);

        const target = getSavedCfi(bookId, initialCfi);

        setSoftMessage('Abrindo livro...');
        setLoading(false);

        try {
          await waitWithTimeout(Promise.resolve(rendition.display(target)), 3000);
        } catch {
          await waitWithTimeout(Promise.resolve(rendition.display()), 1800);
        }

        window.setTimeout(() => {
          rendition.resize?.('100%', '100%');
        }, 250);
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : 'Não foi possível abrir este EPUB.';

        if (!cancelled) {
          setError(message);
          setLoading(false);
        }
      }
    }

    void openEpub();

    return () => {
      cancelled = true;
      renditionRef.current?.destroy?.();
      bookRef.current?.destroy?.();
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [applyTheme, bookId, fileUrl, initialCfi]);

  useEffect(() => {
    applyTheme();
    window.setTimeout(() => {
      renditionRef.current?.resize?.('100%', '100%');
    }, 100);
  }, [applyTheme]);

  useEffect(() => {
    const handleResize = () => {
      window.setTimeout(() => {
        renditionRef.current?.resize?.('100%', '100%');
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const previousPage = useCallback(() => {
    void renditionRef.current?.prev();
  }, []);

  const nextPage = useCallback(() => {
    void renditionRef.current?.next();
  }, []);

  const goToCfi = useCallback((cfi: string) => {
    currentCfiRef.current = cfi;
    void renditionRef.current?.display(cfi);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      previousPage,
      nextPage,
      prev: previousPage,
      next: nextPage,
      goToCfi,
      increaseFont: () => {},
      decreaseFont: () => {},
      addHighlight: (cfi: string, color = '#c9a96e') => {
        try {
          renditionRef.current?.annotations?.highlight?.(
            cfi,
            {},
            undefined,
            'lume-epub-highlight',
            {
              fill: color,
              'fill-opacity': '0.35',
              'mix-blend-mode': 'multiply',
            },
          );
        } catch {
          // Não quebrar leitura.
        }
      },
    }),
    [goToCfi, nextPage, previousPage],
  );

  const handleSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();

    if (!selected) return;

    const rect = selection?.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    onTextSelected?.(selected, rect?.left ?? 0, rect?.top ?? 0, currentCfiRef.current);
  };

  return (
    <div className="lume-epub-stable-shell" data-reader-theme={readerTheme}>
      <div
        ref={containerRef}
        className="lume-epub-stable-frame"
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      />

      {loading && (
        <div className="lume-epub-stable-overlay">
          <div className="lume-r4-loading">
            <div className="spinner" />
            <strong>Carregando EPUB...</strong>
            <span>{softMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="lume-epub-stable-overlay">
          <div className="lume-r4-error">
            <strong>Não foi possível abrir este EPUB</strong>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
});
