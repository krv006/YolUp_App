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

/** Hafta dushanbadan boshlanadi — O'zbekistondagi odat. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export const WEEKDAY_LABELS = ["Du", "Se", "Chor", "Pay", "Jum", "Shan", "Yak"] as const;

export interface CalendarDay {
  /** `yyyy-MM-dd` — React kaliti va tanlangan kunni solishtirish uchun. */
  key: string;
  date: Date;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  lessons: Lesson[];
}

/** Mahalliy vaqt bo'yicha `yyyy-MM-dd`. `toISOString()` UTC'ga surib yuboradi. */
export function toDayKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Darslarni kun bo'yicha indekslaydi, har kun ichida vaqt bo'yicha saralaydi. */
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

/**
 * Oyning to'liq panjarasi: oldingi/keyingi oyning "quyruq" kunlari bilan
 * to'ldirilgan, ya'ni panjara har doim butun haftalardan iborat bo'ladi.
 */
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

export function formatMonthTitle(month: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", { month: "long", year: "numeric" }).format(month);
}

export function formatDayTitle(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/**
 * Ochiladigan oy: darslar orasida bugungi kun bo'lsa shu oy, aks holda eng
 * yaqin kelayotgan dars oyi, u ham bo'lmasa oxirgi dars oyi.
 */
export function resolveInitialMonth(lessons: Lesson[], now = new Date()): Date {
  if (!lessons.length) return startOfMonth(now);

  const sorted = [...lessons].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const hasCurrentMonth = sorted.some((lesson) => isSameMonth(new Date(lesson.startsAt), now));
  if (hasCurrentMonth) return startOfMonth(now);

  const upcoming = sorted.find((lesson) => new Date(lesson.startsAt) >= now);
  return startOfMonth(new Date((upcoming ?? sorted[sorted.length - 1]).startsAt));
}
