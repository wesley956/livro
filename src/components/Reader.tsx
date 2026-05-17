import React, { useState } from 'react';
import { ReaderLandscape, LotusOrnament, GoldDivider, CloudOrnament } from './decorative/ChineseSVGs';

interface ReaderProps {
  onBack: () => void;
}

const chapters = [
  { num: 6, title: 'A Arte de Soltar', progress: 54 },
  { num: 7, title: 'Ecos do Passado', progress: 58 },
  { num: 8, title: 'O Silêncio Entre Montanhas', progress: 64, current: true },
  { num: 9, title: 'O Caminho sem Rótulos', progress: 72 },
  { num: 10, title: 'A Luz que Não se Apaga', progress: null },
];

const Reader: React.FC<ReaderProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'marcadores' | 'notas'>('marcadores');
  const [fontSize, setFontSize] = useState(18);
  const [progress] = useState(64);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: '#0a090c' }}
    >
      {/* ── TOP BAR ── */}
      <header
        className="flex items-center px-6 shrink-0 z-20"
        style={{
          height: '56px',
          background: 'rgba(10,9,12,0.97)',
          borderBottom: '1px solid rgba(200,169,110,0.08)',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mr-4 transition-all duration-200 hover:opacity-80"
          style={{ color: '#c8a96e' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="font-inter text-sm" style={{ fontWeight: 400 }}>Biblioteca</span>
          <CloudOrnament className="opacity-40 ml-1" />
        </button>

        {/* Book title center */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <CloudOrnament className="text-yellow-700/40 scale-x-[-1]" />
          <span
            className="font-garamond text-lg"
            style={{ color: '#e8dcc8', fontWeight: 500, letterSpacing: '0.03em' }}
          >
            O Caminho do Vazio
          </span>
          <CloudOrnament className="text-yellow-700/40" />
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              ),
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              ),
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              ),
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              ),
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                </svg>
              ),
            },
          ].map((btn, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/5"
              style={{
                width: '36px',
                height: '36px',
                color: 'rgba(200,169,110,0.6)',
              }}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT LANDSCAPE DECORATION ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: '190px' }}
        >
          <ReaderLandscape className="absolute inset-0 w-full h-full" />
          {/* Fade top */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: '60px',
              background: 'linear-gradient(to bottom, #0a090c, transparent)',
            }}
          />
          {/* Fade right */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, transparent 20%, rgba(10,9,12,0.95) 100%)',
            }}
          />
          {/* Fade bottom */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '80px',
              background: 'linear-gradient(to top, #0a090c, transparent)',
            }}
          />
          {/* Floating text ornament */}
          <div
            className="absolute bottom-24 left-4 font-noto-serif"
            style={{
              color: 'rgba(200,169,110,0.2)',
              fontSize: '28px',
              letterSpacing: '4px',
              writingMode: 'vertical-rl',
              lineHeight: 1.4,
            }}
          >
            靜
          </div>
          <div
            className="absolute bottom-12 left-10 font-noto-serif"
            style={{
              color: 'rgba(200,169,110,0.15)',
              fontSize: '22px',
              letterSpacing: '4px',
              writingMode: 'vertical-rl',
            }}
          >
            寂
          </div>
        </div>

        {/* ── READING PANEL ── */}
        <div
          className="flex-1 flex items-start justify-center py-6 px-4 overflow-y-auto"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div
            className="reading-panel relative rounded-2xl w-full"
            style={{
              maxWidth: '720px',
              minHeight: '580px',
              padding: '56px 68px',
            }}
          >
            {/* Panel corner ornaments */}
            <div className="panel-corner panel-corner-tl" />
            <div className="panel-corner panel-corner-tr" />
            <div className="panel-corner panel-corner-bl" />
            <div className="panel-corner panel-corner-br" />

            {/* Inner gold corners (smaller) */}
            <div
              className="absolute"
              style={{
                top: '20px',
                left: '20px',
                width: '14px',
                height: '14px',
                borderTop: '1px solid rgba(200,169,110,0.25)',
                borderLeft: '1px solid rgba(200,169,110,0.25)',
              }}
            />
            <div
              className="absolute"
              style={{
                top: '20px',
                right: '20px',
                width: '14px',
                height: '14px',
                borderTop: '1px solid rgba(200,169,110,0.25)',
                borderRight: '1px solid rgba(200,169,110,0.25)',
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: '20px',
                left: '20px',
                width: '14px',
                height: '14px',
                borderBottom: '1px solid rgba(200,169,110,0.25)',
                borderLeft: '1px solid rgba(200,169,110,0.25)',
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: '20px',
                right: '20px',
                width: '14px',
                height: '14px',
                borderBottom: '1px solid rgba(200,169,110,0.25)',
                borderRight: '1px solid rgba(200,169,110,0.25)',
              }}
            />

            {/* Lotus ornament header */}
            <div className="flex justify-center mb-4">
              <LotusOrnament size={28} className="text-yellow-700/40" />
            </div>

            {/* Divider */}
            <GoldDivider className="mb-6" />

            {/* Chapter title */}
            <h1
              className="font-garamond text-center mb-2"
              style={{
                color: '#f0e8d8',
                fontSize: `${fontSize + 8}px`,
                fontWeight: 600,
                letterSpacing: '0.01em',
                lineHeight: 1.3,
              }}
            >
              Capítulo 8 — O Silêncio Entre Montanhas
            </h1>

            {/* Chapter subtitle divider */}
            <GoldDivider className="mt-4 mb-8" />

            {/* Reading text */}
            <div className="reading-text" style={{ fontSize: `${fontSize}px` }}>
              <p className="mb-6">
                As montanhas não suportam pressa. Elas erguem-se não para competir com o céu,
                mas para permanecer. Entre seus picos, o vento não grita — sussurra.
              </p>

              <p className="mb-6">
                Foi ali que ele aprendeu a ouvir o que não tinha som.
                <br />
                O mestre não lhe ensinou palavras. Apenas o conduziu ao amanhecer e o deixou
                diante do vale coberto de névoa. "Fique aqui", disse. "Quando o pensamento se
                calar, talvez você compreenda."
              </p>

              <p className="mb-6">
                Os primeiros dias foram agitados. A mente, como um macaco inquieto, saltava de
                lembrança em lembrança. Planos, medos, desejos — todos disputavam atenção.
                Mas ele permaneceu. Sentou-se como a pedra. Respirou como a montanha.
              </p>

              <p className="mb-6">
                Com o tempo, percebeu que o silêncio não era vazio. Era pleno. Nele, o canto de
                um pássaro, o farfalhar das folhas e o bater do próprio coração se tornavam um só.
                O mundo não precisava ser consertado. Bastava ser compreendido.
              </p>

              <p className="mb-6">
                Quando voltou ao vilarejo, não trouxe respostas. Trouxe presença.
                <br />
                E foi assim que começou a ensinar.
              </p>
            </div>

            {/* Bottom ornamental footer */}
            <div className="mt-8">
              <GoldDivider />
              <div className="flex justify-center mt-3">
                {/* Chinese ornamental geometric mark */}
                <svg width="48" height="20" viewBox="0 0 48 20" fill="none" opacity="0.35">
                  <rect x="0" y="4" width="12" height="12" rx="1" stroke="rgba(200,169,110,1)" strokeWidth="0.8" fill="none" />
                  <rect x="2" y="6" width="8" height="8" rx="0.5" stroke="rgba(200,169,110,1)" strokeWidth="0.4" fill="none" />
                  <line x1="18" y1="10" x2="30" y2="10" stroke="rgba(200,169,110,1)" strokeWidth="0.8" />
                  <circle cx="24" cy="10" r="2" fill="rgba(200,169,110,0.5)" />
                  <rect x="36" y="4" width="12" height="12" rx="1" stroke="rgba(200,169,110,1)" strokeWidth="0.8" fill="none" />
                  <rect x="38" y="6" width="8" height="8" rx="0.5" stroke="rgba(200,169,110,1)" strokeWidth="0.4" fill="none" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{
            width: '300px',
            background: 'linear-gradient(180deg, #111115 0%, #0f0f13 100%)',
            borderLeft: '1px solid rgba(200,169,110,0.08)',
          }}
        >
          {/* Tabs */}
          <div
            className="flex shrink-0"
            style={{ borderBottom: '1px solid rgba(200,169,110,0.1)' }}
          >
            {(['marcadores', 'notas'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-3.5 font-inter text-sm capitalize transition-all duration-200 relative"
                style={{
                  color: activeTab === tab ? '#c8a96e' : 'rgba(200,180,150,0.4)',
                  fontWeight: activeTab === tab ? 500 : 400,
                  letterSpacing: '0.02em',
                  background: 'transparent',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                    style={{
                      width: '32px',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #c0392b, transparent)',
                      borderRadius: '1px',
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin' }}>
            {/* Search chapters */}
            <div
              className="flex items-center gap-2 px-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,169,110,0.1)',
                height: '36px',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.4)" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="font-inter text-xs" style={{ color: 'rgba(200,180,150,0.35)' }}>Buscar capítulos</span>
            </div>

            {/* Add bookmark */}
            <button
              className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,169,110,0.1)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.6)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                <span className="font-inter text-xs" style={{ color: 'rgba(200,180,150,0.55)' }}>Adicionar marcador</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,110,0.4)" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {/* Chapters section */}
            <div>
              {/* Section label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1" style={{ height: '1px', background: 'rgba(200,169,110,0.15)' }} />
                <span className="font-inter text-xs" style={{ color: 'rgba(200,169,110,0.45)', letterSpacing: '0.12em' }}>
                  CAPÍTULOS
                </span>
                <div className="flex-1" style={{ height: '1px', background: 'rgba(200,169,110,0.15)' }} />
              </div>

              {/* Chapter list */}
              <div className="flex flex-col gap-1">
                {chapters.map((ch) => (
                  <div
                    key={ch.num}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
                    style={
                      ch.current
                        ? {
                            background: 'linear-gradient(135deg, #8b1a1a, #6b1010)',
                            boxShadow: '0 2px 12px rgba(139,26,26,0.3)',
                          }
                        : {
                            background: 'transparent',
                          }
                    }
                  >
                    <span
                      className="font-inter text-xs shrink-0"
                      style={{
                        color: ch.current ? 'rgba(240,232,216,0.7)' : 'rgba(200,169,110,0.4)',
                        width: '16px',
                        textAlign: 'right',
                      }}
                    >
                      {ch.num}
                    </span>
                    <span
                      className="font-inter text-xs flex-1 min-w-0 truncate"
                      style={{
                        color: ch.current ? '#f0e8d8' : 'rgba(200,180,150,0.55)',
                        fontWeight: ch.current ? 500 : 400,
                      }}
                    >
                      {ch.title}
                    </span>
                    {ch.current && (
                      <CloudOrnament className="shrink-0 opacity-50" />
                    )}
                    <span
                      className="font-inter text-xs shrink-0"
                      style={{
                        color: ch.current ? 'rgba(240,232,216,0.7)' : 'rgba(200,169,110,0.4)',
                      }}
                    >
                      {ch.progress !== null ? `${ch.progress}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quote card at bottom */}
          <div
            className="shrink-0 m-4 p-4 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #14121a, #110f16)',
              border: '1px solid rgba(200,169,110,0.12)',
            }}
          >
            <div className="flex gap-3 items-start">
              {/* Lotus illustration */}
              <div className="shrink-0">
                <LotusOrnament size={42} className="text-yellow-600/50" />
              </div>
              <div>
                <p
                  className="font-eb-garamond italic text-xs leading-relaxed mb-1.5"
                  style={{ color: 'rgba(200,180,150,0.7)', lineHeight: 1.65 }}
                >
                  A verdadeira sabedoria está em compreender o vazio que nos conecta.
                </p>
                <p className="font-inter text-xs" style={{ color: 'rgba(200,169,110,0.5)', letterSpacing: '0.02em' }}>
                  — Lúcio Mendes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div
        className="shrink-0 flex items-center px-6 gap-4 z-20"
        style={{
          height: '60px',
          background: 'rgba(10,9,12,0.97)',
          borderTop: '1px solid rgba(200,169,110,0.08)',
        }}
      >
        {/* Dark mode toggle */}
        <button
          className="flex items-center justify-center rounded-xl transition-all duration-200 hover:opacity-80 shrink-0"
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: '#c8a96e',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </button>

        {/* Font size controls */}
        <button
          onClick={() => setFontSize((f) => Math.max(14, f - 1))}
          className="flex items-center justify-center rounded-xl transition-all duration-200 hover:opacity-80 shrink-0"
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: '#c8a96e',
            fontSize: '12px',
            fontFamily: 'Inter',
            fontWeight: 600,
          }}
        >
          Aa-
        </button>
        <button
          onClick={() => setFontSize((f) => Math.min(24, f + 1))}
          className="flex items-center justify-center rounded-xl transition-all duration-200 hover:opacity-80 shrink-0"
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: '#c8a96e',
            fontSize: '12px',
            fontFamily: 'Inter',
            fontWeight: 600,
          }}
        >
          Aa+
        </button>

        {/* Theme */}
        <button
          className="flex items-center gap-2 px-3 rounded-xl transition-all duration-200 hover:opacity-80 shrink-0"
          style={{
            height: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: 'rgba(200,180,150,0.7)',
            fontSize: '12px',
            fontFamily: 'Inter',
          }}
        >
          <div
            className="rounded-full"
            style={{ width: '14px', height: '14px', background: 'radial-gradient(circle, #2d8a6e, #1a5c48)' }}
          />
          <span>Tema</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Bookmark */}
        <button
          className="flex items-center gap-2 px-3 rounded-xl transition-all duration-200 hover:opacity-80 shrink-0"
          style={{
            height: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: 'rgba(200,180,150,0.7)',
            fontSize: '12px',
            fontFamily: 'Inter',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          <span>Marcador</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Divider */}
        <div className="shrink-0" style={{ width: '1px', height: '28px', background: 'rgba(200,169,110,0.1)' }} />

        {/* Progress area */}
        <div className="flex flex-col items-center shrink-0" style={{ minWidth: '80px' }}>
          <span
            className="font-inter font-semibold"
            style={{ color: '#2ecc8a', fontSize: '16px', lineHeight: 1 }}
          >
            {progress}%
          </span>
          <span className="font-inter" style={{ color: 'rgba(200,180,150,0.45)', fontSize: '9px', letterSpacing: '0.08em', marginTop: '2px' }}>
            Progresso da leitura
          </span>
        </div>

        {/* Progress slider */}
        <div className="flex-1 flex items-center min-w-0">
          <div className="flex-1 relative rounded-full" style={{ height: '4px', background: 'rgba(200,169,110,0.12)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #1a7a58, #2ecc8a)',
              }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                background: 'linear-gradient(135deg, #8b1a1a, #6b1010)',
                border: '2px solid rgba(200,169,110,0.4)',
                boxShadow: '0 0 8px rgba(139,26,26,0.5)',
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0" style={{ width: '1px', height: '28px', background: 'rgba(200,169,110,0.1)' }} />

        {/* Page info */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-inter" style={{ color: 'rgba(200,180,150,0.5)', fontSize: '12px' }}>Página</span>
          <span className="font-inter font-medium" style={{ color: '#c8a96e', fontSize: '12px' }}>32</span>
          <span className="font-inter" style={{ color: 'rgba(200,180,150,0.35)', fontSize: '12px' }}>/</span>
          <span className="font-inter" style={{ color: 'rgba(200,180,150,0.5)', fontSize: '12px' }}>256</span>
        </div>

        {/* Navigation */}
        <button
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: 'rgba(200,169,110,0.5)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          className="flex items-center justify-center rounded-xl shrink-0 transition-all hover:opacity-90"
          style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #8b1a1a, #6b1010)',
            border: '1px solid rgba(200,169,110,0.2)',
            color: '#f0e8d8',
            boxShadow: '0 4px 16px rgba(139,26,26,0.4)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Settings */}
        <button
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,169,110,0.12)',
            color: 'rgba(200,169,110,0.5)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Reader;
