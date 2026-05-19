import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type JSZipType from 'jszip';

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

type ManifestItem = {
  id: string;
  href: string;
  mediaType: string;
  fullPath: string;
};

function getThemeName(theme?: string) {
  if (theme === 'light' || theme === 'sepia' || theme === 'jade') return theme;
  return 'dark';
}

function normalizePath(path: string) {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

function dirname(path: string) {
  const clean = normalizePath(path);
  const parts = clean.split('/');
  parts.pop();
  return parts.join('/');
}

function joinPath(baseDir: string, relative: string) {
  if (!relative) return normalizePath(baseDir);

  if (
    relative.startsWith('data:') ||
    relative.startsWith('blob:') ||
    relative.startsWith('http://') ||
    relative.startsWith('https://')
  ) {
    return relative;
  }

  const noFragment = relative.split('#')[0].split('?')[0];
  const combined = baseDir ? `${baseDir}/${noFragment}` : noFragment;
  const parts: string[] = [];

  for (const part of combined.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }

  return parts.join('/');
}

function getZipFile(zip: JSZipType, path: string) {
  const clean = normalizePath(path);

  const exact = zip.file(clean);
  if (exact) return exact;

  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }

  const decodedExact = zip.file(decoded);
  if (decodedExact) return decodedExact;

  const lower = decoded.toLowerCase();
  const found = Object.keys(zip.files).find(name => normalizePath(name).toLowerCase() === lower);

  return found ? zip.file(found) : null;
}

function getMimeType(path: string) {
  const lower = path.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.woff')) return 'font/woff';
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.ttf')) return 'font/ttf';
  if (lower.endsWith('.otf')) return 'font/otf';

  return 'application/octet-stream';
}

function getElements(doc: Document, name: string) {
  const normal = Array.from(doc.getElementsByTagName(name));
  const namespaced = Array.from(doc.getElementsByTagNameNS('*', name));

  return [...normal, ...namespaced].filter((item, index, array) => array.indexOf(item) === index);
}

function stripDangerous(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

function serializeChildren(element: Element) {
  const serializer = new XMLSerializer();

  return Array.from(element.childNodes)
    .map(node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
      return serializer.serializeToString(node);
    })
    .join('');
}

function extractBodyHtml(raw: string) {
  try {
    const xml = new DOMParser().parseFromString(raw, 'application/xhtml+xml');
    const body =
      getElements(xml, 'body')[0] ||
      xml.querySelector('body');

    if (body) return stripDangerous(body.innerHTML || serializeChildren(body));
  } catch {
    // fallback abaixo
  }

  try {
    const html = new DOMParser().parseFromString(raw, 'text/html');
    return stripDangerous(html.body?.innerHTML || raw);
  } catch {
    return stripDangerous(raw);
  }
}

