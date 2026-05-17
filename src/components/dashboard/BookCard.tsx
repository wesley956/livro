import { useState, useRef, useEffect } from 'react';
import type { Book } from '../../types';
import { useApp } from '../../stores/AppContext';
import { generateCoverSVG, svgToDataURL } from '../../utils/coverUtils';

interface BookCardProps {
  book: Book;
  onOpen?: (book: Book) => void;
}

export function BookCard({ book, onOpen }: BookCardProps) {
  const { toggleFavorite, removeBook, navigate, openBook } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const coverSrc = book.cover ?? svgToDataURL(generateCoverSVG(book.title, book.author));

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleOpen = () => {
    if (onOpen) onOpen(book);
    else openBook(book.id);
  };

  return (
    <div
      className="book-card"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid rgba(200,169,110,0.1)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Cover */}
      <div
        onClick={handleOpen}
        style={{ position: 'relative', paddingBottom: '140%', overflow: 'hidden' }}
        role="button"
        tabIndex={0}
        aria-label={`Abrir ${book.title}`}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
      >
        <img
          src={coverSrc}
          alt={`Capa de ${book.title}`}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src = svgToDataURL(generateCoverSVG(book.title, book.author));
          }}
        />
        {/* Format badge */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: book.format === 'PDF' ? 'rgba(139,26,26,0.85)' : 'rgba(26,92,72,0.85)',
          color: '#f0e8d8', fontSize: 9, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4, letterSpacing: 1, backdropFilter: 'blur(4px)',
        }}>
          {book.format}
        </span>
        {/* Favorite */}
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(book.id); }}
          aria-label={book.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(13,13,15,0.7)', border: 'none',
            borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14,
            backdropFilter: 'blur(4px)',
            color: book.favorite ? '#c8a96e' : 'rgba(240,232,216,0.5)',
          }}
        >
          {book.favorite ? '♥' : '♡'}
        </button>
        {/* Progress bar overlay */}
        {book.progress > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 3, background: 'rgba(0,0,0,0.5)',
          }}>
            <div style={{
              height: '100%', width: `${book.progress}%`,
              background: 'linear-gradient(90deg, var(--color-jade-bright), var(--color-gold))',
            }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 10px' }}>
        <div
          onClick={handleOpen}
          style={{ cursor: 'pointer' }}
        >
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 14, fontWeight: 600,
            color: 'var(--color-ivory)',
            lineHeight: 1.3, marginBottom: 3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {book.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-ivory-faint)', marginBottom: 6 }}>
            {book.author}
          </div>
          {book.progress > 0 && (
            <div style={{ fontSize: 10, color: 'var(--color-gold)', opacity: 0.8 }}>
              {book.progress}% · p. {book.currentPage}/{book.totalPages}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, position: 'relative' }} ref={menuRef}>
          <button
            onClick={handleOpen}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 8,
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.2)',
              color: 'var(--color-gold)', fontSize: 11, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.22)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.12)'}
          >
            Ler
          </button>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            aria-label="Mais opções"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(200,169,110,0.06)',
              border: '1px solid rgba(200,169,110,0.15)',
              color: 'var(--color-ivory-faint)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ⋯
          </button>

          {/* Context menu */}
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
                background: 'var(--color-panel)',
                border: '1px solid rgba(200,169,110,0.2)',
                borderRadius: 10, padding: 6,
                minWidth: 160, zIndex: 100,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.15s ease',
              }}
            >
              {[
                { label: book.favorite ? '♥ Remover favorito' : '♡ Favoritar', action: () => { toggleFavorite(book.id); setMenuOpen(false); } },
                { label: '📖 Ler agora', action: () => { openBook(book.id); setMenuOpen(false); } },
                { label: '📋 Detalhes', action: () => { navigate('library'); setMenuOpen(false); } },
                { label: '🗑 Remover', action: () => { if (confirm(`Remover "${book.title}"?`)) { removeBook(book.id); setMenuOpen(false); } }, danger: true },
              ].map(item => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={item.action}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', background: 'none',
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    fontSize: 12, color: (item as { danger?: boolean }).danger ? '#e74c3c' : 'var(--color-ivory-dim)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
