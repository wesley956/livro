import { useEffect } from 'react';
import { AppProvider, useApp } from './stores/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { HomeSection } from './components/dashboard/HomeSection';
import { LibrarySection } from './components/dashboard/LibrarySection';
import { FavoritesSection } from './components/dashboard/FavoritesSection';
import { RecentsSection } from './components/dashboard/RecentsSection';
import { NotesSection } from './components/notes/NotesSection';
import { SettingsSection } from './components/settings/SettingsSection';
import { ReaderView } from './components/reader/ReaderView';
import { SearchModal } from './components/modals/SearchModal';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import type { Route } from './types';

const ROUTE_TITLES: Record<Route, string> = {
  home: 'Início',
  library: 'Biblioteca',
  favorites: 'Favoritos',
  recents: 'Recentes',
  notes: 'Anotações',
  settings: 'Configurações',
  reader: 'Leitor',
};

function routeFromPath(pathname: string): { route: Route; bookId?: string } {
  const clean = pathname.replace(/^\/+|\/+$/g, '');

  if (!clean) return { route: 'home' };

  if (clean.startsWith('reader/')) {
    const bookId = decodeURIComponent(clean.replace('reader/', ''));
    return bookId ? { route: 'reader', bookId } : { route: 'reader' };
  }

  const allowed: Route[] = ['home', 'library', 'favorites', 'recents', 'notes', 'settings', 'reader'];

  if (allowed.includes(clean as Route)) {
    return { route: clean as Route };
  }

  return { route: 'home' };
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 46, marginBottom: 14, animation: 'float 3s ease infinite' }}>
          書
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-gold)' }}>
          Lume Reader
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-ivory-faint)' }}>
          Restaurando biblioteca...
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { state, dispatch } = useApp();
  const { route, searchOpen, loaded } = state;

  useEffect(() => {
    const parsed = routeFromPath(window.location.pathname);
    dispatch({ type: 'SET_ROUTE', route: parsed.route, bookId: parsed.bookId });
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if (isSearchShortcut) {
        event.preventDefault();
        dispatch({ type: 'OPEN_SEARCH' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const renderSection = () => {
    switch (route) {
      case 'home':
        return <HomeSection />;
      case 'library':
        return <LibrarySection />;
      case 'favorites':
        return <FavoritesSection />;
      case 'recents':
        return <RecentsSection />;
      case 'notes':
        return <NotesSection />;
      case 'settings':
        return <SettingsSection />;
      case 'reader':
        return <ReaderView />;
      default:
        return <HomeSection />;
    }
  };

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <>
      {route === 'reader' ? (
        <ErrorBoundary>
          <ReaderView />
        </ErrorBoundary>
      ) : (
        <div className="app-shell">
          <Sidebar />

          <div className="app-content">
            <TopBar title={ROUTE_TITLES[route]} />

            <main role="main" className="app-main">
              <ErrorBoundary>{renderSection()}</ErrorBoundary>
            </main>
          </div>
        </div>
      )}

      {searchOpen && <SearchModal />}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
