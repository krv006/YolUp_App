import { tokenStorage } from "@/shared/api";

/** `Image` manbasi (`ImageURISource` ning keraklisi; domen qatlami `react-native` ni import qilmaydi). */
export interface ChatImageSource {
  uri: string;
  headers?: Record<string, string>;
}

/** Qurilmadagi fayl (yuborilayotgan rasm) — token kerak emas. */
const LOCAL = /^(file:|content:|ph:|assets-library:|blob:|data:)/i;

export function chatImageUrl(url: string | null | undefined, thumb: boolean): string | null {
  if (!url) return null;
  if (LOCAL.test(url) || !thumb || /[?&]thumb=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}thumb=1`;
}

/**
 * Chat rasmi manbasi — veb `use-chat-image.ts`: backend faylni faqat token
 * bilan beradi, oddiy `<img src>` esa tokensiz so'rab 401 olardi.
 *
 * 🟡 Vebdan farqi: vebda rasm `apiClient` bilan blob qilib yuklanib
 * `URL.createObjectURL` beriladi. RN'da blob URL yo'q — `Image` manbasining
 * o'zi `Authorization` sarlavhasini yuboradi (ovozli xabar ham shunday,
 * `voice-message.tsx`). Keshni `Image` ning o'zi boshqaradi.
 */
export function useChatImage(url: string | null | undefined, { thumb = false }: { thumb?: boolean } = {}): {
  source: ChatImageSource | null;
} {
  const target = chatImageUrl(url, thumb);
  if (!target) return { source: null };
  if (LOCAL.test(target)) return { source: { uri: target } };
  const token = tokenStorage.getAccessToken();
  return { source: { uri: target, headers: token ? { Authorization: `Bearer ${token}` } : undefined } };
}
