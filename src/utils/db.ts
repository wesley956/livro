import { get, set, del } from 'idb-keyval';
import type { Book, Bookmark, Note, ReaderPreferences, ReadingSession } from '../types';

const BOOKS_KEY = 'lume-books-v2';
const NOTES_KEY = 'lume-notes-v2';
const SESSIONS_KEY = 'lume-sessions-v2';
const BOOKMARKS_KEY = 'lume-bookmarks-v2';
const PREFS_KEY = 'lume-prefs-v2';
const FILE_PREFIX = 'lume-file-v2:';

type StoredFile =
  | ArrayBuffer
  | Blob
  | {
      buffer?: ArrayBuffer;
      blob?: Blob;
      mime?: string;
      name?: string;
      size?: number;
      savedAt?: string;
    };

function toStrictArrayBuffer(input: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof Uint8Array) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(input);
    return copy.buffer as ArrayBuffer;
  }

  return input.slice(0);
}

async function getArray<T>(key: string): Promise<T[]> {
  const value = await get<T[]>(key);
  return Array.isArray(value) ? value : [];
}

async function setArray<T extends { id: string }>(key: string, item: T): Promise<void> {
  const items = await getArray<T>(key);
  const next = items.some(existing => existing.id === item.id)
    ? items.map(existing => (existing.id === item.id ? item : existing))
    : [...items, item];

  await set(key, next);
}

async function deleteFromArray<T extends { id: string }>(key: string, id: string): Promise<void> {
  const items = await getArray<T>(key);
  await set(
    key,
    items.filter(item => item.id !== id),
  );
}

export const dbGetBooks = () => getArray<Book>(BOOKS_KEY);
export const dbSetBook = (book: Book) => setArray<Book>(BOOKS_KEY, book);
export const dbDeleteBook = (id: string) => deleteFromArray<Book>(BOOKS_KEY, id);

export const dbGetNotes = () => getArray<Note>(NOTES_KEY);
export const dbSetNote = (note: Note) => setArray<Note>(NOTES_KEY, note);
export const dbDeleteNote = (id: string) => deleteFromArray<Note>(NOTES_KEY, id);

export const dbGetSessions = () => getArray<ReadingSession>(SESSIONS_KEY);
export const dbSetSession = (session: ReadingSession) => setArray<ReadingSession>(SESSIONS_KEY, session);

export const dbGetBookmarks = () => getArray<Bookmark>(BOOKMARKS_KEY);
export const dbSetBookmark = (bookmark: Bookmark) => setArray<Bookmark>(BOOKMARKS_KEY, bookmark);
export const dbDeleteBookmark = (id: string) => deleteFromArray<Bookmark>(BOOKMARKS_KEY, id);

export const dbGetPrefs = () => get<ReaderPreferences>(PREFS_KEY);
export const dbSetPrefs = (prefs: ReaderPreferences) => set(PREFS_KEY, prefs);

export async function dbSetFile(
  bookId: string,
  file: ArrayBuffer | Uint8Array | Blob,
  meta?: { mime?: string; name?: string; size?: number },
): Promise<void> {
  let blob: Blob;

  if (file instanceof Blob) {
    blob = file;
  } else {
    const buffer = toStrictArrayBuffer(file);
    blob = new Blob([buffer], { type: meta?.mime || 'application/octet-stream' });
  }

  const stored: StoredFile = {
    blob,
    mime: meta?.mime || blob.type || 'application/octet-stream',
    name: meta?.name,
    size: meta?.size || blob.size,
    savedAt: new Date().toISOString(),
  };

  await set(`${FILE_PREFIX}${bookId}`, stored);
}

export async function dbGetFile(bookId: string): Promise<ArrayBuffer | undefined> {
  const stored = await get<StoredFile>(`${FILE_PREFIX}${bookId}`);

  if (!stored) return undefined;

  if (stored instanceof Blob) {
    const buffer = await stored.arrayBuffer();
    return buffer.byteLength > 0 ? buffer : undefined;
  }

  if (stored instanceof ArrayBuffer) {
    return stored.byteLength > 0 ? stored.slice(0) : undefined;
  }

  if (stored.blob instanceof Blob) {
    const buffer = await stored.blob.arrayBuffer();
    return buffer.byteLength > 0 ? buffer : undefined;
  }

  if (stored.buffer instanceof ArrayBuffer) {
    return stored.buffer.byteLength > 0 ? stored.buffer.slice(0) : undefined;
  }

  return undefined;
}

export const dbDeleteFile = (bookId: string) => del(`${FILE_PREFIX}${bookId}`);
