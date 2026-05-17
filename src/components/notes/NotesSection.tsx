import { useState, useCallback } from 'react';
import { useApp } from '../../stores/AppContext';
import type { Note, NoteTag } from '../../types';

const TAG_COLORS: Record<NoteTag, string> = {
  'Reflexão': '#9b59b6',
  'Favorito': '#c8a96e',
  'Ideia': '#3498db',
  'Importante': '#e74c3c',
  'Nova nota': '#2ecc8a',
};

const NOTE_COLORS = ['#c8a96e', '#2ecc8a', '#9b59b6', '#3498db', '#e74c3c'];
const TAGS: NoteTag[] = ['Nova nota', 'Reflexão', 'Favorito', 'Ideia', 'Importante'];

function NoteCard({ note }: { note: Note }) {
  const { updateNote, deleteNote, state } = useApp();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const book = state.books.find(b => b.id === note.bookId);
  const tagColor = TAG_COLORS[note.tag] ?? '#c8a96e';

  const save = useCallback(() => {
    if (text.trim()) {
      updateNote({ ...note, text: text.trim() });
      setEditing(false);
    }
  }, [text, note, updateNote]);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${note.color}30`,
      borderLeft: `3px solid ${note.color}`,
      borderRadius: 12,
      padding: 16,
      position: 'relative',
    }}>
      {/* Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          color: tagColor, padding: '2px 8px',
          background: `${tagColor}15`, borderRadius: 20,
          textTransform: 'uppercase',
        }}>
          {note.tag}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setEditing(e => !e)}
            aria-label="Editar nota"
            style={{ background: 'none', border: 'none', color: 'var(--color-ivory-faint)', cursor: 'pointer', fontSize: 13 }}
          >
            ✎
          </button>
          <button
            onClick={() => { if (confirm('Remover esta nota?')) deleteNote(note.id); }}
            aria-label="Remover nota"
            style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 13 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Text */}
      {editing ? (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width: '100%', minHeight: 80, resize: 'vertical',
              background: 'rgba(200,169,110,0.04)',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: 6, padding: '8px 10px',
              color: 'var(--color-ivory)', fontSize: 13,
              fontFamily: 'var(--font-sans)', outline: 'none',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={save}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                background: 'rgba(46,204,138,0.15)', border: '1px solid rgba(46,204,138,0.3)',
                color: '#2ecc8a',
              }}
            >
              Salvar
            </button>
            <button
              onClick={() => { setEditing(false); setText(note.text); }}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                background: 'none', border: '1px solid rgba(200,169,110,0.15)',
                color: 'var(--color-ivory-faint)',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--color-ivory-dim)', lineHeight: 1.6, margin: 0 }}>
          {note.text}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--color-ivory-faint)' }}>
        <span>{book ? `📖 ${book.title.slice(0, 30)}${book.title.length > 30 ? '…' : ''}` : 'Nota avulsa'}</span>
        <span>{note.pageNumber > 0 ? `p. ${note.pageNumber}` : ''}</span>
      </div>
    </div>
  );
}

export function NotesSection() {
  const { state, addNote } = useApp();
  const { notes, books } = state;
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState<NoteTag>('Nova nota');
  const [newColor, setNewColor] = useState(NOTE_COLORS[0]!);
  const [newBookId, setNewBookId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = useCallback(() => {
    if (!newText.trim()) return;
    addNote({
      bookId: newBookId || null,
      pageNumber: 0,
      text: newText.trim(),
      tag: newTag,
      color: newColor,
    });
    setNewText('');
    setShowForm(false);
  }, [newText, newTag, newColor, newBookId, addNote]);

  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 2 }}>
            Anotações
          </h2>
          <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>
            {notes.length} nota{notes.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
            border: '1px solid rgba(200,169,110,0.25)',
            color: 'var(--color-ivory)',
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
          }}
        >
          + Nova nota
        </button>
      </div>

      {/* New note form */}
      {showForm && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid rgba(200,169,110,0.2)',
          borderRadius: 14, padding: 20, marginBottom: 20,
          animation: 'scaleIn 0.2s ease',
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--color-gold)', marginBottom: 16 }}>
            Nova anotação
          </h3>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Escreva sua nota..."
            aria-label="Texto da nota"
            style={{
              width: '100%', minHeight: 100, resize: 'vertical',
              background: 'rgba(200,169,110,0.04)',
              border: '1px solid rgba(200,169,110,0.2)',
              borderRadius: 8, padding: '10px 12px',
              color: 'var(--color-ivory)', fontSize: 14,
              fontFamily: 'var(--font-sans)', outline: 'none',
              marginBottom: 12,
            }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {/* Book selector */}
            <select
              value={newBookId}
              onChange={e => setNewBookId(e.target.value)}
              aria-label="Associar ao livro"
              style={{
                flex: '1 1 180px',
                background: 'var(--color-surface2)',
                border: '1px solid rgba(200,169,110,0.15)',
                borderRadius: 8, padding: '8px 12px',
                color: 'var(--color-ivory)', fontSize: 12, outline: 'none',
              }}
            >
              <option value="">Nota avulsa</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.title.slice(0, 40)}</option>
              ))}
            </select>

            {/* Tag selector */}
            <select
              value={newTag}
              onChange={e => setNewTag(e.target.value as NoteTag)}
              aria-label="Tag da nota"
              style={{
                background: 'var(--color-surface2)',
                border: '1px solid rgba(200,169,110,0.15)',
                borderRadius: 8, padding: '8px 12px',
                color: 'var(--color-ivory)', fontSize: 12, outline: 'none',
              }}
            >
              {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Color picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--color-ivory-faint)', marginRight: 4 }}>Cor:</span>
            {NOTE_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                aria-label={`Cor ${c}`}
                style={{
                  width: 20, height: 20, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              style={{
                flex: 2, padding: '10px 0', borderRadius: 8,
                background: newText.trim() ? 'rgba(46,204,138,0.15)' : 'rgba(200,169,110,0.05)',
                border: newText.trim() ? '1px solid rgba(46,204,138,0.3)' : '1px solid rgba(200,169,110,0.1)',
                color: newText.trim() ? '#2ecc8a' : 'var(--color-ivory-faint)',
                cursor: newText.trim() ? 'pointer' : 'not-allowed', fontSize: 13,
              }}
            >
              Salvar nota
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                background: 'none', border: '1px solid rgba(200,169,110,0.12)',
                color: 'var(--color-ivory-faint)', cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {sortedNotes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-ivory-faint)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✎</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-ivory-dim)', marginBottom: 6 }}>
            Nenhuma anotação ainda
          </div>
          <div style={{ fontSize: 13 }}>Crie sua primeira nota enquanto lê</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {sortedNotes.map(note => <NoteCard key={note.id} note={note} />)}
      </div>
    </div>
  );
}
