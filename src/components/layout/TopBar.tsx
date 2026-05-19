import { useMemo, useState } from 'react';
import { useApp } from '../../stores/AppContext';
import { ImportModal } from '../modals/ImportModal';

interface TopBarProps {
  title: string;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function TopBar({ title }: TopBarProps) {
  const { state, dispatch } = useApp();
  const [importOpen, setImportOpen] = useState(false);

  const subtitle = useMemo(() => {
    const total = state.books.length;
    const reading = state.books.filter(book => book.status === 'reading').length;

    if (total === 0) return 'Sua biblioteca está pronta para receber o primeiro livro.';
    if (reading > 0) return `${reading} leitura${reading > 1 ? 's' : ''} em andamento.`;
    return `${total} livro${total > 1 ? 's' : ''} na biblioteca.`;
  }, [state.books]);

  return (
    <>
      <header className="lume-modern-topbar">
        <div className="lume-modern-topbar-left">
          <button
            type="button"
            className="lume-modern-mobile-menu"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div>
            <span className="lume-modern-greeting">{greeting()}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="lume-modern-topbar-actions">
          <button
            type="button"
            className="lume-modern-search-button"
            onClick={() => dispatch({ type: 'OPEN_SEARCH' })}
          >
            <span>⌕</span>
            <strong>Buscar</strong>
            <kbd>Ctrl K</kbd>
          </button>

          <button
            type="button"
            className="lume-modern-import-button"
            onClick={() => setImportOpen(true)}
          >
            <span>＋</span>
            <strong>Importar</strong>
          </button>
        </div>
      </header>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </>
  );
}
