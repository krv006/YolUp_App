import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useCurrentUser, useIsAuthenticated } from "@/modules/auth";
import { conversationKeys } from "@/modules/conversation";
import { useActiveConversationStore } from "@/modules/conversation/model/chat-realtime";
import { notificationKeys, useNotificationFeed, type OpenNotificationLink } from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { useOpenNotificationLink } from "@/widgets/notification-link";
import { useParentNotificationLink } from "@/widgets/parent-shell";
import { setActiveChatResolver, useForegroundPushStore } from "./foreground-push";
import { RealtimeSync } from "./realtime-sync";
import { usePushRegistration } from "./use-push-registration";

/**
 * Bildirishnomalar ko'prigi — veb'da bu `NotificationBell` ichida turardi.
 *
 * Uchta ish qiladi:
 *   1. Ilova OCHIQ turganda WebSocket kanali (toast bilan). O'qituvchi va
 *      o'quvchida u chat ro'yxatini ham real vaqtda yangilaydi
 *      (`RealtimeSync`, veb #165); ota-ona va adminda faqat bildirishnomalar.
 *   2. Qurilmani push uchun ro'yxatga olish.
 *   3. Push BOSILGANDA tegishli ekranga o'tish.
 *
 * Ko'rinishi yo'q — faqat effekt. Autentifikatsiyadan keyingina ishlaydi,
 * aks holda soket tokensiz ochilib darhol yopilardi, push so'rovi esa 401
 * olardi.
 */
export function NotificationBridge() {
  const isAuthenticated = useIsAuthenticated();
  usePushRegistration(isAuthenticated);
  return isAuthenticated ? <NotificationLinks /> : null;
}

/**
 * Kanal va push bosilishi — faqat kirgandan keyin chiziladi: havola ochuvchi
 * (`widgets/notification-link`, rol bo'yicha sahifa) suhbatlar ro'yxatini
 * so'raydi, tokensiz u 401 olardi.
 */
function NotificationLinks() {
  const role = useCurrentUser()?.role;
  useForegroundPushSync();
  return role === ROLES.PARENT ? <ParentNotificationLinks /> : <RoleNotificationLinks />;
}

function RoleNotificationLinks() {
  const openLink = useOpenNotificationLink();
  const role = useCurrentUser()?.role;
  const chatRole = role === ROLES.TEACHER ? "teacher" : role === ROLES.STUDENT ? "student" : null;
  usePushResponse(true, openLink);
  return chatRole ? <RealtimeSync role={chatRole} openLink={openLink} /> : <NotificationFeed openLink={openLink} />;
}

/**
 * Ota-ona — veb `ParentBell` (`useParentNotificationLink`): xabardagi
 * `student_id` bo'yicha farzand tanlanib, bo'limi ochiladi. Suhbat ro'yxati
 * so'ralmaydi — chat havolasi to'g'ridan-to'g'ri `/parent/chats/<id>` ni
 * ochadi.
 */
function ParentNotificationLinks() {
  const openLink = useParentNotificationLink();
  usePushResponse(true, openLink);
  return <NotificationFeed openLink={openLink} />;
}

/**
 * Ota-ona va admin — veb `NotificationBell` dagi kabi faqat bildirishnomalar
 * kanali. Push yetib kelayotgan bo'lsa (Android) soket o'chadi — xabarni
 * tizim banneri ko'rsatadi, ro'yxat esa push kelganda yangilanadi
 * (`useForegroundPushSync`).
 */
function NotificationFeed({ openLink }: { openLink: OpenNotificationLink }) {
  const pushActive = useForegroundPushStore((state) => state.active);
  useNotificationFeed(!pushActive, openLink);
  return null;
}

/**
 * Ilova ochiq turgandagi push uchun ikki narsa:
 * - ochiq chatni aniqlash (o'z xabari jim qoladi) — guruh chatida push
 *   havolasi kurs id bo'lgani uchun kurs id suhbatlar keshidan olinadi;
 * - push kelganda bildirishnomalar ro'yxati va soni yangilanadi.
 */
function useForegroundPushSync(): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      setActiveChatResolver(() => {
        const id = useActiveConversationStore.getState().id;
        if (!id) return null;
        let courseId: string | null = null;
        for (const [, data] of queryClient.getQueriesData<unknown>({ queryKey: conversationKeys.all })) {
          const items = Array.isArray(data) ? data : data ? [data] : [];
          const room = items.find((item): item is { id: string; courseId?: string | null } => (item as { id?: unknown })?.id === id);
          if (room?.courseId) {
            courseId = room.courseId;
            break;
          }
        }
        return { id, courseId };
      }),
    [queryClient]
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return () => subscription.remove();
  }, [queryClient]);
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
function usePushResponse(enabled: boolean, openLink: OpenNotificationLink): void {
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
      if (type && id_) openLink({ type, id: id_ }, null, data);
    }

    void Notifications.getLastNotificationResponseAsync().then(handle);
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);

    return () => subscription.remove();
  }, [enabled, openLink]);
}
