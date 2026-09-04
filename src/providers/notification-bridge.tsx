import { useRouter } from "expo-router";
import { useIsAuthenticated } from "@/modules/auth";
import { useNotificationFeed, type NotificationLink } from "@/modules/notification";

/**
 * Jonli bildirishnoma kanali — veb'da bu `NotificationBell` ichida turardi.
 *
 * Mobilda qo'ng'iroq tugmasi har ekranda bo'lmaydi, kanal esa ilova ochiq
 * turganda DOIM ishlashi kerak: yangi xabar toast bilan ko'rinadi va
 * bosilganda tegishli bo'lim ochiladi.
 *
 * Ko'rinishi yo'q — faqat effekt. Autentifikatsiyadan keyingina ulanadi,
 * aks holda soket tokensiz ochilib darhol yopilardi.
 */
export function NotificationBridge() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  function openLink(link: NotificationLink) {
    if (link.type === "quiz") router.push(`/student/quizzes/${link.id}`);
    else if (link.type === "assignment") router.push("/student/chats");
  }

  useNotificationFeed(isAuthenticated, openLink);

  return null;
}
