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
  useLessonWaiting,
  useLessonConflicts,
  useShareRecording,
  useLiveLesson,
  useLiveLessons,
  useCancelLesson,
  useCreateLesson,
  useCreateLessonSchedule,
  useDeleteLesson,
  useDeleteRecording,
  useFinishLesson,
  useRateLesson,
  useLessonReminder,
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
} from "./lib/lesson-calendar";
export type { CalendarDay } from "./lib/lesson-calendar";
export {
  CLOSED_LESSON_STATUSES,
  hasLessonTopic,
  isLessonClosed,
  isLessonEditable,
  isLessonJoinable,
  useLessonStatusMeta,
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
export { LessonActions } from "./ui/lesson-actions";
export type { LessonActionsProps } from "./ui/lesson-actions";
export { LessonList } from "./ui/lesson-list";
export { LessonViewSwitch } from "./ui/lesson-view-switch";
export type { LessonListProps } from "./ui/lesson-list";
export { FinishLessonSheet, LessonRatingsSheet, RateLessonSheet } from "./ui/lesson-sheets";
export { RatingSummary, StarRating } from "./ui/star-rating";
export { LessonRatingForm } from "./ui/lesson-rating-form";
export type { StarRatingProps } from "./ui/star-rating";

export { useScheduleStore } from "./model/schedule.store";
export type { ScheduleView } from "./model/schedule.store";
