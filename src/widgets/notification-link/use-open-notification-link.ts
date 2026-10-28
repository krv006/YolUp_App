import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import type { NotificationLink } from "@/modules/notification";
import { ROLES } from "@/shared/constants";

/**
 * Bildirishnoma havolasini ochish — veb `widgets/notification-link`: har
 * tur (dars, yozuv, vazifa, topshiriq, test, imtihon, guruh, suhbat) o'z
 * sahifasiga.
 *
 * Farq: marshrutlar mobilning hozirgi sahifalariga (Workspace ichidagi
 * test/vazifa sahifalari 5-bosqichda vebdagidek `/workspace/...` ga
 * ko'chadi). Admin uchun o'qituvchi havolasi o'qituvchilar ro'yxatini ochadi.
 */
export function useOpenNotificationLink() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const student = role === ROLES.STUDENT;
  const prefix = student ? "/student" : role === ROLES.PARENT ? "/parent" : "/teacher";
  const conversations = useConversations(student ? "student" : "teacher");

  return useCallback(
    (link: NotificationLink, kind?: string | null) => {
      const go = (href: string) => router.push(href as never);
      const type = link.type.toLowerCase();

      if (type === "teacher") return go(`/admin/teachers?teacher=${encodeURIComponent(link.id)}`);
      if (type === "lesson") return go(kind?.includes("recording") ? `/recordings/${link.id}` : `/live/${link.id}`);
      if (type === "recording") return go(`/recordings/${link.id}`);
      if (type === "assignment" || type === "homework" || type === "submission") {
        if (prefix === "/teacher") return go("/teacher/assignments");
        if (prefix === "/parent") return go("/parent/homework");
        return go("/student/chats");
      }
      if (type === "quiz" || type === "test") return go(`${prefix}/quizzes?quiz=${link.id}`);
      if (type === "exam" || type === "mock") return go(student ? `/student/exams/${link.id}` : `${prefix}/exams`);
      if (type === "course") {
        const room = conversations.data?.find((item) => item.courseId === link.id);
        return go(room ? `${prefix}/chats/${room.id}` : `${prefix}/chats`);
      }
      if (type === "conversation" || type === "room" || type === "chat" || type === "message") {
        return go(`${prefix}/chats/${link.id}`);
      }
    },
    [router, prefix, student, conversations.data]
  );
}
