// src/hooks/useAnnotations.ts
// Gerencia highlights e anotações persistidas no IndexedDB.

import { useState, useCallback, useEffect } from "react";
import { get, set } from "idb-keyval";

export type HighlightColor = "yellow" | "green" | "blue" | "red";

export interface Annotation {
  id: string;
  bookId: string;
  page: number;            // Número da página (PDF) ou cfi (EPUB)
  cfi?: string;
  selectedText: string;
  note?: string;
  color: HighlightColor;
  createdAt: number;
  // Posição para re-renderizar o highlight no PDF
  rects?: Array<{ x: number; y: number; width: number; height: number }>;
}

const KEY_PREFIX = "lume_annotations_";

export function useAnnotations(bookId: string) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega anotações ao montar
  useEffect(() => {
    get<Annotation[]>(KEY_PREFIX + bookId)
      .then((data) => {
        setAnnotations(data ?? []);
      })
      .catch(() => setAnnotations([]))
      .finally(() => setLoading(false));
  }, [bookId]);

  // Persiste toda vez que annotations mudar
  const persist = useCallback(
    async (list: Annotation[]) => {
      try {
        await set(KEY_PREFIX + bookId, list);
      } catch (e) {
        console.warn("[Lume] Erro ao salvar anotações:", e);
      }
    },
    [bookId]
  );

  // Adiciona uma nova anotação
  const addAnnotation = useCallback(
    async (data: Omit<Annotation, "id" | "bookId" | "createdAt">) => {
      const newAnnotation: Annotation = {
        ...data,
        id: crypto.randomUUID(),
        bookId,
        createdAt: Date.now(),
      };
      setAnnotations((prev) => {
        const updated = [...prev, newAnnotation];
        persist(updated);
        return updated;
      });
      return newAnnotation;
    },
    [bookId, persist]
  );

  // Atualiza a nota de uma anotação existente
  const updateNote = useCallback(
    async (annotationId: string, note: string) => {
      setAnnotations((prev) => {
        const updated = prev.map((a) =>
          a.id === annotationId ? { ...a, note } : a
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  // Remove uma anotação
  const removeAnnotation = useCallback(
    async (annotationId: string) => {
      setAnnotations((prev) => {
        const updated = prev.filter((a) => a.id !== annotationId);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  // Retorna anotações de uma página específica
  const getPageAnnotations = useCallback(
    (page: number) => annotations.filter((a) => a.page === page),
    [annotations]
  );

  return {
    annotations,
    loading,
    addAnnotation,
    updateNote,
    removeAnnotation,
    getPageAnnotations,
  };
}
