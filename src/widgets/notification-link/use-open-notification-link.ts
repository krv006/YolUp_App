import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import type { NotificationLink } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";

/**
 * Bildirishnoma havolasini ochish — veb `widgets/notification-link`: har
 * tur (dars, yozuv, vazifa, topshiriq, test, imtihon, guruh, suhbat) o'z
 * sahifasiga.
 *
 * Farq: o'qituvchining vazifa va topshiriq havolalari vebdagidek
 * `/teacher/workspace/homework/...` ga; qolganlari mobilning hozirgi
 * sahifalariga (testlar 5-bosqichda). Admin uchun o'qituvchi havolasi
 * o'qituvchilar ro'yxatini ochadi.
 */
export function useOpenNotificationLink() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      if (prefix === "/teacher" && (type === "assignment" || type === "homework")) return go(ROUTES.teacher.homeworkItem(link.id));
      if (prefix === "/teacher" && type === "submission") {
        // Vebdagidek: topshiriqdan vazifani topib, tekshirish sahifasida o'sha topshiriq.
        void queryClient
          .fetchQuery({
            queryKey: homeworkKeys.submission(link.id),
            queryFn: ({ signal }) => homeworkApi.getSubmission(link.id, { signal }),
          })
          .then((submission) => {
            if (!submission) throw new Error();
            go(`${ROUTES.teacher.homeworkReview(submission.assignmentId)}?s=${encodeURIComponent(link.id)}`);
          })
          .catch(() => go("/teacher/assignments"));
        return;
      }
      if (type === "assignment" || type === "homework" || type === "submission") {
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
    [router, prefix, student, conversations.data, queryClient]
  );
}
