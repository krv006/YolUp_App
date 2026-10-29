import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import type { NotificationLink } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";

const RESULT_KINDS = ["result", "graded", "grade", "attempt", "finished"];

function isResult(kind?: string | null): boolean {
  return Boolean(kind) && RESULT_KINDS.some((part) => kind!.includes(part));
}

/**
 * Bildirishnoma havolasini ochish — veb `widgets/notification-link`: har
 * tur (dars, yozuv, vazifa, topshiriq, test, imtihon, guruh, suhbat) o'z
 * sahifasiga.
 *
 * Ota-onada test va imtihon havolalari mobilning hozirgi sahifalariga
 * (ota-ona ekranlari yangilanmagan). Admin uchun o'qituvchi havolasi
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
      // `withAnchor` — ichki sahifa ostida bo'lim bosh sahifasi ham turadi (`workspace/_layout.tsx`).
      const go = (href: string) => router.push(href as never, { withAnchor: true });
      const type = link.type.toLowerCase();

      if (type === "teacher") return go(`/admin/teachers?teacher=${encodeURIComponent(link.id)}`);
      if (type === "lesson") return go(kind?.includes("recording") ? `/recordings/${link.id}` : `/live/${link.id}`);
      if (type === "recording") return go(`/recordings/${link.id}`);
      if (prefix === "/teacher" && (type === "assignment" || type === "homework")) return go(ROUTES.teacher.homeworkItem(link.id));
      if (student && (type === "assignment" || type === "homework")) return go(ROUTES.student.homeworkItem(link.id));
      if (prefix !== "/parent" && type === "submission") {
        // Vebdagidek: topshiriqdan vazifani topadi — o'qituvchida tekshirish sahifasida o'sha topshiriq.
        void queryClient
          .fetchQuery({
            queryKey: homeworkKeys.submission(link.id),
            queryFn: ({ signal }) => homeworkApi.getSubmission(link.id, { signal }),
          })
          .then((submission) => {
            if (!submission) throw new Error();
            go(student ? ROUTES.student.homeworkItem(submission.assignmentId) : `${ROUTES.teacher.homeworkReview(submission.assignmentId)}?s=${encodeURIComponent(link.id)}`);
          })
          .catch(() => go(student ? ROUTES.student.homework : ROUTES.teacher.homework));
        return;
      }
      if (type === "assignment" || type === "homework" || type === "submission") return go("/parent/homework");
      if (type === "quiz" || type === "test") {
        // Vebdagidek: natija xabari — natijalar, qolgani — test sahifasi.
        if (prefix === "/teacher") return go(isResult(kind) ? ROUTES.teacher.testResults(link.id) : ROUTES.teacher.test(link.id));
        if (student) return go(isResult(kind) ? ROUTES.student.testResults(link.id) : ROUTES.student.test(link.id));
        return go(`${prefix}/quizzes?quiz=${link.id}`);
      }
      if (type === "exam" || type === "mock") {
        if (prefix === "/teacher") return go(ROUTES.teacher.mockResults(link.id));
        if (student) return go(isResult(kind) ? ROUTES.student.mockResults(link.id) : ROUTES.student.mockExams);
        return go(`${prefix}/exams`);
      }
      if (type === "course") {
        const room = conversations.data?.find((item) => item.courseId === link.id);
        return go(room ? `${prefix}/chats/${room.id}` : `${prefix}/chats`);
      }
      if (type === "certificate") return go(`${prefix}/profile/certificates`);
      if (type === "support") return go(`${prefix}/profile/help?ticket=${encodeURIComponent(link.id)}`);
      if (type === "conversation" || type === "room" || type === "chat" || type === "chat_room" || type === "message") {
        return go(`${prefix}/chats/${link.id}`);
      }
    },
    [router, prefix, student, conversations.data, queryClient]
  );
}
