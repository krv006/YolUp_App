import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Lesson } from "@/shared/types";

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export interface CalendarDay {
  key: string;
  date: Date;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  lessons: Lesson[];
}

export function toDayKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupLessonsByDay(lessons: Lesson[]): Map<string, Lesson[]> {
  const byDay = new Map<string, Lesson[]>();

  for (const lesson of lessons) {
    const key = toDayKey(lesson.startsAt);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(lesson);
    else byDay.set(key, [lesson]);
  }

  for (const bucket of byDay.values()) {
    bucket.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return byDay;
}

export function buildMonthGrid(month: Date, lessons: Lesson[]): CalendarDay[] {
  const byDay = groupLessonsByDay(lessons);

  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
  }).map((date) => {
    const key = toDayKey(date);
    return {
      key,
      date,
      dayOfMonth: date.getDate(),
      inCurrentMonth: isSameMonth(date, month),
      isToday: isToday(date),
      lessons: byDay.get(key) ?? [],
    };
  });
}

export function formatMonthTitle(month: Date, locale = "uz-UZ"): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
}

export function formatDayTitle(date: Date, locale = "uz-UZ"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function resolveInitialMonth(lessons: Lesson[], now = new Date()): Date {
  if (!lessons.length) return startOfMonth(now);

  const sorted = [...lessons].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const hasCurrentMonth = sorted.some((lesson) => isSameMonth(new Date(lesson.startsAt), now));
  if (hasCurrentMonth) return startOfMonth(now);

  const upcoming = sorted.find((lesson) => new Date(lesson.startsAt) >= now);
  return startOfMonth(new Date((upcoming ?? sorted[sorted.length - 1]).startsAt));
}
