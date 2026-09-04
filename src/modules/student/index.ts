/**
 * `student` modulining mobil barrel'i.
 *
 * Veb `src/modules/student/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { studentApi } from "./api/student.api";
export type {
  StudentAssignmentPreview,
  StudentDashboard,
  StudentMetric,
  StudentNextLesson,
} from "./api/student.dto";
export { studentKeys, useStudentDashboard } from "./model/student.queries";
