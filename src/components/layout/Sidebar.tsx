import { useApp } from '../../stores/AppContext';
import type { Route } from '../../types';

const NAV_ITEMS: Array<{ route: Route; icon: string; label: string }> = [
  { route: 'home', icon: '⌂', label: 'Início' },
  { route: 'library', icon: '▣', label: 'Biblioteca' },
  { route: 'favorites', icon: '♡', label: 'Favoritos' },
  { route: 'recents', icon: '◷', label: 'Recentes' },
  { route: 'notes', icon: '✎', label: 'Anotações' },
  { route: 'settings', icon: '⚙', label: 'Configurações' },
];

export function Sidebar() {
  const { state, navigate, dispatch } = useApp();
  const { sidebarCollapsed, route } = state;

  return (
    <nav
      role="navigation"
      aria-label="Navegação principal"
      style={{
        width: sidebarCollapsed ? 64 : 220,
        minWidth: sidebarCollapsed ? 64 : 220,
        height: '100%',
        background: 'var(--color-panel)',
        borderRight: '1px solid rgba(200,169,110,0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed ? '24px 0' : '24px 20px',
        borderBottom: '1px solid rgba(200,169,110,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
          border: '1px solid rgba(200,169,110,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          書
        </div>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--color-gold)', letterSpacing: 1 }}>
              Lume
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-ivory-faint)', letterSpacing: 2 }}>
              READER
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = route === item.route;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: sidebarCollapsed ? '12px 0' : '12px 20px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(200,169,110,0.12)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--color-gold)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: active ? 'var(--color-gold)' : 'var(--color-ivory-faint)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(200,169,110,0.06)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-ivory-dim)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-ivory-faint)';
                }
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, letterSpacing: 0.5 }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: collapse button */}
      <div style={{ padding: '16px 0', borderTop: '1px solid rgba(200,169,110,0.08)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
          style={{
            background: 'none', border: 'none', color: 'var(--color-ivory-faint)',
            cursor: 'pointer', fontSize: 18, padding: '6px 16px', borderRadius: 8,
            transition: 'color 0.2s',
          }}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>
    </nav>
  );
}
