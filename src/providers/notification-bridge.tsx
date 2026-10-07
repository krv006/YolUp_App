import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useIsAuthenticated } from "@/modules/auth";
import { useNotificationFeed, type NotificationLink } from "@/modules/notification";
import { usePushRegistration } from "./use-push-registration";

/**
 * Bildirishnomalar ko'prigi — veb'da bu `NotificationBell` ichida turardi.
 *
 * Uchta ish qiladi:
 *   1. Ilova OCHIQ turganda WebSocket kanali (toast bilan).
 *   2. Qurilmani push uchun ro'yxatga olish.
 *   3. Push BOSILGANDA tegishli ekranga o'tish.
 *
 * Ko'rinishi yo'q — faqat effekt. Autentifikatsiyadan keyingina ishlaydi,
 * aks holda soket tokensiz ochilib darhol yopilardi, push so'rovi esa 401
 * olardi.
 */
export function NotificationBridge() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  const openLink = useCallback(
    (link: NotificationLink) => {
      if (link.type === "quiz") router.push(`/student/quizzes/${link.id}`);
      else if (link.type === "assignment") router.push("/student/chats");
    // Topshiriq (`homework_pending_review` / `homework_reviewed`) bildirishnomasi:
    // natija guruh chatining "Vazifalar" bo'limida ochiladi.
    else if (link.type === "submission") router.push("/student/chats");
    else if (link.type === "exam") router.push(`/student/exams/${link.id}`);
      else if (link.type === "lesson") router.push(`/live/${link.id}`);
      else if (link.type === "recording") router.push(`/recordings/${link.id}`);
    },
    [router]
  );

  useNotificationFeed(isAuthenticated, openLink);
  usePushRegistration(isAuthenticated);
  usePushResponse(isAuthenticated, openLink);

  return null;
}

/**
 * Tizim bildirishnomasi bosilganda ochiladigan ekran.
 *
 * ┌─ IKKI HOLAT ──────────────────────────────────────────────────────────┐
 * │ 1. Ilova TIRIK (fonda) — `addNotificationResponseReceivedListener`.   │
 * │ 2. Ilova YOPIQ edi va bildirishnoma uni ochdi — bu hodisa listener    │
 * │    o'rnatilgunga qadar sodir bo'ladi, shuning uchun oxirgi javob      │
 * │    `getLastNotificationResponseAsync` bilan alohida o'qiladi.         │
 * │    Usiz yopiq ilovadagi bosish e'tiborsiz qolardi.                    │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Bitta javob IKKI marta ishlov ko'rmasligi uchun identifikator eslab
 * qolinadi: ilova ochilganda `getLastNotificationResponseAsync` o'sha
 * javobni qaytarishi, keyin listener ham chaqirilishi mumkin.
 */
function usePushResponse(enabled: boolean, openLink: (link: NotificationLink) => void): void {
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    function handle(response: Notifications.NotificationResponse | null): void {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (id === handled.current) return;
      handled.current = id;

      /*
       * `data` — backend FCM'ga qo'ygan maydonlar (`PUSH-BACKEND.md`).
       * FCM ularni FAQAT SATR sifatida uzatadi, shuning uchun bo'sh satr
       * "yo'q" degani.
       */
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const type = typeof data?.link_type === "string" ? data.link_type : "";
      const id_ = typeof data?.link_id === "string" ? data.link_id : "";
      if (type && id_) openLink({ type, id: id_ });
    }

    void Notifications.getLastNotificationResponseAsync().then(handle);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);

    return () => subscription.remove();
  }, [enabled, openLink]);
}
