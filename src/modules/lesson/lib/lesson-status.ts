import { useTranslation } from "react-i18next";
import type { Lesson, LessonStatus } from "@/shared/types";

export interface LessonStatusMeta {
  label: string;
  tone: "scheduled" | "live" | "finished" | "cancelled";
}

const STATUS_TONES: Record<LessonStatus, LessonStatusMeta["tone"]> = {
  scheduled: "scheduled",
  live: "live",
  finished: "finished",
  cancelled: "cancelled",
};

export function useLessonStatusMeta() {
  const { t } = useTranslation("lesson");
  return (status: LessonStatus): LessonStatusMeta => ({
    label: t(`status.${status}`, t("status.unknown")),
    tone: STATUS_TONES[status] ?? "scheduled",
  });
}

export const CLOSED_LESSON_STATUSES: LessonStatus[] = ["finished", "cancelled"];

export function isLessonClosed(lesson: Lesson): boolean {
  return CLOSED_LESSON_STATUSES.includes(lesson.status);
}

export function hasLessonTopic(lesson: Lesson): boolean {
  return Boolean(lesson.title?.trim());
}

export function isLessonJoinable(lesson: Lesson, now = new Date()): boolean {
  if (isLessonClosed(lesson)) return false;
  if (lesson.status === "scheduled") {
    const lessonDay = startOfDay(new Date(lesson.startsAt));
    return lessonDay >= startOfDay(now);
  }
  return true;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isLessonEditable(lesson: Lesson): boolean {
  return lesson.status !== "live";
}
