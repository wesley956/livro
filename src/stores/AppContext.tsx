import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  Book, Note, ReadingSession, Bookmark, ReaderPreferences,
  Route, ToastMessage, ToastType, UserProfile,
} from '../types';
import {
  dbGetBooks, dbSetBook, dbDeleteBook,
  dbGetNotes, dbSetNote, dbDeleteNote,
  dbGetSessions, dbSetSession,
  dbGetBookmarks, dbSetBookmark, dbDeleteBookmark,
  dbGetPrefs, dbSetPrefs, dbSetFile, dbGetFile, dbDeleteFile,
} from '../utils/db';
import { generateId } from '../utils/fileUtils';

// ─── State shape ────────────────────────────────────────────────────────────
interface AppState {
  books: Book[];
  notes: Note[];
  sessions: ReadingSession[];
  bookmarks: Bookmark[];
  prefs: ReaderPreferences;
  route: Route;
  currentBookId: string | null;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: ToastMessage[];
  userProfile: UserProfile;
  loaded: boolean;
}

const DEFAULT_PREFS: ReaderPreferences = {
  fontSize: 18,
  theme: 'jade',
  darkMode: true,
  lineHeight: 1.8,
  fontFamily: 'garamond',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Leitor',
  email: '',
  avatarIndex: 0,
};

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem('lume-profile');
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* empty */ }
  return DEFAULT_PROFILE;
}

function loadSidebarCollapsed(): boolean {
  return localStorage.getItem('lume-sidebar') === 'true';
}

const INITIAL_STATE: AppState = {
  books: [],
  notes: [],
  sessions: [],
  bookmarks: [],
  prefs: DEFAULT_PREFS,
  route: 'home',
  currentBookId: null,
  sidebarCollapsed: loadSidebarCollapsed(),
  searchOpen: false,
  toasts: [],
  userProfile: loadProfile(),
  loaded: false,
};

