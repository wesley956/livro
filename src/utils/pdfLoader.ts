import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export type PDFPasswordState = 'password-required' | 'password-incorrect';

export class PDFPasswordError extends Error {
  state: PDFPasswordState;

  constructor(state: PDFPasswordState) {
    super(state === 'password-required' ? 'PDF protegido por senha.' : 'Senha incorreta.');
    this.name = 'PDFPasswordError';
    this.state = state;
  }
}

export class PDFLoadError extends Error {
  constructor(message = 'Não foi possível carregar este PDF.') {
    super(message);
    this.name = 'PDFLoadError';
  }
}

async function toUint8Array(input: ArrayBuffer | Uint8Array | Blob): Promise<Uint8Array> {
  if (input instanceof Blob) {
    const buffer = await input.arrayBuffer();
    return new Uint8Array(buffer);
  }

  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy;
  }

  return new Uint8Array(input.slice(0));
}

export async function loadPDF(
  input: ArrayBuffer | Uint8Array | Blob,
  password?: string,
): Promise<pdfjsLib.PDFDocumentProxy> {
  const data = await toUint8Array(input);

  if (data.byteLength < 8) {
    throw new PDFLoadError('Arquivo PDF vazio ou incompleto.');
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    password,
    useWorkerFetch: false,
    isEvalSupported: false,
    stopAtErrors: false,
    disableFontFace: false,
    useSystemFonts: true,
  });

  loadingTask.onPassword = (
    updatePassword: (password: string) => void,
    reason: number,
  ) => {
    if (password) {
      updatePassword(password);
      return;
    }

    if (reason === 2) {
      throw new PDFPasswordError('password-incorrect');
    }

    throw new PDFPasswordError('password-required');
  };

  try {
    return await loadingTask.promise;
  } catch (error) {
    if (error instanceof PDFPasswordError) throw error;

    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);

    if (name === 'PasswordException' || /password/i.test(message)) {
      throw new PDFPasswordError(password ? 'password-incorrect' : 'password-required');
    }

    throw new PDFLoadError(message || 'Não foi possível carregar este PDF.');
  }
}

export async function renderPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement,
  options: { maxWidth?: number; scale?: number; rotation?: number } = {},
): Promise<void> {
  const page = await pdf.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1, rotation: options.rotation ?? undefined });

  const maxWidth = Math.max(260, options.maxWidth ?? baseViewport.width);
  const baseScale = maxWidth / baseViewport.width;
  const cssScale = Math.min(Math.max(baseScale * (options.scale ?? 1), 0.45), 3);
  const cssWidth = Math.floor(baseViewport.width * cssScale);
  const cssHeight = Math.floor(baseViewport.height * cssScale);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
  const viewport = page.getViewport({
    scale: cssScale * pixelRatio,
    rotation: options.rotation ?? undefined,
  });

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new PDFLoadError('Canvas indisponível para renderizar o PDF.');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const task = page.render({ canvasContext: ctx, viewport, canvas });
  await task.promise;
}

export async function extractMetadata(
  pdf: pdfjsLib.PDFDocumentProxy,
): Promise<{ title: string; author: string; numPages: number }> {
  let title = '';
  let author = '';

  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown>;

    if (typeof info.Title === 'string') title = info.Title;
    if (typeof info.Author === 'string') author = info.Author;
  } catch {
    // metadados ausentes não impedem leitura
  }

  return { title, author, numPages: pdf.numPages };
}

export async function renderFirstPageAsBase64(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderPage(pdf, 1, canvas, { maxWidth: 360, scale: 0.7 });
  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function extractPageText(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  try {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    return content.items
      .map(item => ('str' in item && typeof item.str === 'string' ? item.str : ''))
      .join(' ');
  } catch {
    return '';
  }
}
