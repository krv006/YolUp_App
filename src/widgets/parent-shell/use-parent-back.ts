import { useCallback } from "react";
import { useRouter } from "expo-router";

/**
 * Ichki sahifadan orqaga — vebda `navigate(ROUTES.parent.…)` aniq manzilga
 * qaytaradi; mobilda stekda oldingi sahifa bo'lsa unga (animatsiya bilan),
 * bo'lmasa (havola orqali to'g'ridan-to'g'ri kirilgan) o'sha manzilga.
 */
export function useParentBack(fallback: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [router, fallback]);
}
