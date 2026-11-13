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
  HomeworkAnswerInput,
  HomeworkQuestionInput,
} from "./api/homework.dto";
export { HOMEWORK_EXTENSIONS, HOMEWORK_MAX_FILE_SIZE, HOMEWORK_SKILLS } from "./constants/homework.constants";
export { defaultMaxScore, mapAiResultDto, mapAssignmentDto, mapAssignmentRequest, mapHomeworkReportDto, mapSubmissionDto } from "./lib/homework.mappers";
export { validateHomeworkFile } from "./lib/homework-validation";
export { getHomeworkPollingInterval, homeworkKeys, useAssignmentAiSummary, useHomeworkAiStats, useRemindAssignment, useRequestResubmit, useAssignment, useAssignments, useSubmission, useCreateAssignment, useDeleteAssignment, useDownloadAssignmentFile, useHomeworkBoard, useHomeworkDraft, useSaveHomeworkDraft, useSaveHomeworkBoard, useSubmitHomeworkBoard, useDownloadSubmissionFile, useHomeworkReport, useRecheckSubmission, useReviewSubmission, useSubmitHomework, useUpdateAssignment, useHomeworkBank, useAssignFromBank, useAssignmentAudience, useSetAssignmentAudience } from "./model/homework.queries";
export { submissionAiState } from "./lib/submission-ai-state";
export { googleFormUrlInvalid, isGoogleFormUrl } from "./lib/google-form";
export {
  draftsFromQuestions,
  isTestQuestion,
  questionIssue,
  toQuestionInputs,
  totalPoints,
} from "./lib/homework-questions";
export type { DraftQuestion } from "./lib/homework-questions";
export { useQuestionDrafts } from "./model/use-question-drafts";
export { answerInputs, isAnswered } from "./lib/homework-answers";
export type { AnswerDraft } from "./lib/homework-answers";
export { formatGradeValue, gradePercent } from "./lib/grade-display";
export type { AssignFromBankInput, AssignmentAudience, AssignTarget } from "./api/homework.dto";
export { useHomeworkBoardSource } from "./model/use-homework-board";
export type { HomeworkBoardSaveState } from "./model/use-homework-board";

// --- Mobil UI ---
export { HomeworkMessageCard } from "./ui/homework-message-card";
export { HomeworkResultDialog } from "./ui/homework-result-dialog";
export type { HomeworkResultDialogProps } from "./ui/homework-result-dialog";
export type { HomeworkMessageCardProps } from "./ui/homework-message-card";
export { HomeworkReportView } from "./ui/homework-report-view";
export { HomeworkResultSheet } from "./ui/homework-result-sheet";
export { SubmissionReviewSheet } from "./ui/submission-review-sheet";

export { homeworkFieldError } from "./lib/homework-errors";
