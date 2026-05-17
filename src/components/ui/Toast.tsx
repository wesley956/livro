
import { useApp } from '../../stores/AppContext';
import type { ToastMessage } from '../../types';

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { dispatch } = useApp();
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };
  const colors: Record<string, string> = {
    success: '#2ecc8a',
    error: '#e74c3c',
    info: '#c8a96e',
    warning: '#f39c12',
  };
  const color = colors[toast.type] ?? '#c8a96e';

  return (
    <div
      style={{
        background: '#1a1a20',
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        animation: 'slideInRight 0.25s ease',
        minWidth: 260,
        maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ color, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {icons[toast.type]}
      </span>
      <span style={{ color: '#f0e8d8', fontSize: 13, flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
        aria-label="Fechar notificação"
        style={{ background: 'none', border: 'none', color: 'rgba(240,232,216,0.4)', cursor: 'pointer', fontSize: 14, padding: 2 }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { state } = useApp();

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}
    >
      {state.toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
