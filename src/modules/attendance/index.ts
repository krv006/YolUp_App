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
export { attendanceKeys, useAttendance, useAttendancePage } from "./model/attendance.queries";
export { groupAttendanceByLesson } from "./lib/group-by-lesson";
export type { LessonAttendanceGroup } from "./lib/group-by-lesson";
