import { useState, useRef, useCallback } from 'react';
import { useApp } from '../../stores/AppContext';
import { validateFile } from '../../utils/fileUtils';

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const { importBook } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; size: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Arquivo inválido');
      return;
    }
    setError(null);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setPreview({ name: file.name, size: `${sizeMB} MB` });
    setImporting(true);
    setProgress(10);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 85));
    }, 300);

    try {
      await importBook(file);
      setProgress(100);
      setTimeout(() => { onClose(); }, 600);
    } catch (e) {
      setError('Erro ao importar o arquivo. Tente novamente.');
      setImporting(false);
    } finally {
      clearInterval(interval);
    }
  }, [importBook, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Importar livro"
        style={{
          background: 'var(--color-panel)',
          border: '1px solid rgba(200,169,110,0.2)',
          borderRadius: 'var(--radius-modal)',
          padding: '32px',
          maxWidth: 480, width: '100%',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 2 }}>
              Importar Livro
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>PDF ou EPUB · máx. 100MB</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', color: 'var(--color-ivory-faint)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Drop zone */}
        {!importing && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Área de arrastar e soltar arquivo"
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-gold)' : 'rgba(200,169,110,0.25)'}`,
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: isDragging ? 'rgba(200,169,110,0.06)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--color-ivory)', marginBottom: 6 }}>
              Arraste seu arquivo aqui
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)', marginBottom: 16 }}>
              ou clique para selecionar
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-gold)', opacity: 0.7 }}>
              .PDF · .EPUB
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.epub"
          style={{ display: 'none' }}
          onChange={handleChange}
          aria-hidden="true"
        />

        {/* Progress */}
        {importing && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)', marginBottom: 8 }}>
              {preview?.name}
            </div>
            <div style={{ height: 4, background: 'rgba(200,169,110,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, var(--color-jade-bright), var(--color-gold))',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-gold)' }}>
              {progress < 100 ? 'Processando...' : 'Concluído! ✓'}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)',
            color: '#e74c3c', fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Actions */}
        {!importing && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'rgba(200,169,110,0.06)',
                border: '1px solid rgba(200,169,110,0.15)',
                color: 'var(--color-ivory-faint)', cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 2, padding: '10px 0', borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
                border: '1px solid rgba(200,169,110,0.25)',
                color: 'var(--color-ivory)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              Selecionar arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