async function rewriteCssUrls(
  css: string,
  cssPath: string,
  getAssetUrl: (path: string) => Promise<string | null>,
) {
  const base = dirname(cssPath);
  const matches = Array.from(css.matchAll(/url\((['"]?)(.*?)\1\)/gi));
  let output = css;

  for (const match of matches) {
    const original = match[0];
    const value = match[2]?.trim();

    if (!value || value.startsWith('data:') || value.startsWith('http')) continue;

    const assetPath = joinPath(base, value);
    const url = await getAssetUrl(assetPath);

    if (url) {
      output = output.replace(original, `url("${url}")`);
    }
  }

  return output;
}

async function rewriteHtmlAssets(
  html: string,
  chapterPath: string,
  zip: JSZipType,
  objectUrls: string[],
) {
  const chapterDir = dirname(chapterPath);
  const doc = new DOMParser().parseFromString(`<main>${html}</main>`, 'text/html');
  const root = doc.querySelector('main');

  if (!root) return html;

  const assetCache = new Map<string, string>();

  async function getAssetUrl(path: string) {
    if (
      path.startsWith('data:') ||
      path.startsWith('blob:') ||
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path;
    }

    const clean = normalizePath(path);

    if (assetCache.has(clean)) {
      return assetCache.get(clean) || null;
    }

    const file = getZipFile(zip, clean);
    if (!file) return null;

    const blob = await file.async('blob');
    const typedBlob = new Blob([blob], { type: getMimeType(clean) });
    const url = URL.createObjectURL(typedBlob);

    objectUrls.push(url);
    assetCache.set(clean, url);

    return url;
  }

  const links = Array.from(root.querySelectorAll('link[rel~="stylesheet"][href]'));

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;

    const cssPath = joinPath(chapterDir, href);
    const cssFile = getZipFile(zip, cssPath);

    if (cssFile) {
      try {
        const css = await cssFile.async('text');
        const rewrittenCss = await rewriteCssUrls(css, cssPath, getAssetUrl);
        const style = doc.createElement('style');
        style.textContent = rewrittenCss;
        root.insertBefore(style, root.firstChild);
      } catch {
        // CSS quebrado não deve quebrar capítulo
      }
    }

    link.remove();
  }

  const srcElements = Array.from(root.querySelectorAll('[src]'));

  for (const element of srcElements) {
    const value = element.getAttribute('src');
    if (!value) continue;

    const assetPath = joinPath(chapterDir, value);
    const url = await getAssetUrl(assetPath);

    if (url) element.setAttribute('src', url);
  }

  const posterElements = Array.from(root.querySelectorAll('[poster]'));

  for (const element of posterElements) {
    const value = element.getAttribute('poster');
    if (!value) continue;

    const assetPath = joinPath(chapterDir, value);
    const url = await getAssetUrl(assetPath);

    if (url) element.setAttribute('poster', url);
  }

  const hrefElements = Array.from(root.querySelectorAll('[href]'));

  for (const element of hrefElements) {
    const tag = element.tagName.toLowerCase();
    if (tag === 'a') continue;

    const value = element.getAttribute('href');
    if (!value) continue;

    const assetPath = joinPath(chapterDir, value);
    const url = await getAssetUrl(assetPath);

    if (url) element.setAttribute('href', url);
  }

  const xlinkElements = Array.from(root.querySelectorAll('[xlink\\:href], [href]'));

  for (const element of xlinkElements) {
    const value = element.getAttribute('xlink:href');
    if (!value) continue;

    const assetPath = joinPath(chapterDir, value);
    const url = await getAssetUrl(assetPath);

    if (url) {
      element.setAttribute('href', url);
      element.setAttribute('xlink:href', url);
    }
  }

  const styledElements = Array.from(root.querySelectorAll('[style]'));

  for (const element of styledElements) {
    const style = element.getAttribute('style');
    if (!style || !style.includes('url(')) continue;

    const rewritten = await rewriteCssUrls(style, chapterPath, getAssetUrl);
    element.setAttribute('style', rewritten);
  }

  return stripDangerous(root.innerHTML);
}

function isReadableChapter(html: string) {
  const hasImage = /<(img|svg|picture|image)\b/i.test(html);
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  return hasImage || text.length > 30;
}

function getSavedRatio(bookId: string) {
  try {
    const raw = localStorage.getItem(`lume-epub-native-scroll:${bookId}`);
    if (!raw) return 0;

    const parsed = JSON.parse(raw) as { ratio?: number };
    return typeof parsed.ratio === 'number' ? Math.min(Math.max(parsed.ratio, 0), 1) : 0;
  } catch {
    return 0;
  }
}

function saveRatio(bookId: string, ratio: number) {
  try {
    localStorage.setItem(
      `lume-epub-native-scroll:${bookId}`,
      JSON.stringify({
        ratio,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Não quebrar leitura.
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
    onTextSelected,
    onPageChange,
    onHighlight: _onHighlight,
    annotations: _annotations = [],
  },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPageChangeRef = useRef(onPageChange);

  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [softMessage, setSoftMessage] = useState('Preparando EPUB contínuo...');
  const [error, setError] = useState<string | null>(null);

  const readerTheme = getThemeName(theme);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  const clearObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }

    objectUrlsRef.current = [];
  }, []);

  const emitProgress = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const max = Math.max(1, container.scrollHeight - container.clientHeight);
    const ratio = Math.min(Math.max(container.scrollTop / max, 0), 1);
    const progress = Math.round(ratio * 100);

    saveRatio(bookId, ratio);
    onPageChangeRef.current?.(`native:${ratio.toFixed(6)}`, progress);
  }, [bookId]);

  useEffect(() => {
    let cancelled = false;

    async function buildEpub() {
      try {
        setLoading(true);
        setError(null);
        setSoftMessage('Lendo arquivo EPUB...');

        clearObjectUrls();

        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();

        if (!buffer || buffer.byteLength < 4) {
          throw new Error('EPUB vazio ou incompleto.');
        }

        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default;
        const zip = await JSZip.loadAsync(buffer);

        if (cancelled) return;

        const containerFile = getZipFile(zip, 'META-INF/container.xml');

        if (!containerFile) {
          throw new Error('EPUB inválido: container.xml não encontrado.');
        }

        const containerXml = await containerFile.async('text');
        const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
        const rootfile = getElements(containerDoc, 'rootfile')[0];
        const opfPath = rootfile?.getAttribute('full-path');

        if (!opfPath) {
          throw new Error('EPUB inválido: OPF principal não encontrado.');
        }

        const opfFile = getZipFile(zip, opfPath);

        if (!opfFile) {
          throw new Error('EPUB inválido: arquivo OPF não encontrado.');
        }

        const opfDir = dirname(opfPath);
        const opfXml = await opfFile.async('text');
        const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');

        const manifest = new Map<string, ManifestItem>();

        for (const item of getElements(opfDoc, 'item')) {
          const id = item.getAttribute('id') || '';
          const href = item.getAttribute('href') || '';
          const mediaType = item.getAttribute('media-type') || '';

          if (!id || !href) continue;

          const fullPath = joinPath(opfDir, href);

          manifest.set(id, {
            id,
            href,
            mediaType,
            fullPath,
          });
        }

        const spineItems = getElements(opfDoc, 'itemref')
          .map(itemref => {
            const idref = itemref.getAttribute('idref') || '';
            return manifest.get(idref) || null;
          })
          .filter((item): item is ManifestItem => {
            if (!item) return false;

            const lower = item.fullPath.toLowerCase();

            return (
              item.mediaType.includes('html') ||
              lower.endsWith('.xhtml') ||
              lower.endsWith('.html') ||
              lower.endsWith('.htm')
            );
          });

        if (spineItems.length === 0) {
          throw new Error('Nenhum capítulo XHTML/HTML encontrado neste EPUB.');
        }

        const sections: string[] = [];

        for (let index = 0; index < spineItems.length; index += 1) {
          const item = spineItems[index];

          setSoftMessage(`Montando capítulo ${index + 1} de ${spineItems.length}...`);

          const file = getZipFile(zip, item.fullPath);
          if (!file) continue;

          const raw = await file.async('text');
          const bodyHtml = extractBodyHtml(raw);
          const rewritten = await rewriteHtmlAssets(bodyHtml, item.fullPath, zip, objectUrlsRef.current);

          if (!isReadableChapter(rewritten)) {
            continue;
          }

          sections.push(`
            <section class="lume-epub-native-section" data-chapter="${index + 1}">
              <div class="lume-epub-native-marker">Capítulo ${index + 1}</div>
              ${rewritten}
            </section>
          `);

          if (cancelled) return;
        }

        if (sections.length === 0) {
          throw new Error('Não encontrei texto visível nos capítulos deste EPUB.');
        }

        setHtml(sections.join('\n'));
        setLoading(false);

        window.setTimeout(() => {
          const container = scrollRef.current;
          if (!container) return;

          const ratio = getSavedRatio(bookId);
          const max = Math.max(0, container.scrollHeight - container.clientHeight);
          container.scrollTop = ratio * max;
          emitProgress();
        }, 120);
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

    void buildEpub();

    return () => {
      cancelled = true;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      clearObjectUrls();
    };
  }, [bookId, clearObjectUrls, emitProgress, fileUrl]);

  const handleScroll = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(emitProgress, 180);
  };

  const scrollByPage = (direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollBy({
      top: direction * container.clientHeight * 0.86,
      behavior: 'smooth',
    });

    window.setTimeout(emitProgress, 350);
  };

  const previousPage = useCallback(() => scrollByPage(-1), [emitProgress]);
  const nextPage = useCallback(() => scrollByPage(1), [emitProgress]);

  const goToCfi = useCallback(
    (cfi: string) => {
      const match = cfi.match(/^native:(\d+(?:\.\d+)?)/);
      const ratio = match ? Number(match[1]) : getSavedRatio(bookId);
      const container = scrollRef.current;

      if (!container || !Number.isFinite(ratio)) return;

      const max = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = Math.min(Math.max(ratio, 0), 1) * max;
      emitProgress();
    },
    [bookId, emitProgress],
  );

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
      addHighlight: () => {},
    }),
    [goToCfi, nextPage, previousPage],
  );

  const handleSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();

    if (!selected) return;

    const rect = selection?.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    const ratio = getSavedRatio(bookId);

    onTextSelected?.(selected, rect?.left ?? 0, rect?.top ?? 0, `native:${ratio.toFixed(6)}`);
  };

  return (
    <div className="lume-epub-native-shell" data-reader-theme={readerTheme}>
      <article
        ref={scrollRef}
        className="lume-epub-native-scroll"
        onScroll={handleScroll}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
      >
        <div
          className="lume-epub-native-page"
          style={{
            fontSize,
            fontFamily,
            lineHeight,
            maxWidth: `${readerWidth}px`,
            padding: `${pageMargin}px 24px 96px`,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {loading && (
        <div className="lume-epub-native-overlay">
          <div className="lume-r4-loading">
            <div className="spinner" />
            <strong>Carregando EPUB...</strong>
            <span>{softMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="lume-epub-native-overlay">
          <div className="lume-r4-error">
            <strong>Não foi possível abrir este EPUB</strong>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
});
