import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

export async function loadPDF(arrayBuffer: ArrayBuffer): Promise<PDFDoc> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return loadingTask.promise;
}

export async function renderPage(
  pdf: PDFDoc,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<void> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
  canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  await page.render({ canvasContext: ctx as Parameters<typeof page.render>[0]['canvasContext'], viewport, canvas }).promise;
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
    // ignore
  }
  return { title, author, numPages: pdf.numPages };
}

export async function renderFirstPageAsBase64(pdf: PDFDoc): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderPage(pdf, 1, canvas, 0.5);
  return canvas.toDataURL('image/jpeg', 0.8);
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
