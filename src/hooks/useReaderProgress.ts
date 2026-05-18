// src/hooks/useReaderProgress.ts
// Salva e recupera a posição de leitura de cada livro usando IndexedDB (idb-keyval).
// O progresso persiste mesmo depois de fechar o app.

import { useCallback } from "react";
import { get, set } from "idb-keyval";

interface ProgressData {
  page: number;         // Página atual (PDF) ou CFI (EPUB)
  cfi?: string;         // EPUB Canonical Fragment Identifier
  scrollY?: number;     // Posição de scroll (PDF modo contínuo)
  updatedAt: number;    // Timestamp
}

const KEY_PREFIX = "lume_progress_";

export function useReaderProgress(bookId: string) {
  // Salva o progresso atual
  const saveProgress = useCallback(
    async (data: Omit<ProgressData, "updatedAt">) => {
      try {
        await set(KEY_PREFIX + bookId, {
          ...data,
          updatedAt: Date.now(),
        } satisfies ProgressData);
      } catch (e) {
        console.warn("[Lume] Erro ao salvar progresso:", e);
      }
    },
    [bookId]
  );

  // Recupera o progresso salvo
  const loadProgress = useCallback(async (): Promise<ProgressData | null> => {
    try {
      const data = await get<ProgressData>(KEY_PREFIX + bookId);
      return data ?? null;
    } catch (e) {
      console.warn("[Lume] Erro ao carregar progresso:", e);
      return null;
    }
  }, [bookId]);

  // Reseta o progresso (começar do zero)
  const resetProgress = useCallback(async () => {
    try {
      await set(KEY_PREFIX + bookId, null);
    } catch (e) {
      console.warn("[Lume] Erro ao resetar progresso:", e);
    }
  }, [bookId]);

  return { saveProgress, loadProgress, resetProgress };
}
