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
  ResubmitRequestInput,
} from "./api/homework.dto";
export { HOMEWORK_EXTENSIONS, HOMEWORK_MAX_FILE_SIZE, HOMEWORK_SKILLS } from "./constants/homework.constants";
export { defaultMaxScore, mapAiResultDto, mapAssignmentDto, mapAssignmentRequest, mapHomeworkReportDto, mapSubmissionDto } from "./lib/homework.mappers";
export { validateHomeworkFile } from "./lib/homework-validation";
export { getHomeworkPollingInterval, homeworkKeys, useAssignmentAiSummary, useHomeworkAiStats, useRemindAssignment, useRequestResubmit, useAssignment, useAssignments, useSubmission, useCreateAssignment, useDeleteAssignment, useDownloadAssignmentFile, useHomeworkBoard, useSaveHomeworkBoard, useSubmitHomeworkBoard, useDownloadSubmissionFile, useHomeworkReport, useRecheckSubmission, useReviewSubmission, useSubmitHomework, useUpdateAssignment } from "./model/homework.queries";
export { useHomeworkBoardSource } from "./model/use-homework-board";
export type { HomeworkBoardSaveState } from "./model/use-homework-board";

// --- Mobil UI ---
export { HomeworkReportView } from "./ui/homework-report-view";
export { HomeworkResultSheet } from "./ui/homework-result-sheet";
export { SubmissionReviewSheet } from "./ui/submission-review-sheet";

export { homeworkFieldError } from "./lib/homework-errors";
