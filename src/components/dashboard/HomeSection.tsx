import { useMemo } from 'react';
import { useApp } from '../../stores/AppContext';
import { StatCard } from './StatCard';
import { BookGrid } from './BookGrid';
import { DragonOrnament } from '../decorative/ChineseSVGs';
import { formatDuration, getReadingStreak, isToday } from '../../utils/dateUtils';

export function HomeSection() {
  const { state, navigate } = useApp();
  const { books, sessions, userProfile } = state;

  const stats = useMemo(() => {
    const todaySessions = sessions.filter(s => isToday(s.date));
    const pagesToday = todaySessions.reduce((acc, s) => acc + (s.endPage - s.startPage), 0);
    const streak = getReadingStreak(sessions);
    const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0);
    const thisMonth = new Set(sessions.filter(s => {
      const d = new Date(s.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).map(s => s.bookId)).size;

    return { pagesToday, streak, totalTime: formatDuration(totalMs), thisMonth };
  }, [sessions]);

  const recentBooks = useMemo(() => {
    return [...books]
      .filter(b => b.lastRead)
      .sort((a, b) => new Date(b.lastRead!).getTime() - new Date(a.lastRead!).getTime())
      .slice(0, 6);
  }, [books]);

  const inProgress = useMemo(() =>
    books.filter(b => b.status === 'reading' || (b.progress > 0 && b.progress < 100)).slice(0, 6),
    [books]
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(26,92,72,0.3) 0%, rgba(139,26,26,0.2) 100%)',
        border: '1px solid rgba(200,169,110,0.15)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.15 }}>
          <DragonOrnament />
        </div>
        <div style={{ fontSize: 28, marginBottom: 4 }}>
          {greeting}, <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>{userProfile.name}</span> 👋
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-ivory-faint)', marginBottom: 20 }}>
          {books.length === 0
            ? 'Sua biblioteca está vazia. Importe seu primeiro livro!'
            : `Você tem ${books.length} livro${books.length !== 1 ? 's' : ''} na biblioteca.`}
        </div>
        {recentBooks[0] && (
          <button
            onClick={() => navigate('reader', recentBooks[0]!.id)}
            style={{
              background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
              border: '1px solid rgba(200,169,110,0.25)',
              color: 'var(--color-ivory)',
              padding: '10px 22px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          >
            ▶ Continuar: {recentBooks[0].title.length > 25 ? recentBooks[0].title.slice(0, 25) + '…' : recentBooks[0].title}
          </button>
        )}
        {books.length === 0 && (
          <button
            onClick={() => navigate('library')}
            style={{
              background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
              border: '1px solid rgba(200,169,110,0.25)',
              color: 'var(--color-ivory)',
              padding: '10px 22px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
            }}
          >
            + Importar livro
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard icon="📄" label="Páginas hoje" value={stats.pagesToday} sub="Hoje" />
        <StatCard icon="🔥" label="Sequência" value={`${stats.streak}d`} sub="dias consecutivos" color="#e67e22" />
        <StatCard icon="⏱" label="Tempo total" value={stats.totalTime} sub="de leitura" color="#9b59b6" />
        <StatCard icon="📚" label="Este mês" value={stats.thisMonth} sub="livros lidos" color="var(--color-jade-bright)" />
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-ivory)', fontWeight: 600 }}>
              Em leitura
            </h2>
            <button
              onClick={() => navigate('library')}
              style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: 12, cursor: 'pointer' }}
            >
              Ver todos →
            </button>
          </div>
          <BookGrid books={inProgress} />
        </section>
      )}

      {/* Recent */}
      {recentBooks.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-ivory)', fontWeight: 600 }}>
              Lidos recentemente
            </h2>
            <button
              onClick={() => navigate('recents')}
              style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: 12, cursor: 'pointer' }}
            >
              Ver todos →
            </button>
          </div>
          <BookGrid books={recentBooks} />
        </section>
      )}

      {books.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ivory-faint)' }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'float 3s ease infinite' }}>📖</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8, color: 'var(--color-ivory-dim)' }}>
            Sua jornada literária começa aqui
          </div>
          <div style={{ fontSize: 13 }}>Importe PDFs e EPUBs para começar a ler</div>
        </div>
      )}
    </div>
  );
}
