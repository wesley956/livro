import { useMemo, useState } from 'react';
import { useApp } from '../../stores/AppContext';
import type { Book, Route } from '../../types';

type Filter = 'all' | 'PDF' | 'EPUB' | 'favorite';

const MAIN_ROUTES: Array<{ route: Route; label: string; icon: string; hint: string }> = [
  { route: 'home', label: 'Início', icon: '⌂', hint: 'Visão geral' },
  { route: 'library', label: 'Biblioteca', icon: '書', hint: 'Todos os livros' },
  { route: 'favorites', label: 'Favoritos', icon: '✦', hint: 'Marcados' },
  { route: 'recents', label: 'Recentes', icon: '◷', hint: 'Continue lendo' },
  { route: 'notes', label: 'Anotações', icon: '✎', hint: 'Notas salvas' },
  { route: 'settings', label: 'Configurações', icon: '⚙', hint: 'Preferências' },
];

function formatDate(value?: string | null) {
  if (!value) return 'Nunca aberto';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  } catch {
    return 'Recente';
  }
}

function formatBookType(book: Book) {
  return book.format === 'EPUB' ? 'EPUB' : 'PDF';
}

function getBookInitial(title: string) {
  const clean = title.trim();
  return clean ? clean.slice(0, 1).toUpperCase() : 'L';
}

export function Sidebar() {
  const { state, navigate, dispatch } = useApp();
  const { books, route, sidebarCollapsed } = state;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filteredBooks = useMemo(() => {
    const search = query.trim().toLowerCase();

    return books
      .filter(book => {
        const matchesSearch =
          !search ||
          book.title.toLowerCase().includes(search) ||
          book.author.toLowerCase().includes(search);

        const matchesFilter =
          filter === 'all' ||
          book.format === filter ||
          (filter === 'favorite' && book.favorite);

        return matchesSearch && matchesFilter;
      })
      .slice()
      .sort((a, b) => {
        const aTime = a.lastRead ? new Date(a.lastRead).getTime() : 0;
        const bTime = b.lastRead ? new Date(b.lastRead).getTime() : 0;
        return bTime - aTime;
      });
  }, [books, filter, query]);

  const totalProgress = books.length
    ? Math.round(books.reduce((sum, book) => sum + (book.progress || 0), 0) / books.length)
    : 0;

  const openRoute = (nextRoute: Route) => {
    navigate(nextRoute);

    if (window.innerWidth < 768) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  };

  const openBook = (book: Book) => {
    navigate('reader', book.id);

    if (window.innerWidth < 768) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  };

  return (
    <aside className={sidebarCollapsed ? 'lume-modern-sidebar collapsed' : 'lume-modern-sidebar'}>
      <div className="lume-modern-sidebar-inner">
        <div className="lume-modern-brand">
          <div className="lume-modern-brand-mark">書</div>

          <div className="lume-modern-brand-text">
            <strong>Lume</strong>
            <span>Reader</span>
          </div>

          <button
            type="button"
            className="lume-modern-collapse"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <div className="lume-modern-library-stats">
          <div>
            <span>{books.length}</span>
            <small>livros</small>
          </div>

          <div>
            <span>{totalProgress}%</span>
            <small>média</small>
          </div>
        </div>

        <nav className="lume-modern-nav" aria-label="Menu principal">
          {MAIN_ROUTES.map(item => (
            <button
              key={item.route}
              type="button"
              className={route === item.route ? 'active' : ''}
              onClick={() => openRoute(item.route)}
            >
              <span className="lume-modern-nav-icon">{item.icon}</span>

              <span className="lume-modern-nav-text">
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="lume-modern-sidebar-section">
          <div className="lume-modern-section-heading">
            <span>Biblioteca</span>
            <small>{filteredBooks.length}</small>
          </div>

          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar livro..."
            className="lume-modern-search"
          />

          <div className="lume-modern-filter-row">
            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              type="button"
              className={filter === 'PDF' ? 'active' : ''}
              onClick={() => setFilter('PDF')}
            >
              PDF
            </button>
            <button
              type="button"
              className={filter === 'EPUB' ? 'active' : ''}
              onClick={() => setFilter('EPUB')}
            >
              EPUB
            </button>
            <button
              type="button"
              className={filter === 'favorite' ? 'active' : ''}
              onClick={() => setFilter('favorite')}
            >
              ✦
            </button>
          </div>
        </div>

        <div className="lume-modern-book-list">
          {filteredBooks.length === 0 ? (
            <div className="lume-modern-empty-list">
              <div>☾</div>
              <span>Nenhum livro encontrado</span>
            </div>
          ) : (
            filteredBooks.slice(0, 10).map(book => (
              <button
                key={book.id}
                type="button"
                className="lume-modern-mini-book"
                onClick={() => openBook(book)}
              >
                <div className="lume-modern-mini-cover">
                  {book.cover ? (
                    <img src={book.cover} alt="" />
                  ) : (
                    <span>{getBookInitial(book.title)}</span>
                  )}
                </div>

                <div className="lume-modern-mini-info">
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>

                  <div className="lume-modern-mini-meta">
                    <small>{formatBookType(book)}</small>
                    <small>{formatDate(book.lastRead)}</small>
                  </div>

                  <div className="lume-modern-mini-progress">
                    <div style={{ width: `${book.progress || 0}%` }} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
