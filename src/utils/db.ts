import { get, set, del, keys, createStore } from 'idb-keyval';
import type { Book, Note, ReadingSession, Bookmark, ReaderPreferences } from '../types';

const bookStore = createStore('lume-books', 'books');
const fileStore = createStore('lume-files', 'files');
const noteStore = createStore('lume-notes', 'notes');
const sessionStore = createStore('lume-sessions', 'sessions');
const bookmarkStore = createStore('lume-bookmarks', 'bookmarks');
const prefStore = createStore('lume-prefs', 'prefs');

// Books
export async function dbGetBooks(): Promise<Book[]> {
  const ks = await keys(bookStore);
  const results = await Promise.all(ks.map(k => get<Book>(k, bookStore)));
  return results.filter((b): b is Book => b !== undefined);
}

export async function dbSetBook(book: Book): Promise<void> {
  await set(book.id, book, bookStore);
}

export async function dbDeleteBook(id: string): Promise<void> {
  await del(id, bookStore);
}

// Files
export async function dbSetFile(bookId: string, buffer: ArrayBuffer): Promise<void> {
  await set(bookId, buffer, fileStore);
}

export async function dbGetFile(bookId: string): Promise<ArrayBuffer | undefined> {
  return get<ArrayBuffer>(bookId, fileStore);
}

export async function dbDeleteFile(bookId: string): Promise<void> {
  await del(bookId, fileStore);
}

// Notes
export async function dbGetNotes(): Promise<Note[]> {
  const ks = await keys(noteStore);
  const results = await Promise.all(ks.map(k => get<Note>(k, noteStore)));
  return results.filter((n): n is Note => n !== undefined);
}

export async function dbSetNote(note: Note): Promise<void> {
  await set(note.id, note, noteStore);
}

export async function dbDeleteNote(id: string): Promise<void> {
  await del(id, noteStore);
}

// Sessions
export async function dbGetSessions(): Promise<ReadingSession[]> {
  const ks = await keys(sessionStore);
  const results = await Promise.all(ks.map(k => get<ReadingSession>(k, sessionStore)));
  return results.filter((s): s is ReadingSession => s !== undefined);
}

export async function dbSetSession(session: ReadingSession): Promise<void> {
  await set(session.id, session, sessionStore);
}

// Bookmarks
export async function dbGetBookmarks(): Promise<Bookmark[]> {
  const ks = await keys(bookmarkStore);
  const results = await Promise.all(ks.map(k => get<Bookmark>(k, bookmarkStore)));
  return results.filter((b): b is Bookmark => b !== undefined);
}

export async function dbSetBookmark(bookmark: Bookmark): Promise<void> {
  await set(bookmark.id, bookmark, bookmarkStore);
}

export async function dbDeleteBookmark(id: string): Promise<void> {
  await del(id, bookmarkStore);
}

// Preferences
export async function dbGetPrefs(): Promise<ReaderPreferences | undefined> {
  return get<ReaderPreferences>('prefs', prefStore);
}

export async function dbSetPrefs(prefs: ReaderPreferences): Promise<void> {
  await set('prefs', prefs, prefStore);
}
