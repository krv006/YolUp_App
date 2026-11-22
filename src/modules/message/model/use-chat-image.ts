import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { writeBlobToCache } from "@/shared/lib";

/** `Image` manbasi (`ImageURISource` ning keraklisi; domen qatlami `react-native` ni import qilmaydi). */
export interface ChatImageSource {
  uri: string;
}

/** Qurilmadagi fayl (yuborilayotgan rasm) — yuklash kerak emas. */
const LOCAL = /^(file:|content:|ph:|assets-library:|blob:|data:)/i;

export function chatImageUrl(url: string | null | undefined, thumb: boolean): string | null {
  if (!url) return null;
  if (LOCAL.test(url) || !thumb || /[?&]thumb=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}thumb=1`;
}

/** Bir URL — bir kesh fayli (nom URL'dan, takror so'rovda ustidan yoziladi). */
function cacheName(target: string): string {
  return `chat-image-${target.replace(/^https?:\/\//i, "").replace(/[^a-z0-9]+/gi, "-").slice(-120)}.img`;
}

/**
 * Chat rasmi — veb `use-chat-image.ts`: backend faylni faqat token bilan
 * beradi, oddiy `<img src>` / `Image uri` esa tokensiz so'rab 401 olardi.
 * Rasm `apiClient` bilan yuklanadi (token, muddati o'tsa yangilash ham
 * shu yerda), xabarda eskiz (`?thumb=1`).
 *
 * 🟡 Vebdan farqi: blob `URL.createObjectURL` o'rniga kesh fayliga yoziladi
 * va `file://` beriladi. `Image` ga `headers` berish yo'li sinab ko'rildi —
 * Android'da (Fresco) backend baribir 401 qaytardi (2026-11-22).
 */
export function useChatImage(url: string | null | undefined, { thumb = false }: { thumb?: boolean } = {}) {
  const target = chatImageUrl(url, thumb);
  const local = Boolean(target && LOCAL.test(target));
  const query = useQuery({
    queryKey: ["chat", "image", target],
    queryFn: async ({ signal }) => {
      const blob = await apiClient.get<Blob>(target as string, { signal, responseType: "blob" });
      return (await writeBlobToCache(blob, cacheName(target as string))).uri;
    },
    enabled: Boolean(target) && !local,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: 1,
  });
  const uri = local ? target : (query.data ?? null);
  return {
    source: uri ? ({ uri } satisfies ChatImageSource) : null,
    failed: !local && query.isError,
    loading: !local && !uri && !query.isError,
  };
}
