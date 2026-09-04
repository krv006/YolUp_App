import { courseApi } from "@/modules/course";
import { homeworkApi } from "@/modules/homework";
import { lessonApi } from "@/modules/lesson";
import type { RequestOptions } from "@/shared/api";
import type { Assignment } from "@/shared/types";
import type { StudentDashboard } from "./student.dto";

const DAY_MS = 86_400_000;
const dayMonth = new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short" });
const dayMonthTime = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Backendda o'quvchi paneli uchun alohida endpoint yo'q —
 * kurs, dars va vazifa ro'yxatlaridan yig'iladi.
 */
export const studentApi = {
  async getDashboard(options: RequestOptions = {}): Promise<StudentDashboard> {
    const [coursePage, lessonPage] = await Promise.all([
      courseApi.getAll({ ...options, query: { page_size: 100 } }),
      lessonApi.getAll({ ...options, query: { page_size: 100, ordering: "starts_at" } }),
    ]);

    const assignments = (
      await Promise.all(
        coursePage.items.map((course) =>
          homeworkApi.getAssignments(course.id, options).catch((): Assignment[] => [])
        )
      )
    ).flat();

    const scores = assignments
      .map((item) => item.mySubmission?.overallScore)
      .filter((value): value is number => value != null);

    const nextLesson =
      lessonPage.items.find((item) => new Date(item.startsAt) >= new Date()) ??
      lessonPage.items[0] ??
      null;

    return {
      metrics: [
        { id: "courses", label: "Faol kurslar", value: String(coursePage.total), tone: "violet" },
        {
          id: "lessons",
          label: "Rejadagi darslar",
          value: String(lessonPage.items.filter((item) => item.status === "scheduled").length),
          tone: "blue",
        },
        {
          id: "assignments",
          label: "Kutilayotgan vazifa",
          value: String(assignments.filter((item) => !item.mySubmission).length),
          tone: "amber",
        },
        {
          id: "progress",
          label: "O‘rtacha natija",
          value: scores.length
            ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
            : "—",
          tone: "emerald",
        },
      ],
      nextLesson: nextLesson
        ? {
            id: nextLesson.courseId,
            lessonId: nextLesson.id,
            title: nextLesson.title,
            teacher: nextLesson.courseTitle,
            date: dayMonth.format(new Date(nextLesson.startsAt)),
            time: nextLesson.time,
            duration: `${nextLesson.durationMinutes} daqiqa`,
          }
        : null,
      assignments: assignments.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        course: item.courseTitle,
        due: item.dueAt ? dayMonthTime.format(new Date(item.dueAt)) : "Muddat yo‘q",
        status: item.dueAt && new Date(item.dueAt).getTime() - Date.now() < DAY_MS ? "urgent" : "normal",
      })),
    };
  },
};
