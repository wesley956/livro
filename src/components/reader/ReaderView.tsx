import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../stores/AppContext';
import { ReaderView as EnhancedReaderView } from '../EnhancedReaderView';

export function ReaderView() {
  const { state, navigate, getFile } = useApp();
  const { currentBookId, books } = state;

  const book = useMemo(
    () => books.find(item => item.id === currentBookId),
    [books, currentBookId],
  );

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!book) return undefined;

    const activeBook = book;
    let cancelled = false;
    let localUrl: string | null = null;

    setFileUrl(null);
    setError(null);

    async function loadFile() {
      try {
        const buffer = await getFile(activeBook.id);

        if (!buffer || buffer.byteLength === 0) {
          throw new Error('Arquivo não encontrado no aparelho. Importe o livro novamente uma vez.');
        }

        const blob = new Blob([buffer.slice(0)], {
          type: activeBook.format === 'PDF' ? 'application/pdf' : 'application/epub+zip',
        });

        localUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setFileUrl(localUrl);
        }
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : 'Não foi possível carregar este livro.';

        if (!cancelled) {
          setError(message);
        }
      }
    }

    void loadFile();

    return () => {
      cancelled = true;

      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [book, getFile]);

  if (!book) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-carbon)',
          color: 'var(--color-ivory)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>
            Nenhum livro selecionado
          </h1>
          <button
            type="button"
            onClick={() => navigate('library')}
            style={{
              marginTop: 16,
              border: '1px solid rgba(200,169,110,0.32)',
              borderRadius: 14,
              background: 'rgba(139,26,26,0.45)',
              color: 'var(--color-ivory)',
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Voltar para biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-carbon)',
          color: 'var(--color-ivory)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            border: '1px solid rgba(200,169,110,0.24)',
            borderRadius: 24,
            padding: 28,
            background: 'rgba(20,20,24,0.86)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-gold)' }}>
            Erro ao abrir livro
          </h1>
          <p style={{ color: 'var(--color-ivory-dim)', lineHeight: 1.6 }}>{error}</p>
          <button
            type="button"
            onClick={() => navigate('library')}
            style={{
              marginTop: 16,
              border: '1px solid rgba(200,169,110,0.32)',
              borderRadius: 14,
              background: 'rgba(139,26,26,0.45)',
              color: 'var(--color-ivory)',
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Voltar para biblioteca
          </button>
        </div>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-carbon)',
          color: 'var(--color-ivory)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div>Carregando livro...</div>
        </div>
      </div>
    );
  }

  return (
    <EnhancedReaderView
      book={{
        id: book.id,
        title: book.title,
        author: book.author,
        type: book.format === 'EPUB' ? 'epub' : 'pdf',
        fileUrl,
        cover: book.cover ?? undefined,
      }}
      onClose={() => navigate('library')}
    />
  );
}
