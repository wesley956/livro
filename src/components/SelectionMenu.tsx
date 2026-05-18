// src/components/SelectionMenu.tsx
// Menu que aparece quando o leitor seleciona texto.
// Oferece: Copiar, Destacar (4 cores) e Anotar.

import React, { useEffect, useRef, useCallback } from "react";
import type { HighlightColor } from "../hooks/useAnnotations";

interface SelectionMenuProps {
  x: number;
  y: number;
  selectedText: string;
  onCopy: () => void;
  onHighlight: (color: HighlightColor) => void;
  onAnnotate: () => void;
  onClose: () => void;
}

const COLORS: { color: HighlightColor; bg: string; label: string }[] = [
  { color: "yellow", bg: "#FACC15", label: "Amarelo" },
  { color: "green",  bg: "#4ADE80", label: "Verde"   },
  { color: "blue",   bg: "#60A5FA", label: "Azul"    },
  { color: "red",    bg: "#F87171", label: "Vermelho" },
];

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  x, y, selectedText, onCopy, onHighlight, onAnnotate, onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Pequeno delay para não fechar imediatamente no mouseup da seleção
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Posição ajustada para não sair da tela
  const adjustedX = Math.min(x, window.innerWidth - 320);
  const adjustedY = y > 80 ? y - 60 : y + 30;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(selectedText).catch(() => {
      // Fallback para browsers sem permissão
      const textarea = document.createElement("textarea");
      textarea.value = selectedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    });
    onCopy();
    onClose();
  }, [selectedText, onCopy, onClose]);

  return (
    <div
      ref={menuRef}
      className="lume-selection-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* Copiar */}
      <button onClick={handleCopy} title="Copiar texto selecionado">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copiar
      </button>

      {/* Divisor */}
      <div style={{ width: 1, background: "#3f3f46", margin: "0 2px" }} />

      {/* Cores de destaque */}
      {COLORS.map(({ color, bg, label }) => (
        <button
          key={color}
          onClick={() => { onHighlight(color); onClose(); }}
          title={`Destacar em ${label}`}
          style={{ padding: "7px 8px" }}
        >
          <span
            className="color-dot"
            style={{ background: bg, width: 14, height: 14, borderRadius: "50%", display: "inline-block" }}
          />
        </button>
      ))}

      {/* Divisor */}
      <div style={{ width: 1, background: "#3f3f46", margin: "0 2px" }} />

      {/* Anotar */}
      <button onClick={() => { onAnnotate(); onClose(); }} title="Adicionar nota">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Anotar
      </button>
    </div>
  );
};
