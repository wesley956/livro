import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

function toUint8Array(arrayBuffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(arrayBuffer.slice(0));
}

export async function loadPDF(arrayBuffer: ArrayBuffer): Promise<PDFDoc> {
  const loadingTask = pdfjsLib.getDocument({
    data: toUint8Array(arrayBuffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  return loadingTask.promise;
}

export async function renderPage(
  pdf: PDFDoc,
  pageNum: number,
  canvas: HTMLCanvasElement,
  options: { maxWidth?: number; scale?: number } = {},
): Promise<void> {
  const page = await pdf.getPage(pageNum);
  const baseViewport = page.getViewport({ scale: 1 });
  const preferredWidth = baseViewport.width * (options.scale ?? 1.35);
  const cssWidth = Math.max(260, Math.min(options.maxWidth ?? preferredWidth, preferredWidth));
  const cssScale = cssWidth / baseViewport.width;
  const cssHeight = baseViewport.height * cssScale;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: cssScale * pixelRatio });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(cssWidth)}px`;
  canvas.style.height = `${Math.floor(cssHeight)}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
}

export async function extractMetadata(pdf: PDFDoc): Promise<{ title: string; author: string; numPages: number }> {
  let title = '';
  let author = '';
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown>;
    if (typeof info['Title'] === 'string') title = info['Title'];
    if (typeof info['Author'] === 'string') author = info['Author'];
  } catch {
    // ignore metadata errors
  }
  return { title, author, numPages: pdf.numPages };
}

export async function renderFirstPageAsBase64(pdf: PDFDoc): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderPage(pdf, 1, canvas, { maxWidth: 360, scale: 0.7 });
  return canvas.toDataURL('image/jpeg', 0.82);
}

export async function extractPageText(pdf: PDFDoc, pageNum: number): Promise<string> {
  try {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    return content.items.map((item) => {
      if ('str' in item) return item.str;
      return '';
    }).join(' ');
  } catch {
    return '';
  }
}
