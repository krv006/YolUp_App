import type { QuizAttemptResult } from "@/shared/types";

/**
 * Hozirgina topshirilgan test natijasi — vebda `navigate(..., { state: { result } })`
 * bilan natijalar sahifasiga uzatiladi. Expo Router'da marshrut holati yo'q,
 * shuning uchun natija shu yerda bir martalik saqlanadi va sahifa uni oladi.
 */
const fresh = new Map<string, QuizAttemptResult>();

export function rememberFreshResult(quizId: string, result: QuizAttemptResult): void {
  fresh.set(quizId, result);
}

export function takeFreshResult(quizId: string): QuizAttemptResult | null {
  const result = fresh.get(quizId) ?? null;
  fresh.delete(quizId);
  return result;
}
