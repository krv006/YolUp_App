import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_ERROR_CODES, AppError, refreshTokenManager } from "@/shared/api";

/** Faqat vaqtinchalik nosozliklar qayta uriniladi — 4xx lar emas. */
const RETRYABLE_CODES: ReadonlySet<string> = new Set([
  API_ERROR_CODES.NETWORK_ERROR,
  API_ERROR_CODES.OFFLINE,
  API_ERROR_CODES.TIMEOUT,
  API_ERROR_CODES.SERVER_ERROR,
]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof AppError && RETRYABLE_CODES.has(error.code);
}

/** Global toast faqat `meta.showGlobalError` belgilangan so'rovlarda chiqadi. */
function showGlobalError(error: unknown, meta?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : null;
  if (meta?.showGlobalError && message) toast.error(message);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => showGlobalError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => showGlobalError(error, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/**
 * Sessiya almashganda keshni to'liq tozalaydi.
 *
 * NEGA KERAK: hisob yoki rol almashtirilganda foydalanuvchi tizimda qoladi,
 * lekin BOSHQA odam bo'ladi. Kesh tozalanmasa, yangi hisob bir necha soniya
 * davomida eski hisobning suhbatlari, baholari va darslarini ko'radi —
 * bu nafaqat xato, balki maxfiylik muammosi.
 *
 * Avval `cancelQueries` — ketayotgan so'rovlar javobi kelib, tozalangan
 * keshni yana to'ldirib qo'ymasligi uchun.
 */
export function resetSessionCache(): void {
  void queryClient.cancelQueries();
  queryClient.getQueryCache().clear();
}

// Veb bu yerda `window` hodisasini tinglaydi; mobilda global hodisa shinasi
// yo'q, shuning uchun refresh menejerining obunasi ishlatiladi.
refreshTokenManager.onSessionChange(resetSessionCache);
