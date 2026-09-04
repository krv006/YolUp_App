import type { LessonStatus, UserDto } from "@/shared/types";

/** `GET /api/v1/lessons/` — bitta dars. */
export interface LessonDto {
  id: string | number;
  course: string | number;
  course_title: string;
  title: string;
  starts_at: string;
  duration_min: number;
  status: LessonStatus;
  room_name: string;
  created_at: string;
  /** DRF `DecimalField`ni matn sifatida ham qaytarishi mumkin — ikkalasi ham qabul qilinadi. */
  avg_rating?: number | string | null;
  rating_count?: number | null;
}

/** `POST/PATCH /api/v1/lessons/` tanasi. */
export interface LessonRequestDto {
  course: string | null;
  title: string;
  starts_at: string;
  duration_min: number;
}

/** `status`: egress hali yozmoqda / tugadi / xato (docs/COMPLETED_WORK.md §1). */
export type RecordingStatusDto = "recording" | "merging" | "completed" | "failed";

/**
 * `GET /api/v1/lessons/<id>/recording/` javobi.
 *
 * Yozuv bo'lmasa backend 404 qaytaradi. `stream_url` faqat `ready: true` bo'lganda
 * keladi va u MUDDATLI imzolangan havola (3 soat) — saqlab qo'yib bo'lmaydi.
 */
export interface LessonRecordingDto {
  lesson_id?: string;
  title?: string | null;
  status?: RecordingStatusDto | null;
  ready?: boolean | null;
  created_at?: string | null;
  ended_at?: string | null;
  error?: string | null;
  stream_url?: string | null;
}

/**
 * `GET /api/v1/lessons/{id}/ratings/` — bitta baho.
 *
 * Baho anonim emas, shuning uchun `student` keladi. Ba'zi backend versiyalari
 * to'liq obyekt o'rniga faqat `student_name` beradi — ikkalasi ham qo'llanadi.
 */
export interface LessonRatingDto {
  id: string | number;
  lesson?: string | number;
  student?: UserDto | null;
  student_name?: string | null;
  stars: number;
  description?: string | null;
  created_at: string;
}

/** `POST /api/v1/lessons/{id}/rate/` tanasi. */
export interface LessonRateRequestDto {
  stars: number;
  description?: string;
}

/** Baholash formasi — `LessonRatingForm` yuboradigan shakl. */
export interface LessonRatingInput {
  stars: number;
  description?: string;
}

/**
 * `POST /api/v1/courses/{id}/schedule/` tanasi (docs/STAFF_API.md §2).
 *
 * `days` — 0..6. Backend Python `datetime.weekday()` tartibida deb qabul
 * qilinadi: 0 = Dushanba … 6 = Yakshanba. Ilova ichida ISO tartibi (1..7)
 * ishlatiladi, shuning uchun yuborishdan oldin bittaga kamaytiriladi.
 */
export interface LessonScheduleRequestDto {
  title: string;
  days: number[];
  /** `HH:mm` */
  start_time: string;
  /** `HH:mm` — boshlanish + davomiylik. */
  end_time: string;
  /** 1..52 */
  weeks: number;
  /** `YYYY-MM-DD` */
  start_date: string;
  note?: string;
}

/** Jadval javobi: yaratilgan darslar soni va ro'yxati. */
export interface LessonScheduleResponseDto {
  count?: number;
  lessons?: LessonDto[];
}

/** Dars formasi — `AddLessonDialog` yuboradigan shakl. */
export interface LessonFormInput {
  courseId?: string | null;
  topic?: string;
  title?: string;
  startsAt?: string;
  date?: string;
  time?: string;
  duration?: string | number;
  durationMinutes?: string | number;
}
