import { useEffect, useMemo, useState } from 'react';
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function Sidebar() {
  const { state, navigate, dispatch } = useApp();
  const { sidebarCollapsed, route } = state;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      dispatch({ type: 'SET_SIDEBAR', collapsed: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const mobileDrawerOpen = isMobile && !sidebarCollapsed;

  const navStyle = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      return {
        width: 276,
        minWidth: 276,
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1002,
        background: 'rgba(20,20,24,0.98)',
        borderRight: '1px solid rgba(200,169,110,0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '26px 0 80px rgba(0,0,0,0.5)',
        transform: mobileDrawerOpen ? 'translateX(0)' : 'translateX(-105%)',
        transition: 'transform 0.28s ease',
      };
    }

    return {
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
    };
  }, [isMobile, mobileDrawerOpen, sidebarCollapsed]);

  const showLabels = isMobile || !sidebarCollapsed;

  const handleNavigate = (itemRoute: Route) => {
    navigate(itemRoute);
    if (isMobile) dispatch({ type: 'SET_SIDEBAR', collapsed: true });
  };

  return (
    <>
      {isMobile && (
        <button
          className="mobile-menu-fab"
          onClick={() => dispatch({ type: 'SET_SIDEBAR', collapsed: !sidebarCollapsed })}
          aria-label={mobileDrawerOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileDrawerOpen ? '×' : '☰'}
        </button>
      )}

      {isMobile && mobileDrawerOpen && (
        <button
          className="mobile-menu-backdrop"
          aria-label="Fechar menu"
          onClick={() => dispatch({ type: 'SET_SIDEBAR', collapsed: true })}
        />
      )}

      <nav role="navigation" aria-label="Navegação principal" style={navStyle}>
        <div style={{
          padding: showLabels ? '24px 20px' : '24px 0',
          borderBottom: '1px solid rgba(200,169,110,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: showLabels ? 'flex-start' : 'center',
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
          {showLabels && (
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

        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = route === item.route;
            return (
              <button
                key={item.route}
                onClick={() => handleNavigate(item.route)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                title={!showLabels ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: showLabels ? '12px 20px' : '12px 0',
                  justifyContent: showLabels ? 'flex-start' : 'center',
                  background: active ? 'rgba(200,169,110,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '2px solid var(--color-gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: active ? 'var(--color-gold)' : 'var(--color-ivory-faint)',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {showLabels && (
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, letterSpacing: 0.5 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px 0', borderTop: '1px solid rgba(200,169,110,0.08)', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
            style={{
              background: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.14)',
              color: 'var(--color-ivory-dim)',
              cursor: 'pointer',
              fontSize: 18,
              padding: isMobile ? '8px 18px' : '6px 16px',
              borderRadius: 999,
              transition: 'color 0.2s',
            }}
          >
            {isMobile ? (mobileDrawerOpen ? 'Fechar menu' : 'Abrir menu') : (sidebarCollapsed ? '›' : '‹')}
          </button>
        </div>
      </nav>
    </>
  );
}
