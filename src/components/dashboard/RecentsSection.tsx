import { useMemo } from 'react';
import { useApp } from '../../stores/AppContext';
import { BookGrid } from './BookGrid';
import { isToday, isYesterday, isThisWeek } from '../../utils/dateUtils';
import type { Book } from '../../types';

interface Group {
  label: string;
  books: Book[];
}

export function RecentsSection() {
  const { state } = useApp();

  const groups = useMemo((): Group[] => {
    const withLastRead = state.books
      .filter(b => b.lastRead)
      .sort((a, b) => new Date(b.lastRead!).getTime() - new Date(a.lastRead!).getTime());

    const today: Book[] = [];
    const yesterday: Book[] = [];
    const week: Book[] = [];
    const older: Book[] = [];

    for (const book of withLastRead) {
      const lr = book.lastRead!;
      if (isToday(lr)) today.push(book);
      else if (isYesterday(lr)) yesterday.push(book);
      else if (isThisWeek(lr)) week.push(book);
      else older.push(book);
    }

    const result: Group[] = [];
    if (today.length) result.push({ label: 'Hoje', books: today });
    if (yesterday.length) result.push({ label: 'Ontem', books: yesterday });
    if (week.length) result.push({ label: 'Esta semana', books: week });
    if (older.length) result.push({ label: 'Mais antigos', books: older });
    return result;
  }, [state.books]);

  const total = groups.reduce((acc, g) => acc + g.books.length, 0);

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 2 }}>
          Lidos Recentemente
        </h2>
        <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>
          {total} livro{total !== 1 ? 's' : ''} acessado{total !== 1 ? 's' : ''}
        </div>
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-ivory-faint)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>◷</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-ivory-dim)', marginBottom: 6 }}>
            Sem histórico de leitura
          </div>
          <div style={{ fontSize: 13 }}>Abra um livro para ver seu histórico aqui</div>
        </div>
      )}

      {groups.map(group => (
        <section key={group.label} style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)', fontSize: 16,
              color: 'var(--color-gold)', fontWeight: 500,
            }}>
              {group.label}
            </h3>
            <div style={{ flex: 1, height: 1, background: 'rgba(200,169,110,0.1)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-ivory-faint)' }}>
              {group.books.length} livro{group.books.length !== 1 ? 's' : ''}
            </span>
          </div>
          <BookGrid books={group.books} />
        </section>
      ))}
    </div>
  );
}
