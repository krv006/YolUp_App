import { useCallback } from "react";
import { useRouter } from "expo-router";
import type { OpenNotificationLink } from "@/modules/notification";
import { useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";

/**
 * Ota-ona bildirishnomasi havolasi — veb `widgets/parent-shell/use-parent-notification-link.ts`:
 * xabardagi `student_id` bo'yicha farzand tanlanadi, keyin turiga qarab
 * bo'lim ochiladi (kirish — farzand kirishlari, vazifa — Vazifalar, dars —
 * Davomat, test va imtihon — Imtihonlar).
 */
export function useParentNotificationLink(): OpenNotificationLink {
  const router = useRouter();
  const { children, selectChild } = useSelectedChild();
  return useCallback(
    (link, _kind, data) => {
      // `withAnchor` — ichki sahifa ostida bo'lim bosh sahifasi ham turadi.
      const go = (href: string) => router.push(href as never, { withAnchor: true });
      const type = link.type.toLowerCase();
      const studentId = typeof data?.student_id === "string" ? data.student_id : "";
      const child = children.find((item) => item.id === studentId);
      if (child) selectChild(child.id);
      if (type === "login") go(child ? ROUTES.parent.childLogins(child.id) : ROUTES.parent.children);
      else if (["assignment", "homework", "submission"].includes(type)) go(ROUTES.parent.homework);
      else if (["lesson", "recording"].includes(type)) go(ROUTES.parent.attendance);
      else if (["exam", "mock", "quiz", "test"].includes(type)) go(ROUTES.parent.exams);
    },
    [children, router, selectChild]
  );
}
