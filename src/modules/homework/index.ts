/**
 * `homework` modulining mobil barrel'i.
 *
 * Veb `src/modules/homework/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { homeworkApi } from "./api/homework.api";
export type {
  AiResultDto,
  AssignmentDto,
  AssignmentFormInput,
  HomeworkCourseReportDto,
  HomeworkReportDto,
  SubmissionDto,
  SubmissionReviewInput,
} from "./api/homework.dto";
export { HOMEWORK_EXTENSIONS, HOMEWORK_MAX_FILE_SIZE, HOMEWORK_SKILLS } from "./constants/homework.constants";
export { mapAiResultDto, mapAssignmentDto, mapAssignmentRequest, mapHomeworkReportDto, mapSubmissionDto } from "./lib/homework.mappers";
export { validateHomeworkFile } from "./lib/homework-validation";
export { getHomeworkPollingInterval, homeworkKeys, useAssignment, useAssignments, useSubmission, useCreateAssignment, useDeleteAssignment, useDownloadAssignmentFile, useDownloadSubmissionFile, useHomeworkReport, useRecheckSubmission, useReviewSubmission, useSubmitHomework } from "./model/homework.queries";

// --- Mobil UI ---
export { HomeworkReportView } from "./ui/homework-report-view";
export { HomeworkResultSheet } from "./ui/homework-result-sheet";
export { SubmissionReviewSheet } from "./ui/submission-review-sheet";

