import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { useApp } from '../../stores/AppContext';
import { formatFileSize, validateFile, validateFileMagic } from '../../utils/fileUtils';

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const { importBook } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; size: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        setError(validation.error ?? 'Arquivo inválido.');
        setWarning(null);
        return;
      }

      const magicValidation = await validateFileMagic(file);

      if (!magicValidation.valid) {
        setError(magicValidation.error ?? 'Arquivo inválido ou corrompido.');
        setWarning(null);
        return;
      }

      setError(null);
      setWarning(magicValidation.warning ?? null);
      setPreview({ name: file.name, size: formatFileSize(file.size) });
      setImporting(true);
      setProgress(8);

      const interval = window.setInterval(() => {
        setProgress(value => Math.min(value + 12, 88));
      }, 220);

      try {
        await importBook(file);
        setProgress(100);

        window.setTimeout(() => {
          onClose();
        }, 500);
      } catch (unknownError) {
        const message =
          unknownError instanceof Error
            ? unknownError.message
            : 'Erro ao importar o arquivo. Tente novamente.';

        setError(message);
        setImporting(false);
      } finally {
        window.clearInterval(interval);
      }
    },
    [importBook, onClose],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];

      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(12px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Importar livro"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid rgba(200,169,110,0.24)',
          borderRadius: 'var(--radius-modal)',
          padding: 28,
          maxWidth: 520,
          width: '100%',
          color: 'var(--color-ivory)',
          boxShadow: '0 28px 100px rgba(0,0,0,0.48)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 30,
                color: 'var(--color-gold)',
              }}
            >
              Importar Livro
            </h2>

            <p style={{ margin: '6px 0 0', color: 'var(--color-ivory-dim)', fontSize: 14 }}>
              PDF ou EPUB · até 200MB · salvo no aparelho
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              border: '1px solid rgba(200,169,110,0.22)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--color-ivory)',
              cursor: 'pointer',
              fontSize: 22,
            }}
          >
            ×
          </button>
        </div>

        {!importing && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={event => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Área de arrastar e soltar arquivo"
            onKeyDown={event => {
              if (event.key === 'Enter') fileRef.current?.click();
            }}
            style={{
              border: `2px dashed ${
                isDragging ? 'var(--color-gold)' : 'rgba(200,169,110,0.28)'
              }`,
              borderRadius: 20,
              padding: '46px 22px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isDragging ? 'rgba(200,169,110,0.08)' : 'rgba(255,255,255,0.025)',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, marginBottom: 6 }}>
              Arraste seu arquivo aqui
            </div>
            <div style={{ color: 'var(--color-ivory-dim)', fontSize: 14 }}>
              ou clique para selecionar PDF / EPUB
            </div>
          </div>
        )}

        {importing && (
          <div
            style={{
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: 20,
              padding: 22,
              background: 'rgba(255,255,255,0.035)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{preview?.name}</div>
            <div style={{ color: 'var(--color-ivory-dim)', fontSize: 13, marginBottom: 16 }}>
              {preview?.size} · {progress < 100 ? 'Processando...' : 'Concluído! ✓'}
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                overflow: 'hidden',
                background: 'rgba(200,169,110,0.16)',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-jade-bright), var(--color-gold))',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        )}

        {warning && (
          <div
            style={{
              marginTop: 14,
              border: '1px solid rgba(200,169,110,0.28)',
              borderRadius: 14,
              padding: 12,
              background: 'rgba(200,169,110,0.08)',
              color: 'var(--color-gold)',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            ⚠ {warning}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 14,
              border: '1px solid rgba(255,90,90,0.28)',
              borderRadius: 14,
              padding: 12,
              background: 'rgba(139,26,26,0.22)',
              color: '#ffb4b4',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {!importing && (
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 14,
                background: 'transparent',
                border: '1px solid rgba(200,169,110,0.22)',
                color: 'var(--color-ivory-dim)',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 2,
                padding: '12px 0',
                borderRadius: 14,
                background: 'linear-gradient(135deg, var(--color-jade), #0a3326)',
                border: '1px solid rgba(200,169,110,0.32)',
                color: 'var(--color-ivory)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Selecionar arquivo
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
