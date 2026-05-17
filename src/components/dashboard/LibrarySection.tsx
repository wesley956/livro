import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../stores/AppContext';
import { BookGrid } from './BookGrid';
import { ImportModal } from '../modals/ImportModal';
import type { BookFormat } from '../../types';

type FilterType = 'all' | BookFormat | 'favorites';

export function LibrarySection() {
  const { state } = useApp();
  const { books, loaded } = state;
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let list = books;
    if (filter === 'favorites') list = list.filter(b => b.favorite);
    else if (filter === 'PDF' || filter === 'EPUB') list = list.filter(b => b.format === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [books, filter, search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setSearch('');
  }, []);

  const FILTERS: Array<{ key: FilterType; label: string }> = [
    { key: 'all', label: 'Todos' },
    { key: 'PDF', label: 'PDF' },
    { key: 'EPUB', label: 'EPUB' },
    { key: 'favorites', label: '♥ Favoritos' },
  ];

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 2 }}>
            Minha Biblioteca
          </h2>
          <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>
            {books.length} livro{books.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => setShowImport(true)}
          style={{
            background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
            border: '1px solid rgba(200,169,110,0.25)',
            color: 'var(--color-ivory)',
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        >
          + Importar livro
        </button>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Buscar por título ou autor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Buscar livros"
          style={{
            flex: '1 1 200px',
            background: 'var(--color-surface)',
            border: '1px solid rgba(200,169,110,0.15)',
            borderRadius: 8, padding: '8px 14px',
            color: 'var(--color-ivory)', fontSize: 13,
            outline: 'none',
          }}
        />
        <div role="listbox" aria-label="Filtrar por formato" style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              role="option"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                background: filter === f.key ? 'rgba(200,169,110,0.2)' : 'rgba(200,169,110,0.06)',
                border: filter === f.key ? '1px solid rgba(200,169,110,0.4)' : '1px solid rgba(200,169,110,0.12)',
                color: filter === f.key ? 'var(--color-gold)' : 'var(--color-ivory-faint)',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'visible' }}>
        <BookGrid
          books={filtered}
          loading={!loaded}
          emptyMessage={search ? `Nenhum resultado para "${search}"` : 'Nenhum livro aqui ainda. Importe um PDF ou EPUB!'}
          emptyIcon="📭"
        />
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
