import { useApp } from '../../stores/AppContext';
import { BookGrid } from './BookGrid';

export function FavoritesSection() {
  const { state } = useApp();
  const favorites = state.books.filter(b => b.favorite);

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 2 }}>
          Favoritos
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>
          {favorites.length} livro{favorites.length !== 1 ? 's' : ''} favoritado{favorites.length !== 1 ? 's' : ''}
        </div>
      </div>
      <BookGrid
        books={favorites}
        emptyMessage="Nenhum favorito ainda. Clique no ♡ em um livro para favoritar."
        emptyIcon="♡"
      />
    </div>
  );
}
