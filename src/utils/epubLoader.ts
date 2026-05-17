import ePub, { type Book as EpubBook } from 'epubjs';

export type { EpubBook };

export interface EpubChapter {
  id: string;
  label: string;
  href: string;
}

export async function loadEpub(arrayBuffer: ArrayBuffer): Promise<EpubBook> {
  const book = ePub(arrayBuffer as unknown as string);
  await book.ready;
  return book;
}

export async function getEpubChapters(book: EpubBook): Promise<EpubChapter[]> {
  await book.loaded.navigation;
  const nav = book.navigation;
  return nav.toc.map((item) => ({
    id: item.id ?? item.href,
    label: item.label.trim(),
    href: item.href,
  }));
}

export async function getEpubCover(book: EpubBook): Promise<string | null> {
  try {
    const coverUrl = await book.coverUrl();
    return coverUrl ?? null;
  } catch {
    return null;
  }
}

export async function getEpubMetadata(book: EpubBook): Promise<{ title: string; author: string }> {
  await book.loaded.metadata;
  return {
    title: book.packaging.metadata.title ?? '',
    author: book.packaging.metadata.creator ?? '',
  };
}
