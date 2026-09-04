/**
 * `lesson` modulining mobil barrel'i.
 *
 * Veb `src/modules/lesson/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { lessonApi } from "./api/lesson.api";
export type {
  LessonDto,
  LessonFormInput,
  LessonRateRequestDto,
  LessonRatingDto,
  LessonRatingInput,
  LessonRecordingDto,
  LessonRequestDto,
} from "./api/lesson.dto";
export {
  mapLessonDto,
  mapLessonPage,
  mapLessonRatingDto,
  mapLessonRatingList,
  mapLessonRatingRequest,
  mapLessonRecordingDto,
  mapLessonRequest,
} from "./lib/lesson.mappers";
export {
  lessonKeys,
  useLesson,
  useLessons,
  useLessonPage,
  useLessonRatings,
  useLessonRecording,
  useLiveLesson,
  useLiveLessons,
  useCreateLesson,
  useCreateLessonSchedule,
  useDeleteLesson,
  useDeleteRecording,
  useFinishLesson,
  useRateLesson,
  useUpdateLesson,
} from "./model/lesson.queries";
export { useLessonView, useLessonViewStore } from "./model/lesson-view.store";
export type { LessonView } from "./model/lesson-view.store";
export {
  buildMonthGrid,
  formatDayTitle,
  formatMonthTitle,
  groupLessonsByDay,
  resolveInitialMonth,
  toDayKey,
  WEEKDAY_LABELS,
} from "./lib/lesson-calendar";
export type { CalendarDay } from "./lib/lesson-calendar";
export {
  CLOSED_LESSON_STATUSES,
  isLessonClosed,
  lessonStatusMeta,
} from "./lib/lesson-status";
export {
  addMinutesToTime,
  buildScheduleDates,
  EVEN_WEEKDAYS,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  MAX_SCHEDULE_LESSONS,
  MAX_SCHEDULE_WEEKS,
  ODD_WEEKDAYS,
  toBackendWeekdays,
  WEEKDAYS,
  weeksBetween,
} from "./lib/lesson-schedule";
export type { ConflictQuery, ScheduleInput, Weekday } from "./lib/lesson-schedule";
export type { LessonStatusMeta } from "./lib/lesson-status";

// --- Mobil UI ---
export { LessonCalendar } from "./ui/lesson-calendar";
export type { LessonCalendarProps } from "./ui/lesson-calendar";
export { LessonCard } from "./ui/lesson-card";
export type { LessonCardProps } from "./ui/lesson-card";
export { FinishLessonSheet, LessonRatingsSheet, RateLessonSheet } from "./ui/lesson-sheets";
export { RatingSummary, StarRating } from "./ui/star-rating";
export type { StarRatingProps } from "./ui/star-rating";

