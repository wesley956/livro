import type { Book } from '../../types';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid rgba(200,169,110,0.08)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ paddingBottom: '140%' }} />
      <div style={{ padding: 12 }}>
        <div className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, borderRadius: 4, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 28, borderRadius: 8 }} />
      </div>
    </div>
  );
}

export function BookGrid({ books, loading, emptyMessage, emptyIcon }: BookGridProps) {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 16,
      }}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 20px', gap: 12,
        color: 'var(--color-ivory-faint)',
      }}>
        <div style={{ fontSize: 48 }}>{emptyIcon ?? '📚'}</div>
        <div style={{ fontSize: 14, textAlign: 'center' }}>{emptyMessage ?? 'Nenhum livro encontrado'}</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 16,
    }}>
      {books.map(book => <BookCard key={book.id} book={book} />)}
    </div>
  );
}
