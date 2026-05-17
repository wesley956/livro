import { useState } from 'react';
import { useApp } from '../../stores/AppContext';
import type { UserProfile } from '../../types';

const AVATARS = ['👤', '🧑‍🎓', '👩‍💼', '🧙', '🦊', '🐉', '🌸', '⚔️'];

export function SettingsSection() {
  const { state, dispatch, updatePrefs, setProfile, addToast } = useApp();
  const { prefs, sidebarCollapsed, userProfile } = state;
  const [profile, setLocalProfile] = useState<UserProfile>(userProfile);

  const handleSaveProfile = () => {
    setProfile(profile);
    addToast('success', 'Perfil atualizado!');
  };

  return (
    <div className="section-enter" style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--color-ivory)', marginBottom: 24 }}>
        Configurações
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>

        {/* Profile */}
        <Section title="Perfil de Usuário" icon="👤">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-jade) 0%, #0a3326 100%)',
              border: '2px solid rgba(200,169,110,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>
              {AVATARS[profile.avatarIndex] ?? '👤'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ivory)' }}>{profile.name || 'Leitor'}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)' }}>{profile.email || 'Sem email'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {AVATARS.map((av, i) => (
              <button
                key={i}
                onClick={() => setLocalProfile(p => ({ ...p, avatarIndex: i }))}
                aria-label={`Avatar ${av}`}
                style={{
                  width: 40, height: 40, borderRadius: '50%', fontSize: 20,
                  border: profile.avatarIndex === i ? '2px solid var(--color-gold)' : '1px solid rgba(200,169,110,0.15)',
                  background: profile.avatarIndex === i ? 'rgba(200,169,110,0.15)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {av}
              </button>
            ))}
          </div>

          <input
            value={profile.name}
            onChange={e => setLocalProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="Seu nome"
            aria-label="Nome do usuário"
            style={inputStyle}
          />
          <input
            value={profile.email}
            onChange={e => setLocalProfile(p => ({ ...p, email: e.target.value }))}
            placeholder="Email (apenas local)"
            aria-label="Email"
            style={{ ...inputStyle, marginTop: 8 }}
          />
          <button onClick={handleSaveProfile} style={btnStyle}>
            Salvar perfil
          </button>
        </Section>

        {/* Appearance */}
        <Section title="Aparência" icon="🎨">
          <Row label="Modo escuro" desc="Tema carbon/jade">
            <Toggle
              value={prefs.darkMode}
              onChange={v => updatePrefs({ darkMode: v })}
              ariaLabel="Modo escuro"
            />
          </Row>
          <Row label="Menu lateral recolhido">
            <Toggle
              value={sidebarCollapsed}
              onChange={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              ariaLabel="Recolher menu"
            />
          </Row>
        </Section>

        {/* Reading preferences */}
        <Section title="Leitura" icon="📖">
          <Row label={`Tamanho da fonte: ${prefs.fontSize}px`}>
            <input
              type="range" min={12} max={28} value={prefs.fontSize}
              onChange={e => updatePrefs({ fontSize: Number(e.target.value) })}
              aria-label="Tamanho da fonte"
              style={{ width: 120 }}
            />
          </Row>
          <Row label={`Altura da linha: ${prefs.lineHeight}`}>
            <input
              type="range" min={1.2} max={2.5} step={0.1} value={prefs.lineHeight}
              onChange={e => updatePrefs({ lineHeight: Number(e.target.value) })}
              aria-label="Altura da linha"
              style={{ width: 120 }}
            />
          </Row>
          <Row label="Fonte">
            <select
              value={prefs.fontFamily}
              onChange={e => updatePrefs({ fontFamily: e.target.value as typeof prefs.fontFamily })}
              aria-label="Família de fonte"
              style={{
                background: 'var(--color-surface)', border: '1px solid rgba(200,169,110,0.15)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--color-ivory)', fontSize: 12,
              }}
            >
              <option value="garamond">Cormorant Garamond</option>
              <option value="inter">Inter</option>
              <option value="noto">Noto Serif SC</option>
            </select>
          </Row>
          <Row label="Tema de leitura">
            <select
              value={prefs.theme}
              onChange={e => updatePrefs({ theme: e.target.value as typeof prefs.theme })}
              aria-label="Tema de leitura"
              style={{
                background: 'var(--color-surface)', border: '1px solid rgba(200,169,110,0.15)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--color-ivory)', fontSize: 12,
              }}
            >
              <option value="jade">Jade (padrão)</option>
              <option value="paper">Papel</option>
              <option value="dark-paper">Papel escuro</option>
              <option value="night">Noite</option>
            </select>
          </Row>
        </Section>

        {/* About */}
        <Section title="Sobre" icon="ℹ">
          <div style={{ fontSize: 13, color: 'var(--color-ivory-faint)', lineHeight: 1.8 }}>
            <div><strong style={{ color: 'var(--color-ivory)' }}>Lume Reader</strong> v2.0</div>
            <div>Leitor digital premium com suporte a PDF e EPUB.</div>
            <div>Estética chinesa moderna · React 19 · Vite 7 · Tailwind 4</div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid rgba(200,169,110,0.1)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(200,169,110,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--color-ivory)', fontWeight: 500 }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--color-ivory)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--color-ivory-faint)' }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, ariaLabel }: { value: boolean; onChange: (v: boolean) => void; ariaLabel: string }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? 'var(--color-jade-bright)' : 'rgba(200,169,110,0.15)',
        position: 'relative', transition: 'background 0.3s', flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left 0.3s',
      }} />
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(200,169,110,0.04)',
  border: '1px solid rgba(200,169,110,0.15)',
  borderRadius: 8, padding: '8px 12px',
  color: 'var(--color-ivory)', fontSize: 13,
  fontFamily: 'var(--font-sans)', outline: 'none',
};

const btnStyle: React.CSSProperties = {
  marginTop: 12, padding: '8px 18px', borderRadius: 8,
  background: 'rgba(46,204,138,0.15)',
  border: '1px solid rgba(46,204,138,0.3)',
  color: '#2ecc8a', cursor: 'pointer', fontSize: 13,
};
