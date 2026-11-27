import { create } from "zustand";

/**
 * Ilova OCHIQ turgandagi push siyosati — mobilga xos (vebda push yo'q).
 *
 * Push yetib kelayotgan bo'lsa (Android, token backendda), ilova ichida
 * ham xabar Telegram kabi tizim banneri va ovoz bilan chiqadi; o'sha xabar
 * uchun WebSocket toast'i esa ko'rsatilmaydi — aks holda bitta xabar ikki
 * marta ko'rinardi.
 *
 * iOS'da push hali yo'q (APNs kaliti kutilmoqda) — u yerda `active`
 * yoqilmaydi va avvalgidek WebSocket toast'i ishlaydi.
 */
export const useForegroundPushStore = create<{ active: boolean }>(() => ({ active: false }));

export function setForegroundPushActive(active: boolean): void {
  if (useForegroundPushStore.getState().active !== active) useForegroundPushStore.setState({ active });
}

/** Hozir ochiq chat: suhbat id va (guruh bo'lsa) kurs id — push havolasi ikkalasidan biri bo'ladi. */
type ActiveChat = { id: string; courseId: string | null } | null;

let resolveActiveChat: () => ActiveChat = () => null;

export function setActiveChatResolver(resolver: () => ActiveChat): () => void {
  resolveActiveChat = resolver;
  return () => {
    if (resolveActiveChat === resolver) resolveActiveChat = () => null;
  };
}

const CHAT_LINKS = new Set(["conversation", "room", "chat", "chat_room", "message", "course", "club"]);

/**
 * Push hozir ochiq turgan chatga tegishlimi — unda xabar ekranda allaqachon
 * ko'rinib turibdi, banner va ovoz ortiqcha.
 */
export function isPushForOpenChat(data: Record<string, unknown> | undefined): boolean {
  const type = typeof data?.link_type === "string" ? data.link_type : "";
  const id = typeof data?.link_id === "string" ? data.link_id : "";
  if (!id || !CHAT_LINKS.has(type)) return false;
  const chat = resolveActiveChat();
  return Boolean(chat && (chat.id === id || chat.courseId === id));
}
