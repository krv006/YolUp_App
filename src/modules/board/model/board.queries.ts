import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "../api/board.api";
import type { StrokeInput } from "../api/board.dto";

export const boardKeys = Object.freeze({
  all: ["board"] as const,
  state: (id: string) => ["board", id] as const,
});

/** WebSocket uzilgan holat uchun zaxira — kanal ishlaganda polling o'chadi. */
const FALLBACK_POLL_MS = 2000;

/**
 * Doska holati. Real-time kanal ulangan bo'lsa (`live = true`) polling kerak emas:
 * yangilanishlar `useBoardRealtime` orqali to'g'ridan-to'g'ri keshga tushadi
 * (docs/PROJECT.md §5.2 — "polling KERAK EMAS").
 */
export function useBoard(lessonId: string, { enabled = true, live = false } = {}) {
  return useQuery({
    queryKey: boardKeys.state(lessonId),
    queryFn: ({ signal }) => boardApi.getState(lessonId, { signal }),
    enabled: Boolean(lessonId && enabled),
    refetchInterval: live ? false : FALLBACK_POLL_MS,
  });
}

export function useAddStroke(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sheet, stroke }: { sheet: number; stroke: StrokeInput }) =>
      boardApi.addStroke(lessonId, sheet, stroke),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
  });
}

export function useAddSheet(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => boardApi.addSheet(lessonId),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
  });
}

export function useEraseStrokes(lessonId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sheet, strokeIds, reason }: { sheet: number; strokeIds: string[]; reason: string }) =>
      boardApi.erase(lessonId, sheet, strokeIds, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: boardKeys.state(lessonId) }),
  });
}

export function useGrantDraw(lessonId: string) {
  return useMutation({ mutationFn: (studentId: string) => boardApi.grant(lessonId, studentId) });
}

export function useSolveFormula(lessonId: string) {
  return useMutation({ mutationFn: (expression: string) => boardApi.solve(lessonId, expression) });
}
