import { useApp } from '../../stores/AppContext';

const AVATARS = ['👤', '🧑‍🎓', '👩‍💼', '🧙', '🦊', '🐉', '🌸', '⚔️'];

export function TopBar({ title }: { title: string }) {
  const { state, dispatch } = useApp();
  const { userProfile, toasts } = state;
  const unread = toasts.length;

  return (
    <header
      style={{
        height: 60,
        background: 'var(--color-panel)',
        borderBottom: '1px solid rgba(200,169,110,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Page title */}
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 20,
        fontWeight: 500,
        color: 'var(--color-ivory)',
        letterSpacing: 0.5,
        flex: 1,
      }}>
        {title}
      </h1>

      {/* Search hint */}
      <button
        onClick={() => dispatch({ type: 'OPEN_SEARCH' })}
        aria-label="Busca global (Ctrl+K)"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(200,169,110,0.06)',
          border: '1px solid rgba(200,169,110,0.15)',
          borderRadius: 8,
          padding: '6px 14px',
          color: 'var(--color-ivory-faint)',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.12)';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-ivory-dim)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.06)';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-ivory-faint)';
        }}
      >
        <span>🔍</span>
        <span>Buscar...</span>
        <span style={{
          marginLeft: 8,
          background: 'rgba(200,169,110,0.12)',
          border: '1px solid rgba(200,169,110,0.2)',
          borderRadius: 4,
          padding: '1px 6px',
          fontSize: 11,
          fontFamily: 'var(--font-sans)',
        }}>
          ⌘K
        </span>
      </button>

      {/* Notification bell */}
      <button
        aria-label={`Notificações${unread > 0 ? ` (${unread} novas)` : ''}`}
        style={{
          position: 'relative',
          background: 'none', border: 'none',
          color: 'var(--color-ivory-faint)',
          cursor: 'pointer', fontSize: 18, padding: 6, borderRadius: 8,
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-crimson-bright)',
            border: '1.5px solid var(--color-panel)',
          }} />
        )}
      </button>

      {/* User avatar */}
      <div
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
          border: '1.5px solid rgba(200,169,110,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, cursor: 'default',
          flexShrink: 0,
        }}
        title={userProfile.name}
        aria-label={`Perfil de ${userProfile.name}`}
      >
        {AVATARS[userProfile.avatarIndex] ?? '👤'}
      </div>
    </header>
  );
}
