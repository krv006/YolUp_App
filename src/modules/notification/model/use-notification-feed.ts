import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { htmlToPlainText } from "@/shared/lib";
import type { NotificationLink } from "../api/notification.dto";
import { NotificationSocketManager } from "../lib/notification-socket-manager";
import { notificationKeys, useUnreadNotificationCount } from "./notification.queries";

/**
 * Bildirishnoma oqimi: o'qilmagan soni + real-time kanal.
 *
 * Kanal yangi xabar keltirganda toast ko'rsatiladi va inbox/badge keshi
 * bekor qilinadi — soni serverdan qayta olinadi, mahalliy hisoblash bilan
 * ajralib ketmaydi.
 *
 * `available: false` — modul bu muhitda o'rnatilmagan (404), qo'ng'iroq yashiriladi.
 */
export function useNotificationFeed(
  enabled = true,
  onOpenLink?: (link: NotificationLink) => void
) {
  const queryClient = useQueryClient();
  // Ishlovchi har renderda yangi bo'lishi mumkin, kanal esa qayta ulanmasligi
  // kerak — shuning uchun u ref orqali chaqiriladi.
  const openLink = useRef(onOpenLink);
  useEffect(() => {
    openLink.current = onOpenLink;
  }, [onOpenLink]);
  const unread = useUnreadNotificationCount(enabled);
  const available = unread.data !== null && unread.data !== undefined;

  /*
   * Kanal effekt ichida ochiladi: ishlovchi ref orqali chaqiriladi, shuning
   * uchun uning yangilanishi ulanishni uzmaydi.
   */
  useEffect(() => {
    if (!enabled || !available) return undefined;
    const socket = new NotificationSocketManager({
      onNotification: (notification) => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        const preview = htmlToPlainText(notification.html, 90);
        const link = notification.link;
        const open = openLink.current;
        toast.info(preview || "Yangi xabar", {
          description: notification.senderName,
          // Muddat eslatmasi darhol foyda bersin: bosilsa vazifa ochiladi.
          action: link && open ? { label: "Ochish", onClick: () => open(link) } : undefined,
        });
      },
    });
    socket.start();
    return () => socket.stop();
  }, [enabled, available, queryClient]);

  return { available, unreadCount: unread.data ?? 0, isLoading: unread.isLoading };
}
