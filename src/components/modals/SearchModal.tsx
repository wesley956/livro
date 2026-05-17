import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../stores/AppContext';
import type { Book, Note } from '../../types';

function highlight(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

interface SearchResult {
  type: 'book' | 'note';
  id: string;
  title: string;
  sub: string;
  icon: string;
  bookId?: string;
}

export function SearchModal() {
  const { state, dispatch, openBook, navigate } = useApp();
  const { books, notes } = state;
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [debouncedQ, setDebouncedQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQ.trim()) return [];
    const q = debouncedQ.toLowerCase();
    const bookResults: SearchResult[] = (books as Book[])
      .filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .map(b => ({
        type: 'book' as const,
        id: b.id,
        title: b.title,
        sub: b.author,
        icon: b.format === 'PDF' ? '📄' : '📚',
      }));

    const noteResults: SearchResult[] = (notes as Note[])
      .filter(n => n.text.toLowerCase().includes(q))
      .map(n => {
        const book = books.find(b => b.id === n.bookId);
        return {
          type: 'note' as const,
          id: n.id,
          title: n.text.slice(0, 60) + (n.text.length > 60 ? '…' : ''),
          sub: book ? `${book.title} · p. ${n.pageNumber}` : 'Nota avulsa',
          icon: '✎',
          bookId: n.bookId ?? undefined,
        };
      });

    return [...bookResults, ...noteResults].slice(0, 10);
  }, [debouncedQ, books, notes]);

  useEffect(() => setCursor(0), [results]);

  const close = useCallback(() => dispatch({ type: 'CLOSE_SEARCH' }), [dispatch]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.type === 'book') {
      openBook(result.id);
    } else {
      if (result.bookId) openBook(result.bookId);
      else navigate('notes');
    }
    close();
  }, [openBook, navigate, close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { setCursor(c => Math.min(c + 1, results.length - 1)); e.preventDefault(); }
    if (e.key === 'ArrowUp') { setCursor(c => Math.max(c - 1, 0)); e.preventDefault(); }
    if (e.key === 'Enter' && results[cursor]) handleSelect(results[cursor]!);
  }, [close, cursor, results, handleSelect]);

  // Scroll into view
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  return (
    <div
      className="modal-overlay"
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh', backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid rgba(200,169,110,0.25)',
          borderRadius: 'var(--radius-modal)',
          width: '100%', maxWidth: 560,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(200,169,110,0.1)' }}>
          <span style={{ fontSize: 18, color: 'var(--color-ivory-faint)' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar livros, notas..."
            aria-label="Campo de busca global"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--color-ivory)', fontSize: 16,
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd style={{
            background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
            borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--color-ivory-faint)',
          }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Resultados da busca"
          style={{ maxHeight: 360, overflowY: 'auto' }}
        >
          {query.trim() && results.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ivory-faint)', fontSize: 13 }}>
              Nenhum resultado para "{query}"
            </div>
          )}
          {results.map((result, i) => (
            <button
              key={result.id}
              role="option"
              aria-selected={i === cursor}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '12px 20px', border: 'none', textAlign: 'left',
                background: i === cursor ? 'rgba(200,169,110,0.1)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
                borderBottom: '1px solid rgba(200,169,110,0.06)',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{result.icon}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{ fontSize: 14, color: 'var(--color-ivory)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                  dangerouslySetInnerHTML={{ __html: highlight(result.title, query) }}
                />
                <div style={{ fontSize: 11, color: 'var(--color-ivory-faint)', marginTop: 2 }}>
                  {result.sub}
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-ivory-faint)', flexShrink: 0 }}>
                {result.type === 'book' ? 'Livro' : 'Nota'}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        {!query.trim() && (
          <div style={{ padding: '12px 20px', display: 'flex', gap: 20, color: 'var(--color-ivory-faint)', fontSize: 11 }}>
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>Esc fechar</span>
          </div>
        )}
      </div>

      <style>{`mark { background: rgba(200,169,110,0.3); color: var(--color-gold); border-radius: 2px; padding: 0 1px; }`}</style>
    </div>
  );
}
