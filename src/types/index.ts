export type BookFormat = 'PDF' | 'EPUB';
export type BookStatus = 'reading' | 'completed' | 'paused' | 'new';
export type NoteTag = 'Reflexão' | 'Favorito' | 'Ideia' | 'Importante' | 'Nova nota';
export type ThemeName = 'jade' | 'paper' | 'dark-paper' | 'night';
export type Route = 'home' | 'library' | 'favorites' | 'recents' | 'notes' | 'settings' | 'reader';
export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  format: BookFormat;
  status: BookStatus;
  progress: number;
  totalPages: number;
  currentPage: number;
  lastRead: string | null;
  favorite: boolean;
  mood: string;
  fileSize: number;
  importedAt: string;
  notes: string[];
}

export interface Note {
  id: string;
  bookId: string | null;
  pageNumber: number;
  text: string;
  tag: NoteTag;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  durationMs: number;
  date: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  text: string;
  cfi?: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarIndex: number;
}

export interface ReaderPreferences {
  fontSize: number;
  theme: ThemeName;
  darkMode: boolean;
  lineHeight: number;
  fontFamily: 'garamond' | 'inter' | 'noto';
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}
