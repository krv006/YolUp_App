import type { Lesson } from "@/shared/types";

/**
 * Takrorlanuvchi dars jadvali va vaqt to'qnashuvi.
 *
 * Sana/vaqt bilan ishlashda ataylab "naive" (mintaqasiz) qiymatlar
 * ishlatiladi: `mapLessonDto` backend javobini `starts_at.slice(...)` bilan
 * kesib oladi va `mapLessonRequest` ham `"<sana>T<vaqt>:00"` yuboradi.
 * Shuning uchun taqqoslash ham foydalanuvchi EKRANDA ko'rayotgan qiymatlar
 * ustida bo'ladi — aks holda "14:30" bir joyda 14:30, boshqa joyda 09:30
 * bo'lib ko'rinib qolardi.
 */

export interface Weekday {
  /** 1 = Dushanba … 7 = Yakshanba (ISO-8601). */
  value: number;
  label: string;
  short: string;
}

export const WEEKDAYS: readonly Weekday[] = Object.freeze([
  { value: 1, label: "Dushanba", short: "Du" },
  { value: 2, label: "Seshanba", short: "Se" },
  { value: 3, label: "Chorshanba", short: "Ch" },
  { value: 4, label: "Payshanba", short: "Pa" },
  { value: 5, label: "Juma", short: "Ju" },
  { value: 6, label: "Shanba", short: "Sh" },
  { value: 7, label: "Yakshanba", short: "Ya" },
]);

/** Ta'limdagi odatiy taqsimot. */
export const ODD_WEEKDAYS: readonly number[] = Object.freeze([1, 3, 5]);
export const EVEN_WEEKDAYS: readonly number[] = Object.freeze([2, 4, 6]);

/** Bir marta yaratiladigan darslar chegarasi — tasodifiy 500 ta dars bo'lib ketmasin. */
export const MAX_SCHEDULE_LESSONS = 120;

export interface ScheduleInput {
  /** `YYYY-MM-DD` */
  startsOn: string;
  /** `YYYY-MM-DD` — shu kun ham kiradi. */
  endsOn: string;
  /** ISO hafta kunlari: 1 = Dushanba … 7 = Yakshanba. */
  weekdays: readonly number[];
}

function parseDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `Date.getUTCDay()` yakshanbani 0 deb beradi, bizga ISO tartibi kerak. */
function isoWeekday(date: Date): number {
  return date.getUTCDay() === 0 ? 7 : date.getUTCDay();
}

/**
 * Oraliqdagi mos hafta kunlariga to'g'ri keladigan sanalar.
 * Noto'g'ri oraliq yoki bo'sh kunlar tanlovida — bo'sh massiv.
 */
export function buildScheduleDates({ startsOn, endsOn, weekdays }: ScheduleInput): string[] {
  const start = parseDate(startsOn);
  const end = parseDate(endsOn);
  if (!start || !end || !weekdays.length || end < start) return [];

  const wanted = new Set(weekdays);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < MAX_SCHEDULE_LESSONS) {
    if (wanted.has(isoWeekday(cursor))) dates.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Sana + vaqtni taqqoslash uchun daqiqaga aylantiradi.
 * `Date.UTC` faqat chiziqli shkala sifatida ishlatiladi — mintaqa va yozgi
 * vaqt siljishlari taqqoslashga aralashmasligi uchun.
 */
function toMinutes(date: string, time: string): number | null {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || "").split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return Date.UTC(year, month - 1, day, hours, minutes) / 60_000;
}

/** Ikki oraliq kesishadimi. Chegara tegib turishi (14:00 tugadi — 14:00 boshlandi) to'qnashuv emas. */
function overlaps(startA: number, lengthA: number, startB: number, lengthB: number): boolean {
  return startA < startB + lengthB && startB < startA + lengthA;
}

export interface ConflictQuery {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm` */
  time: string;
  durationMinutes: number;
  /** Darsni tahrirlashda o'zini to'qnashuv deb hisoblamaslik uchun. */
  excludeLessonId?: string | null;
}

/**
 * Berilgan vaqtda band bo'lgan darslar.
 *
 * `lessons` — o'qituvchining BARCHA darslari (hamma kurslari bo'yicha), shuning
 * uchun boshqa guruhdagi dars ham topiladi. Bekor qilingan darslar hisobga
 * olinmaydi.
 *
 * CHEKLOV: bu faqat shu o'qituvchining darslarini ko'radi. O'quvchining boshqa
 * o'qituvchidagi darsi bilan to'qnashuvini aniqlash uchun server tomonda
 * tekshirish kerak.
 */
export function findScheduleConflicts(
  lessons: readonly Lesson[],
  { date, time, durationMinutes, excludeLessonId = null }: ConflictQuery
): Lesson[] {
  const start = toMinutes(date, time);
  if (start === null || !durationMinutes) return [];

  return lessons.filter((lesson) => {
    if (lesson.id === excludeLessonId) return false;
    if (lesson.status === "cancelled") return false;
    const other = toMinutes(lesson.date, lesson.time);
    if (other === null) return false;
    return overlaps(start, durationMinutes, other, lesson.durationMinutes || 0);
  });
}

/** Backend `days` ni 0..6 (0 = Dushanba) kutadi, ilova ichida ISO 1..7. */
export function toBackendWeekdays(weekdays: readonly number[]): number[] {
  return [...weekdays].sort((a, b) => a - b).map((day) => day - 1);
}

/** Backendning eng katta qiymati — 52 hafta. */
export const MAX_SCHEDULE_WEEKS = 52;

/**
 * Sana oralig'ini hafta soniga aylantiradi.
 *
 * Foydalanuvchi "dan–gacha" tanlaydi, backend esa `start_date` + `weeks`
 * kutadi. Yuqoriga yaxlitlanadi — oxirgi hafta to'liq bo'lmasa ham, undagi
 * kunlar tushib qolmasligi kerak.
 */
export function weeksBetween(startsOn: string, endsOn: string): number {
  const start = parseDate(startsOn);
  const end = parseDate(endsOn);
  if (!start || !end || end < start) return 0;
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Math.min(MAX_SCHEDULE_WEEKS, Math.max(1, Math.ceil(days / 7)));
}

/** `HH:mm` + daqiqa → `HH:mm`. Sutkadan oshsa 23:59 da to'xtaydi. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = (time || "").split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return time;
  const total = Math.min(23 * 60 + 59, hours * 60 + mins + (minutes || 0));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Jadvaldagi har bir sana uchun to'qnashuvlar — bittasi ham o'tkazib yuborilmasin. */
export function findScheduleConflictsForDates(
  lessons: readonly Lesson[],
  dates: readonly string[],
  time: string,
  durationMinutes: number
): Array<{ date: string; conflicts: Lesson[] }> {
  return dates
    .map((date) => ({ date, conflicts: findScheduleConflicts(lessons, { date, time, durationMinutes }) }))
    .filter((item) => item.conflicts.length > 0);
}
