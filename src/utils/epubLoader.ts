import ePub from 'epubjs';

export type EpubBook = ReturnType<typeof ePub>;

export interface EpubChapter {
  id: string;
  href: string;
  label: string;
}

export interface EpubMetadata {
  title: string;
  author: string;
  language?: string;
  publisher?: string;
  description?: string;
}

function cloneArrayBuffer(input: ArrayBuffer | Uint8Array | Blob): Promise<ArrayBuffer> | ArrayBuffer {
  if (input instanceof Blob) return input.arrayBuffer();

  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy.buffer as ArrayBuffer;
  }

  return input.slice(0);
}

export async function loadEpub(input: ArrayBuffer | Uint8Array | Blob): Promise<EpubBook> {
  const buffer = await cloneArrayBuffer(input);

  if (!buffer || buffer.byteLength < 4) {
    throw new Error('Arquivo EPUB vazio ou incompleto.');
  }

  // O epub.js lida melhor com ArrayBuffer no WebView do Android do que com alguns Blob URLs.
  const book = ePub(buffer);

  try {
    await book.ready;
  } catch {
    // Alguns EPUBs não resolvem book.ready perfeitamente, mas ainda conseguem abrir capítulos.
    // Não rejeitamos cedo demais.
  }

  return book;
}

export async function getEpubMetadata(book: EpubBook): Promise<EpubMetadata> {
  try {
    await book.ready;
    const metadata = await book.loaded.metadata;

    return {
      title: metadata?.title || 'Livro sem título',
      author: metadata?.creator || 'Autor desconhecido',
      language: metadata?.language,
      publisher: metadata?.publisher,
      description: metadata?.description,
    };
  } catch {
    return {
      title: 'Livro sem título',
      author: 'Autor desconhecido',
    };
  }
}

export async function getEpubCover(book: EpubBook): Promise<string | null> {
  try {
    await book.ready;
    const coverUrl = await book.coverUrl();
    return coverUrl || null;
  } catch {
    return null;
  }
}

export async function getEpubChapters(book: EpubBook): Promise<EpubChapter[]> {
  try {
    await book.ready;

    const nav = await book.loaded.navigation;
    const toc = nav?.toc || [];

    if (toc.length > 0) {
      return toc.map((item, index) => ({
        id: item.id || item.href || `chapter-${index + 1}`,
        href: item.href,
        label: item.label?.trim() || `Capítulo ${index + 1}`,
      }));
    }
  } catch {
    // fallback abaixo
  }

  try {
    const spine = book.spine as unknown as {
      items?: Array<{
        idref?: string;
        href?: string;
        label?: string;
      }>;
    };

    const spineItems = spine.items || [];

    return spineItems.map((item, index) => ({
      id: item.idref || item.href || `spine-${index + 1}`,
      href: item.href || '',
      label: item.label?.trim?.() || `Capítulo ${index + 1}`,
    }));
  } catch {
    return [];
  }
}
