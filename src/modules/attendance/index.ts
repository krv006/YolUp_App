/**
 * `attendance` modulining mobil barrel'i.
 *
 * Veb `src/modules/attendance/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { attendanceApi } from "./api/attendance.api";
export type { AttendanceDto, FocusExitDto, FocusJournalDto } from "./api/attendance.dto";
export { mapAttendanceDto, mapAttendancePage } from "./lib/attendance.mappers";
export { attendanceKeys, useAttendance, useAttendancePage, useAttendanceSummary } from "./model/attendance.queries";
export { groupAttendanceByLesson } from "./lib/group-by-lesson";
export { averageFocus, buildLessonRoster, LATE_AFTER_MINUTES } from "./lib/lesson-roster";
export type { RosterEntry, RosterStatus } from "./lib/lesson-roster";
export type { LessonAttendanceGroup } from "./lib/group-by-lesson";

// --- Mobil UI ---
export { AttendanceList } from "./ui/attendance-list";
export type { AttendanceListProps } from "./ui/attendance-list";