// ─── Actions ────────────────────────────────────────────────────────────────
type Action =
  | { type: 'LOAD'; books: Book[]; notes: Note[]; sessions: ReadingSession[]; bookmarks: Bookmark[]; prefs: ReaderPreferences }
  | { type: 'ADD_BOOK'; book: Book }
  | { type: 'UPDATE_BOOK'; book: Book }
  | { type: 'REMOVE_BOOK'; id: string }
  | { type: 'TOGGLE_FAVORITE'; id: string }
  | { type: 'SET_PROGRESS'; id: string; page: number }
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'UPDATE_NOTE'; note: Note }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'ADD_SESSION'; session: ReadingSession }
  | { type: 'ADD_BOOKMARK'; bookmark: Bookmark }
  | { type: 'DELETE_BOOKMARK'; id: string }
  | { type: 'SET_ROUTE'; route: Route; bookId?: string }
  | { type: 'SET_PREFS'; prefs: Partial<ReaderPreferences> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; collapsed: boolean }
  | { type: 'OPEN_SEARCH' }
  | { type: 'CLOSE_SEARCH' }
  | { type: 'ADD_TOAST'; toast: ToastMessage }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_PROFILE'; profile: UserProfile };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, books: action.books, notes: action.notes, sessions: action.sessions, bookmarks: action.bookmarks, prefs: action.prefs, loaded: true };
    case 'ADD_BOOK':
      return { ...state, books: [...state.books, action.book] };
    case 'UPDATE_BOOK':
      return { ...state, books: state.books.map(b => b.id === action.book.id ? action.book : b) };
    case 'REMOVE_BOOK':
      return { ...state, books: state.books.filter(b => b.id !== action.id) };
    case 'TOGGLE_FAVORITE':
      return { ...state, books: state.books.map(b => b.id === action.id ? { ...b, favorite: !b.favorite } : b) };
    case 'SET_PROGRESS': {
      const progress = state.books.find(b => b.id === action.id);
      if (!progress) return state;
      const pct = Math.round((action.page / (progress.totalPages || 1)) * 100);
      return {
        ...state,
        books: state.books.map(b =>
          b.id === action.id
            ? { ...b, currentPage: action.page, progress: pct, lastRead: new Date().toISOString() }
            : b
        ),
      };
    }
    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes] };
    case 'UPDATE_NOTE':
      return { ...state, notes: state.notes.map(n => n.id === action.note.id ? action.note : n) };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(n => n.id !== action.id) };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.session] };
    case 'ADD_BOOKMARK':
      return { ...state, bookmarks: [...state.bookmarks, action.bookmark] };
    case 'DELETE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter(b => b.id !== action.id) };
    case 'SET_ROUTE':
      return { ...state, route: action.route, currentBookId: action.bookId ?? state.currentBookId };
    case 'SET_PREFS':
      return { ...state, prefs: { ...state.prefs, ...action.prefs } };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_SIDEBAR':
      return { ...state, sidebarCollapsed: action.collapsed };
    case 'OPEN_SEARCH':
      return { ...state, searchOpen: true };
    case 'CLOSE_SEARCH':
      return { ...state, searchOpen: false };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts.slice(-9), action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'SET_PROFILE':
      return { ...state, userProfile: action.profile };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience actions
  navigate: (route: Route, bookId?: string) => void;
  addToast: (type: ToastType, message: string) => void;
  importBook: (file: File) => Promise<void>;
  openBook: (bookId: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteNote: (id: string) => void;
  updateNote: (note: Note) => void;
  toggleFavorite: (id: string) => void;
  removeBook: (id: string) => void;
  updatePrefs: (prefs: Partial<ReaderPreferences>) => void;
  setProgress: (bookId: string, page: number) => void;
  addSession: (session: Omit<ReadingSession, 'id'>) => void;
  addBookmark: (bm: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  deleteBookmark: (id: string) => void;
  setProfile: (profile: UserProfile) => void;
  getFile: (bookId: string) => Promise<ArrayBuffer | undefined>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const sessionStartRef = useRef<{ bookId: string; page: number; time: number } | null>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      const [books, notes, sessions, bookmarks, prefs] = await Promise.all([
        dbGetBooks(),
        dbGetNotes(),
        dbGetSessions(),
        dbGetBookmarks(),
        dbGetPrefs(),
      ]);
      dispatch({
        type: 'LOAD',
        books,
        notes,
        sessions,
        bookmarks,
        prefs: prefs ?? DEFAULT_PREFS,
      });
      if (books.length > 0) {
        dispatch({ type: 'ADD_TOAST', toast: { id: generateId(), type: 'success', message: `Biblioteca restaurada (${books.length} livros)`, createdAt: Date.now() } });
      }
    }
    loadData();
  }, []);

  // Persist sidebar
  useEffect(() => {
    localStorage.setItem('lume-sidebar', String(state.sidebarCollapsed));
  }, [state.sidebarCollapsed]);

  // Apply theme to html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.prefs.darkMode ? 'dark' : 'light');
  }, [state.prefs.darkMode]);

  // Sync prefs to DB (debounced)
  const prefsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.loaded) return;
    if (prefsTimeout.current) clearTimeout(prefsTimeout.current);
    prefsTimeout.current = setTimeout(() => {
      dbSetPrefs(state.prefs);
    }, 500);
  }, [state.prefs, state.loaded]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const toast: ToastMessage = { id: generateId(), type, message, createdAt: Date.now() };
    dispatch({ type: 'ADD_TOAST', toast });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id: toast.id }), 4000);
  }, []);

  const navigate = useCallback((route: Route, bookId?: string) => {
    dispatch({ type: 'SET_ROUTE', route, bookId });
    if (typeof window !== 'undefined') {
      const url = route === 'reader' && bookId ? `/reader/${bookId}` : `/${route === 'home' ? '' : route}`;
      window.history.pushState({ route, bookId }, '', url);
    }
  }, []);

  const openBook = useCallback((bookId: string) => {
    sessionStartRef.current = { bookId, page: 0, time: Date.now() };
    // Update lastRead
    const book = state.books.find(b => b.id === bookId);
    if (book) {
      const updated = { ...book, lastRead: new Date().toISOString() };
      dispatch({ type: 'UPDATE_BOOK', book: updated });
      dbSetBook(updated);
    }
    navigate('reader', bookId);
  }, [state.books, navigate]);

  const importBook = useCallback(async (file: File) => {
    const { getFileFormat, generateId: genId, formatFileSize } = await import('../utils/fileUtils');
    const { generateCoverSVG, svgToDataURL } = await import('../utils/coverUtils');

    const format = getFileFormat(file);
    if (!format) { addToast('error', 'Formato não suportado'); return; }

    const arrayBuffer = await file.arrayBuffer();
    let title = file.name.replace(/\.(pdf|epub)$/i, '');
    let author = 'Autor desconhecido';
    let totalPages = 1;
    let cover: string | null = null;

    try {
      if (format === 'PDF') {
        const { loadPDF, extractMetadata, renderFirstPageAsBase64 } = await import('../utils/pdfLoader');
        const pdf = await loadPDF(arrayBuffer.slice(0));
        const meta = await extractMetadata(pdf);
        if (meta.title) title = meta.title;
        if (meta.author) author = meta.author;
        totalPages = meta.numPages;
        cover = await renderFirstPageAsBase64(pdf);
      } else {
        const { loadEpub, getEpubMetadata, getEpubCover } = await import('../utils/epubLoader');
        const epub = await loadEpub(arrayBuffer.slice(0));
        const meta = await getEpubMetadata(epub);
        if (meta.title) title = meta.title;
        if (meta.author) author = meta.author;
        cover = await getEpubCover(epub);
      }
    } catch {
      // fallback
    }

    if (!cover) {
      cover = svgToDataURL(generateCoverSVG(title, author));
    }

    const id = genId();
    const book: Book = {
      id,
      title,
      author,
      cover,
      format,
      status: 'new',
      progress: 0,
      totalPages,
      currentPage: 1,
      lastRead: null,
      favorite: false,
      mood: '📖',
      fileSize: file.size,
      importedAt: new Date().toISOString(),
      notes: [],
    };

    await dbSetFile(id, arrayBuffer);
    await dbSetBook(book);
    dispatch({ type: 'ADD_BOOK', book });
    addToast('success', `"${title}" adicionado à biblioteca!`);
    void formatFileSize; // used indirectly
  }, [addToast]);

  const addNote = useCallback((data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const note: Note = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTE', note });
    dbSetNote(note);
    addToast('success', 'Nota salva!');
  }, [addToast]);

  const updateNote = useCallback((note: Note) => {
    const updated = { ...note, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_NOTE', note: updated });
    dbSetNote(updated);
  }, []);

  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTE', id });
    dbDeleteNote(id);
    addToast('info', 'Nota removida');
  }, [addToast]);

  const toggleFavorite = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', id });
    const book = state.books.find(b => b.id === id);
    if (book) {
      const updated = { ...book, favorite: !book.favorite };
      dbSetBook(updated);
    }
  }, [state.books]);

  const removeBook = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_BOOK', id });
    dbDeleteBook(id);
    dbDeleteFile(id);
    addToast('info', 'Livro removido da biblioteca');
  }, [addToast]);

  const updatePrefs = useCallback((prefs: Partial<ReaderPreferences>) => {
    dispatch({ type: 'SET_PREFS', prefs });
  }, []);

  const setProgress = useCallback((bookId: string, page: number) => {
    dispatch({ type: 'SET_PROGRESS', id: bookId, page });
    const book = state.books.find(b => b.id === bookId);
    if (book) {
      const pct = Math.round((page / (book.totalPages || 1)) * 100);
      const updated = { ...book, currentPage: page, progress: pct, lastRead: new Date().toISOString() };
      dbSetBook(updated);
    }
  }, [state.books]);

  const addSession = useCallback((data: Omit<ReadingSession, 'id'>) => {
    const session: ReadingSession = { ...data, id: generateId() };
    dispatch({ type: 'ADD_SESSION', session });
    dbSetSession(session);
  }, []);

  const addBookmark = useCallback((data: Omit<Bookmark, 'id' | 'createdAt'>) => {
    const bm: Bookmark = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    dispatch({ type: 'ADD_BOOKMARK', bookmark: bm });
    dbSetBookmark(bm);
    addToast('success', 'Marcador adicionado!');
  }, [addToast]);

  const deleteBookmark = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BOOKMARK', id });
    dbDeleteBookmark(id);
  }, []);

  const setProfile = useCallback((profile: UserProfile) => {
    dispatch({ type: 'SET_PROFILE', profile });
    localStorage.setItem('lume-profile', JSON.stringify(profile));
  }, []);

  const getFile = useCallback((bookId: string) => {
    return dbGetFile(bookId);
  }, []);

  // Browser back button
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const { route, bookId } = (e.state ?? {}) as { route?: Route; bookId?: string };
      dispatch({ type: 'SET_ROUTE', route: route ?? 'home', bookId });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    navigate,
    addToast,
    importBook,
    openBook,
    addNote,
    deleteNote,
    updateNote,
    toggleFavorite,
    removeBook,
    updatePrefs,
    setProgress,
    addSession,
    addBookmark,
    deleteBookmark,
    setProfile,
    getFile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
