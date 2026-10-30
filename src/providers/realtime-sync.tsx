import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/modules/auth";
import { applyChatActivity, applyChatTyping, conversationKeys, useConversationSync } from "@/modules/conversation";
import { useRealtimeSocket, useShowLiveNotification, type OpenNotificationLink } from "@/modules/notification";
import type { ConversationRole } from "@/shared/types";

/**
 * Real vaqt kanali — veb `app/router/realtime-sync.tsx` (#165): o'qituvchi va
 * o'quvchida butun ilova uchun bitta `ws/notifications` ulanishi.
 *
 * - `notification` — toast (vebdagidek), bildirishnomalar keshi yangilanadi;
 * - `chat_activity` — chat ro'yxati darhol yangilanadi (ochiq chatdagi
 *   boshqalarning xabari bundan mustasno — u chat soketidan keladi);
 * - `chat_typing` — ro'yxat qatorida "yozmoqda", 5 soniyada o'chadi.
 *
 * 10 soniyalik ro'yxat so'rovi faqat soket ulanmagan paytda; qayta
 * ulanganda ro'yxat bir marta yangilanadi.
 *
 * Mobilda u sahifa marshrutida emas, `NotificationBridge` ichida turadi —
 * ilova bo'ylab soket o'sha yerda bitta.
 */
export function RealtimeSync({ role, openLink }: { role: ConversationRole; openLink: OpenNotificationLink }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const showNotification = useShowLiveNotification(openLink);
  const [live, setLive] = useState(false);
  const connectedOnce = useRef(false);
  const userId = user?.id ?? null;

  useRealtimeSocket(
    Boolean(userId),
    (event) => {
      if (event.type === "notification") {
        showNotification(event.notification);
        return;
      }
      if (event.type === "chatActivity") {
        applyChatActivity(queryClient, role, event, userId);
        return;
      }
      applyChatTyping(event.roomId, event, userId);
    },
    (state) => {
      const connected = state === "connected";
      if (connected && connectedOnce.current) {
        void queryClient.invalidateQueries({ queryKey: conversationKeys.list(role), exact: true });
      }
      if (connected) connectedOnce.current = true;
      setLive(connected);
    }
  );

  useConversationSync(role, live);
  return null;
}
